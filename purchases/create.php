<?php
/**
 * SmartBill - Record Vendor Purchase Bill
 * Increases product inventory stock automatically and logs to stock movements
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Record Purchase - SmartBill';
$suppliers = $pdo->query("SELECT * FROM suppliers ORDER BY name ASC")->fetchAll();
$products = $pdo->query("SELECT * FROM products ORDER BY name ASC")->fetchAll();

$error = '';
$preselected_supplier_id = (int)($_GET['supplier_id'] ?? 0);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCSRFToken($token)) {
        $error = 'Invalid security token.';
    } else {
        try {
            $pdo->beginTransaction();

            $supplier_id = !empty($_POST['supplier_id']) ? (int)$_POST['supplier_id'] : null;
            $supplier_bill_number = trim($_POST['supplier_bill_number'] ?? '');
            $purchase_date = $_POST['purchase_date'] ?? date('Y-m-d');
            $payment_status = $_POST['payment_status'] ?? 'Paid';
            $notes = trim($_POST['notes'] ?? '');

            // Auto purchase number
            $stmt = $pdo->query("SELECT COUNT(*) FROM purchases");
            $count = (int)$stmt->fetchColumn() + 1;
            $purchase_number = 'PUR-' . date('Y') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

            $items = $_POST['items'] ?? [];
            if (empty($items) || !is_array($items)) {
                throw new Exception('At least one item is required in the purchase bill.');
            }

            $subtotal = 0;
            $tax_amount = 0;
            $processed_items = [];

            foreach ($items as $it) {
                $product_id = (int)($it['product_id'] ?? 0);
                $qty = (float)($it['quantity'] ?? 0);
                $rate = (float)($it['rate'] ?? 0);
                $gst_rate = (float)($it['gst_rate'] ?? 0);

                if ($product_id <= 0 || $qty <= 0) continue;

                $line_subtotal = $qty * $rate;
                $line_tax = ($line_subtotal * $gst_rate) / 100;
                $line_total = $line_subtotal + $line_tax;

                $subtotal += $line_subtotal;
                $tax_amount += $line_tax;

                $processed_items[] = [
                    'product_id' => $product_id,
                    'quantity' => $qty,
                    'purchase_price' => $rate,
                    'gst_rate' => $gst_rate,
                    'total' => $line_total
                ];
            }

            if (empty($processed_items)) {
                throw new Exception('Please select at least one valid product with quantity.');
            }

            $grand_total = $subtotal + $tax_amount;

            // Insert into purchases
            $stmt = $pdo->prepare("
                INSERT INTO purchases (purchase_number, supplier_id, supplier_bill_number, purchase_date, subtotal, tax_amount, grand_total, payment_status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $purchase_number, $supplier_id, $supplier_bill_number, $purchase_date,
                $subtotal, $tax_amount, $grand_total, $payment_status, $notes
            ]);
            $purchase_id = $pdo->lastInsertId();

            // Insert items & increment stock
            $item_stmt = $pdo->prepare("
                INSERT INTO purchase_items (purchase_id, product_id, quantity, purchase_price, gst_rate, total)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            foreach ($processed_items as $pi) {
                $item_stmt->execute([
                    $purchase_id, $pi['product_id'], $pi['quantity'], $pi['purchase_price'], $pi['gst_rate'], $pi['total']
                ]);

                // Increment stock
                updateProductStock($pdo, $pi['product_id'], $pi['quantity']);

                // Record movement
                recordStockMovement(
                    $pdo,
                    $pi['product_id'],
                    'purchase',
                    $pi['quantity'],
                    'purchase',
                    $purchase_number,
                    "Inward receipt from bill #{$supplier_bill_number}"
                );
            }

            $pdo->commit();
            setFlash('success', "Purchase bill {$purchase_number} recorded and product stock added to inventory!");
            header("Location: view.php?id=" . $purchase_id);
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

<form action="create.php" method="POST" id="purchaseForm">
    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h4 class="fw-bold mb-1 text-dark">Record Inward Purchase Bill</h4>
            <p class="text-muted small mb-0">Record vendor inventory acquisitions and auto-replenish stock levels.</p>
        </div>
        <div class="d-flex gap-2">
            <a href="index.php" class="btn btn-outline-secondary btn-sm">Cancel</a>
            <button type="submit" class="btn btn-primary btn-sm">
                <i class="fa-solid fa-check me-1"></i> Save Purchase
            </button>
        </div>
    </div>

    <?php if ($error): ?>
        <div class="alert alert-danger py-2 small mb-4"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white py-3">
            <span class="fw-bold text-dark"><i class="fa-solid fa-truck text-primary me-2"></i>Vendor & Bill Information</span>
        </div>
        <div class="card-body p-4">
            <div class="row g-3">
                <div class="col-md-4">
                    <label class="form-label">Vendor / Supplier <span class="text-danger">*</span></label>
                    <select name="supplier_id" class="form-select" required>
                        <option value="">-- Choose Supplier --</option>
                        <?php foreach ($suppliers as $s): ?>
                            <option value="<?= $s['id'] ?>" <?= ($preselected_supplier_id === (int)$s['id']) ? 'selected' : '' ?>>
                                <?= htmlspecialchars($s['name']) ?> <?= $s['company_name'] ? '(' . htmlspecialchars($s['company_name']) . ')' : '' ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Vendor Invoice / Bill No.</label>
                    <input type="text" name="supplier_bill_number" class="form-control font-monospace" placeholder="e.g. VEN-9821">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Purchase Date</label>
                    <input type="date" name="purchase_date" class="form-control" value="<?= date('Y-m-d') ?>" required>
                </div>
                <div class="col-md-2">
                    <label class="form-label">Payment Status</label>
                    <select name="payment_status" class="form-select">
                        <option value="Paid" selected>Paid</option>
                        <option value="Unpaid">Unpaid / Credit</option>
                    </select>
                </div>
            </div>
        </div>
    </div>

    <!-- Purchase Items -->
    <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <span class="fw-bold text-dark"><i class="fa-solid fa-boxes-stacked text-primary me-2"></i>Purchased Items</span>
            <button type="button" class="btn btn-outline-primary btn-sm" id="addPurRowBtn">
                <i class="fa-solid fa-plus me-1"></i> Add Row
            </button>
        </div>
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0" id="purchaseItemsTable">
                    <thead class="table-light small">
                        <tr>
                            <th style="width: 40%;">Product</th>
                            <th style="width: 15%;" class="text-end">Qty Inward</th>
                            <th style="width: 15%;" class="text-end">Cost Price (₹)</th>
                            <th style="width: 12%;">GST %</th>
                            <th style="width: 14%;" class="text-end">Total (₹)</th>
                            <th style="width: 4%;" class="text-center"><i class="fa-solid fa-trash"></i></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="pur-row">
                            <td>
                                <select name="items[0][product_id]" class="form-select form-select-sm pur-product-select" required>
                                    <option value="">-- Choose Product --</option>
                                    <?php foreach ($products as $p): ?>
                                        <option value="<?= $p['id'] ?>"
                                            data-cost="<?= (float)$p['purchase_price'] ?>"
                                            data-gst="<?= (float)$p['gst_rate'] ?>">
                                            <?= htmlspecialchars($p['name']) ?> (Stock: <?= (float)$p['current_stock'] ?> <?= htmlspecialchars($p['unit']) ?>)
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                            <td>
                                <input type="number" step="any" min="0.01" name="items[0][quantity]" class="form-control form-control-sm text-end pur-qty" value="1" required>
                            </td>
                            <td>
                                <input type="number" step="0.01" min="0" name="items[0][rate]" class="form-control form-control-sm text-end pur-cost" value="0.00" required>
                            </td>
                            <td>
                                <select name="items[0][gst_rate]" class="form-select form-select-sm pur-gst">
                                    <option value="0">0%</option>
                                    <option value="5">5%</option>
                                    <option value="12">12%</option>
                                    <option value="18" selected>18%</option>
                                    <option value="28">28%</option>
                                </select>
                            </td>
                            <td>
                                <input type="number" step="0.01" class="form-control form-control-sm text-end pur-total fw-bold" value="0.00" readonly>
                            </td>
                            <td class="text-center">
                                <button type="button" class="btn btn-outline-danger btn-sm remove-pur-row">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Notes & Totals -->
    <div class="row g-4 mb-4">
        <div class="col-md-7">
            <div class="card border-0 shadow-sm p-3">
                <label class="form-label small fw-bold">Purchase Remarks / Notes</label>
                <textarea name="notes" class="form-control" rows="3" placeholder="Reference, payment mode, delivery challan..."></textarea>
            </div>
        </div>
        <div class="col-md-5">
            <div class="card border-0 shadow-sm p-3">
                <div class="d-flex justify-content-between py-1 border-bottom small">
                    <span class="text-muted">Subtotal:</span>
                    <span class="fw-semibold" id="purDisplaySubtotal">₹0.00</span>
                </div>
                <div class="d-flex justify-content-between py-1 border-bottom small">
                    <span class="text-muted">GST Tax Amount:</span>
                    <span class="fw-semibold text-primary" id="purDisplayTax">₹0.00</span>
                </div>
                <div class="d-flex justify-content-between py-2 fw-bold fs-5 text-dark mt-2 bg-light px-2 rounded">
                    <span>Grand Total:</span>
                    <span class="text-primary" id="purDisplayGrand">₹0.00</span>
                </div>
            </div>
        </div>
    </div>
</form>

<script>
let purRowCount = 1;

function calcPurRow(row) {
    const qty = parseFloat(row.querySelector('.pur-qty').value) || 0;
    const cost = parseFloat(row.querySelector('.pur-cost').value) || 0;
    const gst = parseFloat(row.querySelector('.pur-gst').value) || 0;

    const sub = qty * cost;
    const tax = (sub * gst) / 100;
    const total = sub + tax;

    row.querySelector('.pur-total').value = total.toFixed(2);
    calcAllPur();
}

function calcAllPur() {
    let sub = 0;
    let tax = 0;

    document.querySelectorAll('.pur-row').forEach(row => {
        const q = parseFloat(row.querySelector('.pur-qty').value) || 0;
        const c = parseFloat(row.querySelector('.pur-cost').value) || 0;
        const g = parseFloat(row.querySelector('.pur-gst').value) || 0;
        const s = q * c;
        const t = (s * g) / 100;
        sub += s;
        tax += t;
    });

    document.getElementById('purDisplaySubtotal').textContent = '₹' + sub.toFixed(2);
    document.getElementById('purDisplayTax').textContent = '₹' + tax.toFixed(2);
    document.getElementById('purDisplayGrand').textContent = '₹' + (sub + tax).toFixed(2);
}

document.getElementById('purchaseItemsTable').addEventListener('input', e => {
    const row = e.target.closest('.pur-row');
    if (row) calcPurRow(row);
});

document.getElementById('purchaseItemsTable').addEventListener('change', e => {
    if (e.target.classList.contains('pur-product-select')) {
        const row = e.target.closest('.pur-row');
        const opt = e.target.options[e.target.selectedIndex];
        if (opt && opt.value) {
            row.querySelector('.pur-cost').value = opt.getAttribute('data-cost') || '0.00';
            row.querySelector('.pur-gst').value = opt.getAttribute('data-gst') || '18';
            calcPurRow(row);
        }
    } else if (e.target.classList.contains('pur-gst')) {
        const row = e.target.closest('.pur-row');
        if (row) calcPurRow(row);
    }
});

document.getElementById('purchaseItemsTable').addEventListener('click', e => {
    if (e.target.closest('.remove-pur-row')) {
        const rows = document.querySelectorAll('.pur-row');
        if (rows.length > 1) {
            e.target.closest('.pur-row').remove();
            calcAllPur();
        } else {
            alert('At least one item row is required.');
        }
    }
});

document.getElementById('addPurRowBtn').addEventListener('click', () => {
    const firstRow = document.querySelector('.pur-row');
    const newRow = firstRow.cloneNode(true);

    newRow.querySelectorAll('input, select').forEach(input => {
        const name = input.getAttribute('name');
        if (name) {
            input.setAttribute('name', name.replace(/\[\d+\]/, '[' + purRowCount + ']'));
        }
        if (input.classList.contains('pur-qty')) input.value = '1';
        else if (input.classList.contains('pur-cost')) input.value = '0.00';
        else if (input.classList.contains('pur-total')) input.value = '0.00';
        else if (input.classList.contains('pur-product-select')) input.selectedIndex = 0;
    });

    document.querySelector('#purchaseItemsTable tbody').appendChild(newRow);
    purRowCount++;
});
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
