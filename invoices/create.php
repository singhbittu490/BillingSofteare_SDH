<?php
/**
 * SmartBill - Create GST Invoice
 * Full-featured dynamic invoicing with automatic tax splitting and inventory deduction
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Create GST Invoice - SmartBill';
$company = getCompanySettings($pdo);
$states = getIndianStates();

// Generate next invoice number
$next_invoice_number = generateNextInvoiceNumber($pdo);

// Pre-load customers and products
$customers = $pdo->query("SELECT * FROM customers ORDER BY name ASC")->fetchAll();
$products = $pdo->query("SELECT * FROM products ORDER BY name ASC")->fetchAll();

$error = '';
$preselected_customer_id = (int)($_GET['customer_id'] ?? 0);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCSRFToken($token)) {
        $error = 'Invalid security token.';
    } else {
        try {
            $pdo->beginTransaction();

            $customer_id = (int)($_POST['customer_id'] ?? 0);
            $customer_name = trim($_POST['customer_name'] ?? '');
            $customer_gstin = strtoupper(trim($_POST['customer_gstin'] ?? ''));
            $customer_address = trim($_POST['customer_address'] ?? '');
            $customer_state = trim($_POST['customer_state'] ?? '');
            $customer_state_code = trim($_POST['customer_state_code'] ?? '');

            // If existing customer chosen, fetch accurate details
            if ($customer_id > 0) {
                $c_stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
                $c_stmt->execute([$customer_id]);
                $c_data = $c_stmt->fetch();
                if ($c_data) {
                    $customer_name = $c_data['name'];
                    if (empty($customer_gstin)) $customer_gstin = $c_data['gstin'];
                    if (empty($customer_address)) $customer_address = $c_data['billing_address'];
                    if (empty($customer_state)) $customer_state = $c_data['state'];
                    if (empty($customer_state_code)) $customer_state_code = $c_data['state_code'];
                }
            }

            if (empty($customer_name)) {
                throw new Exception('Customer name is required.');
            }

            $invoice_number = trim($_POST['invoice_number'] ?? $next_invoice_number);
            $invoice_date = $_POST['invoice_date'] ?? date('Y-m-d');
            $due_date = !empty($_POST['due_date']) ? $_POST['due_date'] : $invoice_date;
            $place_of_supply = trim($_POST['place_of_supply'] ?? $company['state']);
            $reverse_charge = ($_POST['reverse_charge'] ?? 'No') === 'Yes' ? 'Yes' : 'No';
            $notes = trim($_POST['notes'] ?? '');
            $terms_conditions = trim($_POST['terms_conditions'] ?? $company['terms_conditions']);
            $invoice_discount = (float)($_POST['invoice_discount'] ?? 0);

            $items = $_POST['items'] ?? [];
            if (empty($items) || !is_array($items)) {
                throw new Exception('At least one line item is required.');
            }

            // Determine if Intra-State (CGST + SGST) or Inter-State (IGST)
            $company_state = strtolower(trim($company['state'] ?? ''));
            $supply_state = strtolower(trim($place_of_supply));
            $is_intra_state = (empty($company_state) || empty($supply_state) || strpos($supply_state, $company_state) !== false || strpos($company_state, $supply_state) !== false);

            $subtotal = 0;
            $taxable_amount = 0;
            $total_cgst = 0;
            $total_sgst = 0;
            $total_igst = 0;

            // First validate items
            $processed_items = [];
            foreach ($items as $item) {
                $product_id = !empty($item['product_id']) ? (int)$item['product_id'] : null;
                $product_name = trim($item['product_name'] ?? '');
                
                // If product_id given, get official name if empty
                if ($product_id > 0 && empty($product_name)) {
                    $p_stmt = $pdo->prepare("SELECT name, hsn_sac FROM products WHERE id = ?");
                    $p_stmt->execute([$product_id]);
                    $p_row = $p_stmt->fetch();
                    if ($p_row) {
                        $product_name = $p_row['name'];
                        if (empty($item['hsn_sac'])) $item['hsn_sac'] = $p_row['hsn_sac'];
                    }
                }

                if (empty($product_name)) continue;

                $hsn_sac = trim($item['hsn_sac'] ?? '');
                $quantity = max(0.01, (float)($item['quantity'] ?? 1));
                $unit = trim($item['unit'] ?? 'PCS');
                $rate = max(0, (float)($item['rate'] ?? 0));
                $discount = max(0, (float)($item['discount'] ?? 0));
                $gst_rate = max(0, (float)($item['gst_rate'] ?? 0));

                $line_gross = $quantity * $rate;
                $line_taxable = max(0, $line_gross - $discount);

                $line_cgst = 0;
                $line_sgst = 0;
                $line_igst = 0;

                if ($is_intra_state) {
                    $half_rate = $gst_rate / 2;
                    $line_cgst = ($line_taxable * $half_rate) / 100;
                    $line_sgst = ($line_taxable * $half_rate) / 100;
                } else {
                    $line_igst = ($line_taxable * $gst_rate) / 100;
                }

                $line_total = $line_taxable + $line_cgst + $line_sgst + $line_igst;

                $subtotal += $line_gross;
                $taxable_amount += $line_taxable;
                $total_cgst += $line_cgst;
                $total_sgst += $line_sgst;
                $total_igst += $line_igst;

                $processed_items[] = [
                    'product_id' => $product_id,
                    'product_name' => $product_name,
                    'hsn_sac' => $hsn_sac,
                    'quantity' => $quantity,
                    'unit' => $unit,
                    'rate' => $rate,
                    'discount' => $discount,
                    'taxable_amount' => $line_taxable,
                    'gst_rate' => $gst_rate,
                    'cgst_amount' => $line_cgst,
                    'sgst_amount' => $line_sgst,
                    'igst_amount' => $line_igst,
                    'total' => $line_total
                ];
            }

            if (empty($processed_items)) {
                throw new Exception('Please enter at least one valid item with a description.');
            }

            // Adjust for invoice-level discount
            $final_taxable = max(0, $taxable_amount - $invoice_discount);
            if ($taxable_amount > 0 && $invoice_discount > 0) {
                $ratio = $final_taxable / $taxable_amount;
                $total_cgst *= $ratio;
                $total_sgst *= $ratio;
                $total_igst *= $ratio;
            }

            $total_gst = $total_cgst + $total_sgst + $total_igst;
            $exact_total = $final_taxable + $total_gst;
            $grand_total = round($exact_total);
            $round_off = $grand_total - $exact_total;

            $paid_amount = (float)($_POST['initial_paid_amount'] ?? 0);
            $outstanding_amount = max(0, $grand_total - $paid_amount);
            $status = ($paid_amount >= $grand_total) ? 'Paid' : (($paid_amount > 0) ? 'Partially Paid' : 'Unpaid');

            // Insert into invoices table
            $stmt = $pdo->prepare("
                INSERT INTO invoices (
                    invoice_number, customer_id, customer_name, customer_gstin, customer_address,
                    customer_state, customer_state_code, place_of_supply, invoice_date, due_date,
                    reverse_charge, subtotal, discount, taxable_amount, cgst, sgst, igst,
                    round_off, grand_total, paid_amount, outstanding_amount, status, notes, terms_conditions
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $invoice_number, $customer_id ?: null, $customer_name, $customer_gstin, $customer_address,
                $customer_state, $customer_state_code, $place_of_supply, $invoice_date, $due_date,
                $reverse_charge, $subtotal, $invoice_discount, $final_taxable, $total_cgst, $total_sgst, $total_igst,
                $round_off, $grand_total, $paid_amount, $outstanding_amount, $status, $notes, $terms_conditions
            ]);
            $invoice_id = $pdo->lastInsertId();

            // Insert items and deduct stock
            $item_stmt = $pdo->prepare("
                INSERT INTO invoice_items (
                    invoice_id, product_id, product_name, hsn_sac, quantity, unit,
                    rate, discount, taxable_amount, gst_rate, cgst_amount, sgst_amount, igst_amount, total
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            foreach ($processed_items as $pi) {
                $item_stmt->execute([
                    $invoice_id, $pi['product_id'], $pi['product_name'], $pi['hsn_sac'], $pi['quantity'], $pi['unit'],
                    $pi['rate'], $pi['discount'], $pi['taxable_amount'], $pi['gst_rate'],
                    $pi['cgst_amount'], $pi['sgst_amount'], $pi['igst_amount'], $pi['total']
                ]);

                // Deduct stock if linked to inventory product
                if (!empty($pi['product_id'])) {
                    updateProductStock($pdo, $pi['product_id'], -$pi['quantity']);
                    recordStockMovement(
                        $pdo,
                        $pi['product_id'],
                        'sale',
                        -$pi['quantity'],
                        'invoice',
                        $invoice_number,
                        "Sale to {$customer_name}"
                    );
                }
            }

            // If initial payment recorded, create payment entry
            if ($paid_amount > 0) {
                $payment_method = $_POST['payment_method'] ?? 'Cash';
                $pmt_stmt = $pdo->prepare("
                    INSERT INTO payments (invoice_id, customer_id, payment_date, amount, payment_method, reference_number, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $pmt_stmt->execute([
                    $invoice_id,
                    $customer_id ?: null,
                    $invoice_date,
                    $paid_amount,
                    $payment_method,
                    'INIT-' . $invoice_number,
                    'Payment received at time of invoice creation'
                ]);
            }

            $pdo->commit();

            setFlash('success', "Invoice {$invoice_number} generated successfully!");
            
            // If user clicked "Save & Print"
            if (isset($_POST['save_and_print'])) {
                header("Location: print.php?id={$invoice_id}&auto_print=1");
            } else {
                header("Location: view.php?id={$invoice_id}");
            }
            exit;

        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $error = $e->getMessage();
        }
    }
}

$csrf_token = getCSRFToken();
include __DIR__ . '/../includes/header.php';
?>

<!-- Hidden company state for JS tax calculations -->
<input type="hidden" id="company_state" value="<?= htmlspecialchars($company['state'] ?? '') ?>">

<form action="create.php" method="POST" id="invoiceForm">
    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
            <h4 class="fw-bold mb-1 text-dark">Create GST Tax Invoice</h4>
            <p class="text-muted small mb-0">Generate a compliant GST invoice with automatic tax splitting (CGST/SGST vs IGST).</p>
        </div>
        <div class="d-flex gap-2">
            <a href="index.php" class="btn btn-outline-secondary btn-sm">Cancel</a>
            <button type="submit" name="save_draft" class="btn btn-outline-primary btn-sm">
                <i class="fa-solid fa-floppy-disk me-1"></i> Save Invoice
            </button>
            <button type="submit" name="save_and_print" class="btn btn-primary btn-sm shadow-sm">
                <i class="fa-solid fa-print me-1"></i> Save & Print
            </button>
        </div>
    </div>

    <?php if ($error): ?>
        <div class="alert alert-danger py-2 small mb-4">
            <i class="fa-solid fa-triangle-exclamation me-1"></i> <?= htmlspecialchars($error) ?>
        </div>
    <?php endif; ?>

    <!-- Section 1: Customer & Invoice Meta Details -->
    <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white py-3">
            <span class="fw-bold text-dark"><i class="fa-solid fa-user text-primary me-2"></i>Customer & Invoice Details</span>
        </div>
        <div class="card-body p-4">
            <div class="row g-3">
                <!-- Customer Selection -->
                <div class="col-md-5">
                    <label class="form-label">Select Customer <span class="text-danger">*</span></label>
                    <select name="customer_id" id="customer_id" class="form-select" required>
                        <option value="">-- Choose Existing Customer or Type Name Below --</option>
                        <?php foreach ($customers as $c): ?>
                            <option value="<?= $c['id'] ?>"
                                data-name="<?= htmlspecialchars($c['name']) ?>"
                                data-gstin="<?= htmlspecialchars($c['gstin'] ?? '') ?>"
                                data-address="<?= htmlspecialchars($c['billing_address'] ?? '') ?>"
                                data-state="<?= htmlspecialchars($c['state'] ?? '') ?>"
                                data-state-code="<?= htmlspecialchars($c['state_code'] ?? '') ?>"
                                <?= ($preselected_customer_id === (int)$c['id']) ? 'selected' : '' ?>>
                                <?= htmlspecialchars($c['name']) ?> <?= $c['business_name'] ? '(' . htmlspecialchars($c['business_name']) . ')' : '' ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                    <div class="mt-2">
                        <input type="text" name="customer_name" id="customer_name" class="form-control form-control-sm" placeholder="Or enter manual/walk-in customer name" required>
                    </div>
                </div>

                <div class="col-md-4">
                    <label class="form-label">Customer GSTIN</label>
                    <input type="text" name="customer_gstin" id="customer_gstin" class="form-control font-monospace" placeholder="15-digit GSTIN (optional)">
                </div>

                <div class="col-md-3">
                    <label class="form-label">Invoice Number</label>
                    <input type="text" name="invoice_number" class="form-control fw-bold font-monospace text-primary" value="<?= htmlspecialchars($next_invoice_number) ?>" required>
                </div>

                <div class="col-md-3">
                    <label class="form-label">Invoice Date</label>
                    <input type="date" name="invoice_date" class="form-control" value="<?= date('Y-m-d') ?>" required>
                </div>

                <div class="col-md-3">
                    <label class="form-label">Payment Due Date</label>
                    <input type="date" name="due_date" class="form-control" value="<?= date('Y-m-d', strtotime('+15 days')) ?>">
                </div>

                <div class="col-md-4">
                    <label class="form-label">Place of Supply (State) <span class="text-danger">*</span></label>
                    <select name="place_of_supply" id="place_of_supply" class="form-select" required>
                        <?php foreach ($states as $code => $stName): ?>
                            <option value="<?= htmlspecialchars($stName) ?>" <?= (strtolower($company['state'] ?? '') === strtolower($stName)) ? 'selected' : '' ?>>
                                <?= htmlspecialchars($stName) ?> (<?= $code ?>)
                            </option>
                        <?php endforeach; ?>
                    </select>
                    <div class="form-text small">Same state = CGST + SGST. Different state = IGST.</div>
                </div>

                <div class="col-md-2">
                    <label class="form-label">Reverse Charge</label>
                    <select name="reverse_charge" class="form-select">
                        <option value="No" selected>No</option>
                        <option value="Yes">Yes</option>
                    </select>
                </div>

                <div class="col-md-12">
                    <label class="form-label">Billing Address</label>
                    <input type="text" name="customer_address" id="customer_address" class="form-control" placeholder="Customer address">
                </div>
            </div>
        </div>
    </div>

    <!-- Section 2: Invoice Items Table -->
    <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <span class="fw-bold text-dark"><i class="fa-solid fa-cart-flatbed text-primary me-2"></i>Invoice Line Items</span>
            <button type="button" class="btn btn-outline-primary btn-sm" id="addItemBtn">
                <i class="fa-solid fa-plus me-1"></i> Add Row
            </button>
        </div>
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table invoice-items-table align-middle mb-0" id="invoiceItemsTable">
                    <thead class="table-light small">
                        <tr>
                            <th style="width: 4%;" class="text-center">#</th>
                            <th style="width: 25%;">Item / Product Description</th>
                            <th style="width: 10%;">HSN/SAC</th>
                            <th style="width: 8%;" class="text-end">Qty</th>
                            <th style="width: 9%;">Unit</th>
                            <th style="width: 10%;" class="text-end">Rate (₹)</th>
                            <th style="width: 8%;" class="text-end">Disc (₹)</th>
                            <th style="width: 11%;" class="text-end">Taxable (₹)</th>
                            <th style="width: 8%;">GST %</th>
                            <th style="width: 11%;" class="text-end">Total (₹)</th>
                            <th style="width: 4%;" class="text-center"><i class="fa-solid fa-trash"></i></th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- First Default Row -->
                        <tr class="item-row">
                            <td class="text-center row-number align-middle">1</td>
                            <td>
                                <select name="items[0][product_id]" class="form-select form-select-sm product-select" required>
                                    <option value="">-- Choose Product or Custom Item --</option>
                                    <?php foreach ($products as $p): ?>
                                        <option value="<?= $p['id'] ?>"
                                            data-name="<?= htmlspecialchars($p['name']) ?>"
                                            data-price="<?= (float)$p['selling_price'] ?>"
                                            data-hsn="<?= htmlspecialchars($p['hsn_sac'] ?? '') ?>"
                                            data-unit="<?= htmlspecialchars($p['unit'] ?? 'PCS') ?>"
                                            data-gst="<?= (float)$p['gst_rate'] ?>">
                                            <?= htmlspecialchars($p['name']) ?> (₹<?= number_format((float)$p['selling_price'], 2) ?>)
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <input type="hidden" name="items[0][product_name]" class="product-name-input">
                            </td>
                            <td>
                                <input type="text" name="items[0][hsn_sac]" class="form-control form-control-sm hsn-input" placeholder="HSN/SAC">
                            </td>
                            <td>
                                <input type="number" name="items[0][quantity]" class="form-control form-control-sm text-end qty-input" value="1" min="0.01" step="any" required>
                            </td>
                            <td>
                                <select name="items[0][unit]" class="form-select form-select-sm unit-select">
                                    <option value="PCS" selected>PCS</option>
                                    <option value="KG">KG</option>
                                    <option value="GM">GM</option>
                                    <option value="LTR">LTR</option>
                                    <option value="ML">ML</option>
                                    <option value="BOX">BOX</option>
                                    <option value="MTR">MTR</option>
                                    <option value="SET">SET</option>
                                    <option value="OTHER">OTHER</option>
                                </select>
                            </td>
                            <td>
                                <input type="number" name="items[0][rate]" class="form-control form-control-sm text-end rate-input" value="0.00" min="0" step="0.01" required>
                            </td>
                            <td>
                                <input type="number" name="items[0][discount]" class="form-control form-control-sm text-end discount-input" value="0.00" min="0" step="0.01">
                            </td>
                            <td>
                                <input type="number" name="items[0][taxable_amount]" class="form-control form-control-sm text-end taxable-input" value="0.00" readonly>
                            </td>
                            <td>
                                <select name="items[0][gst_rate]" class="form-select form-select-sm gst-rate-select">
                                    <option value="0">0%</option>
                                    <option value="5">5%</option>
                                    <option value="12">12%</option>
                                    <option value="18" selected>18%</option>
                                    <option value="28">28%</option>
                                </select>
                                <input type="hidden" name="items[0][cgst]" class="cgst-input" value="0.00">
                                <input type="hidden" name="items[0][sgst]" class="sgst-input" value="0.00">
                                <input type="hidden" name="items[0][igst]" class="igst-input" value="0.00">
                            </td>
                            <td>
                                <input type="number" name="items[0][total]" class="form-control form-control-sm text-end total-input fw-semibold" value="0.00" readonly>
                            </td>
                            <td class="text-center align-middle">
                                <button type="button" class="btn btn-outline-danger btn-sm remove-row-btn" title="Remove Item">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="p-3 bg-light border-top d-flex justify-content-between align-items-center">
                <button type="button" class="btn btn-outline-primary btn-sm" id="addItemBtnBottom">
                    <i class="fa-solid fa-plus me-1"></i> Add Another Row
                </button>
                <span class="text-muted small">All line items automatically calculate GST based on place of supply.</span>
            </div>
        </div>
    </div>

    <!-- Section 3: Summary & Notes Grid -->
    <div class="row g-4 mb-4">
        <!-- Notes & Terms -->
        <div class="col-lg-7">
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-header bg-white py-2">
                    <span class="fw-bold small text-dark">Customer Notes</span>
                </div>
                <div class="card-body p-3">
                    <textarea name="notes" class="form-control" rows="2" placeholder="Notes printed on invoice for customer (e.g. Warranty details, thank you message)"></textarea>
                </div>
            </div>

            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white py-2">
                    <span class="fw-bold small text-dark">Terms & Conditions</span>
                </div>
                <div class="card-body p-3">
                    <textarea name="terms_conditions" class="form-control" rows="3"><?= htmlspecialchars($company['terms_conditions'] ?? '') ?></textarea>
                </div>
            </div>

            <!-- Instant Payment Collection -->
            <div class="card border-0 shadow-sm mt-3 bg-white">
                <div class="card-header bg-white py-2">
                    <span class="fw-bold small text-success"><i class="fa-solid fa-money-bill-wave me-1"></i>Receive Payment Now (Optional)</span>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2">
                        <div class="col-md-6">
                            <label class="form-label small">Amount Paid Now (₹)</label>
                            <input type="number" step="0.01" name="initial_paid_amount" class="form-control form-control-sm" value="0.00">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small">Payment Method</label>
                            <select name="payment_method" class="form-select form-select-sm">
                                <option value="Cash">Cash</option>
                                <option value="Bank Transfer">Bank Transfer / NEFT</option>
                                <option value="UPI">UPI / QR</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Credit Card">Credit Card</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Grand Total Breakdown -->
        <div class="col-lg-5">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white py-3">
                    <span class="fw-bold text-dark"><i class="fa-solid fa-calculator text-primary me-2"></i>Invoice Grand Summary</span>
                </div>
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between py-1 border-bottom small">
                        <span class="text-muted">Item Subtotal:</span>
                        <span class="fw-semibold" id="display_subtotal">₹0.00</span>
                    </div>

                    <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span class="text-muted small">Special Invoice Discount:</span>
                        <div class="input-group input-group-sm" style="width: 140px;">
                            <span class="input-group-text">₹</span>
                            <input type="number" step="0.01" name="invoice_discount" id="invoice_discount" class="form-control text-end" value="0.00">
                        </div>
                    </div>

                    <div class="d-flex justify-content-between py-1 border-bottom small">
                        <span class="text-muted">Net Taxable Amount:</span>
                        <span class="fw-semibold" id="display_taxable">₹0.00</span>
                    </div>

                    <!-- CGST -->
                    <div class="d-flex justify-content-between py-1 border-bottom small" id="row_cgst">
                        <span class="text-muted">Central GST (CGST):</span>
                        <span class="fw-semibold text-primary" id="display_cgst">₹0.00</span>
                    </div>

                    <!-- SGST -->
                    <div class="d-flex justify-content-between py-1 border-bottom small" id="row_sgst">
                        <span class="text-muted">State GST (SGST):</span>
                        <span class="fw-semibold text-primary" id="display_sgst">₹0.00</span>
                    </div>

                    <!-- IGST -->
                    <div class="d-flex justify-content-between py-1 border-bottom small" id="row_igst" style="display: none;">
                        <span class="text-muted">Integrated GST (IGST):</span>
                        <span class="fw-semibold text-primary" id="display_igst">₹0.00</span>
                    </div>

                    <div class="d-flex justify-content-between py-1 border-bottom small">
                        <span class="text-muted">Round Off Adjustment:</span>
                        <span class="text-muted" id="display_round_off">0.00</span>
                    </div>

                    <div class="d-flex justify-content-between py-3 fs-5 fw-bold bg-light px-3 rounded mt-2">
                        <span class="text-dark">Grand Total:</span>
                        <span class="text-primary" id="display_grand_total">₹0.00</span>
                    </div>

                    <!-- Hidden Inputs for form submit -->
                    <input type="hidden" name="subtotal" id="input_subtotal" value="0.00">
                    <input type="hidden" name="taxable_amount" id="input_taxable" value="0.00">
                    <input type="hidden" name="cgst" id="input_cgst" value="0.00">
                    <input type="hidden" name="sgst" id="input_sgst" value="0.00">
                    <input type="hidden" name="igst" id="input_igst" value="0.00">
                    <input type="hidden" name="grand_total" id="input_grand_total" value="0.00">

                    <div class="mt-4">
                        <button type="submit" name="save_and_print" class="btn btn-primary w-100 py-2 fw-semibold mb-2 shadow-sm">
                            <i class="fa-solid fa-print me-2"></i> Save & Generate Tax Invoice
                        </button>
                        <button type="submit" name="save_draft" class="btn btn-outline-secondary w-100 py-2">
                            <i class="fa-solid fa-floppy-disk me-2"></i> Save As Unpaid
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</form>

<script>
document.getElementById('addItemBtnBottom')?.addEventListener('click', () => {
    document.getElementById('addItemBtn')?.click();
});

// Auto-populate customer name field when dropdown changes
document.getElementById('customer_id')?.addEventListener('change', function() {
    const opt = this.options[this.selectedIndex];
    if (opt && opt.value) {
        document.getElementById('customer_name').value = opt.getAttribute('data-name');
    }
});
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
