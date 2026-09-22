<?php
/**
 * SmartBill - Record Payment Against Invoice
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Record Payment - SmartBill';
$invoice_id = (int)($_GET['invoice_id'] ?? 0);

$selected_invoice = null;
if ($invoice_id > 0) {
    $stmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ?");
    $stmt->execute([$invoice_id]);
    $selected_invoice = $stmt->fetch();
}

// Fetch invoices with outstanding balance
$invoices_with_due = $pdo->query("
    SELECT id, invoice_number, customer_name, grand_total, outstanding_amount 
    FROM invoices 
    WHERE outstanding_amount > 0 
    ORDER BY id DESC
")->fetchAll();

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCSRFToken($token)) {
        $error = 'Invalid security token.';
    } else {
        $inv_id = (int)($_POST['invoice_id'] ?? 0);
        $payment_date = $_POST['payment_date'] ?? date('Y-m-d');
        $amount = (float)($_POST['amount'] ?? 0);
        $payment_method = $_POST['payment_method'] ?? 'Cash';
        $ref_number = trim($_POST['reference_number'] ?? '');
        $notes = trim($_POST['notes'] ?? '');

        // Fetch invoice
        $stmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ?");
        $stmt->execute([$inv_id]);
        $inv = $stmt->fetch();

        if (!$inv) {
            $error = 'Invoice not found.';
        } elseif ($amount <= 0) {
            $error = 'Please enter an amount greater than zero.';
        } elseif ($amount > (float)$inv['outstanding_amount']) {
            $error = 'Payment amount (₹' . number_format($amount, 2) . ') cannot exceed the invoice outstanding balance (₹' . number_format((float)$inv['outstanding_amount'], 2) . ').';
        } else {
            try {
                $pdo->beginTransaction();

                if (empty($ref_number)) {
                    $ref_number = 'PAY-' . date('Ymd') . '-' . rand(100, 999);
                }

                // Insert payment
                $p_stmt = $pdo->prepare("
                    INSERT INTO payments (invoice_id, customer_id, payment_date, amount, payment_method, reference_number, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $p_stmt->execute([
                    $inv_id,
                    $inv['customer_id'],
                    $payment_date,
                    $amount,
                    $payment_method,
                    $ref_number,
                    $notes
                ]);
                $payment_id = $pdo->lastInsertId();

                // Recalculate invoice balances
                $new_paid = (float)$inv['paid_amount'] + $amount;
                $new_due = max(0, (float)$inv['grand_total'] - $new_paid);
                $new_status = ($new_due <= 0) ? 'Paid' : 'Partially Paid';

                $upd = $pdo->prepare("UPDATE invoices SET paid_amount = ?, outstanding_amount = ?, status = ? WHERE id = ?");
                $upd->execute([$new_paid, $new_due, $new_status, $inv_id]);

                $pdo->commit();

                setFlash('success', "Payment of " . formatCurrency($amount) . " successfully recorded for Invoice {$inv['invoice_number']}!");
                header("Location: receipt.php?id=" . $payment_id);
                exit;

            } catch (Exception $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                $error = 'Failed to record payment: ' . $e->getMessage();
            }
        }
    }
}

$csrf_token = getCSRFToken();
include __DIR__ . '/../includes/header.php';
?>

<div class="row justify-content-center">
    <div class="col-lg-6">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                    <i class="fa-solid fa-hand-holding-dollar text-success fs-5"></i>
                    <h5 class="mb-0 fw-bold">Record Customer Payment</h5>
                </div>
                <a href="../invoices/index.php" class="btn btn-outline-secondary btn-sm">Cancel</a>
            </div>
            <div class="card-body p-4">
                <?php if ($error): ?>
                    <div class="alert alert-danger py-2 small"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <form action="create.php" method="POST">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

                    <div class="mb-3">
                        <label class="form-label">Select Invoice <span class="text-danger">*</span></label>
                        <select name="invoice_id" id="invoiceSelect" class="form-select" required>
                            <option value="">-- Choose Invoice to Pay --</option>
                            <?php foreach ($invoices_with_due as $inv): ?>
                                <option value="<?= $inv['id'] ?>" 
                                    data-balance="<?= (float)$inv['outstanding_amount'] ?>"
                                    data-customer="<?= htmlspecialchars($inv['customer_name']) ?>"
                                    <?= ($invoice_id === (int)$inv['id']) ? 'selected' : '' ?>>
                                    <?= htmlspecialchars($inv['invoice_number']) ?> - <?= htmlspecialchars($inv['customer_name']) ?> (Due: <?= formatCurrency($inv['outstanding_amount']) ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="p-3 bg-light rounded border mb-3">
                        <div class="d-flex justify-content-between small text-muted">
                            <span>Outstanding Balance:</span>
                            <span class="fs-6 fw-bold text-danger" id="dueDisplay">
                                <?= $selected_invoice ? formatCurrency($selected_invoice['outstanding_amount']) : '₹0.00' ?>
                            </span>
                        </div>
                    </div>

                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Payment Date <span class="text-danger">*</span></label>
                            <input type="date" name="payment_date" class="form-control" value="<?= date('Y-m-d') ?>" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Amount Received (₹) <span class="text-danger">*</span></label>
                            <input type="number" step="0.01" min="0.01" name="amount" id="payAmount" class="form-control fw-bold text-success" value="<?= $selected_invoice ? htmlspecialchars($selected_invoice['outstanding_amount']) : '' ?>" required placeholder="0.00">
                        </div>
                    </div>

                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Payment Method <span class="text-danger">*</span></label>
                            <select name="payment_method" class="form-select" required>
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI / QR Code</option>
                                <option value="Bank Transfer">Bank Transfer / NEFT</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Credit Card">Credit Card / POS</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Reference / UTR / Cheque #</label>
                            <input type="text" name="reference_number" class="form-control font-monospace" placeholder="e.g. UTR12345678">
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label">Payment Remarks / Notes</label>
                        <textarea name="notes" class="form-control" rows="2" placeholder="Optional transaction note"></textarea>
                    </div>

                    <div class="text-end pt-3 border-top">
                        <a href="index.php" class="btn btn-outline-secondary me-2">Cancel</a>
                        <button type="submit" class="btn btn-success px-4">
                            <i class="fa-solid fa-check me-1"></i> Save & View Receipt
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
document.getElementById('invoiceSelect')?.addEventListener('change', function() {
    const opt = this.options[this.selectedIndex];
    if (opt && opt.value) {
        const bal = parseFloat(opt.getAttribute('data-balance')) || 0;
        document.getElementById('dueDisplay').textContent = '₹' + bal.toFixed(2);
        document.getElementById('payAmount').value = bal.toFixed(2);
        document.getElementById('payAmount').max = bal.toFixed(2);
    } else {
        document.getElementById('dueDisplay').textContent = '₹0.00';
        document.getElementById('payAmount').value = '';
    }
});
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
