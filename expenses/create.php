<?php
/**
 * SmartBill - Add Business Expense
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Add Expense - SmartBill';
$error = '';

$categories = ['Rent', 'Electricity', 'Salary', 'Office Supplies', 'Tea & Snacks', 'Maintenance', 'Travel', 'Internet & Phone', 'Marketing', 'Other'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCSRFToken($token)) {
        $error = 'Invalid security token.';
    } else {
        $category = trim($_POST['category'] ?? 'Other');
        $expense_date = $_POST['expense_date'] ?? date('Y-m-d');
        $amount = (float)($_POST['amount'] ?? 0);
        $payment_method = $_POST['payment_method'] ?? 'Cash';
        $reference_number = trim($_POST['reference_number'] ?? '');
        $description = trim($_POST['description'] ?? '');

        if ($amount <= 0) {
            $error = 'Please enter an expense amount greater than zero.';
        } elseif (empty($description)) {
            $error = 'Expense description is required.';
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO expenses (category, expense_date, amount, payment_method, reference_number, description)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$category, $expense_date, $amount, $payment_method, $reference_number, $description]);

            setFlash('success', 'Expense entry recorded successfully!');
            header("Location: index.php");
            exit;
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
                    <i class="fa-solid fa-wallet text-danger fs-5"></i>
                    <h5 class="mb-0 fw-bold">Record Business Expense</h5>
                </div>
                <a href="index.php" class="btn btn-outline-secondary btn-sm">Cancel</a>
            </div>
            <div class="card-body p-4">
                <?php if ($error): ?>
                    <div class="alert alert-danger py-2 small"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <form action="create.php" method="POST">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Expense Category <span class="text-danger">*</span></label>
                            <select name="category" class="form-select" required>
                                <?php foreach ($categories as $cat): ?>
                                    <option value="<?= $cat ?>"><?= $cat ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Expense Date <span class="text-danger">*</span></label>
                            <input type="date" name="expense_date" class="form-control" value="<?= date('Y-m-d') ?>" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Amount (₹) <span class="text-danger">*</span></label>
                            <input type="number" step="0.01" min="0.01" name="amount" class="form-control fw-bold text-danger" required placeholder="0.00">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Payment Method</label>
                            <select name="payment_method" class="form-select">
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI / QR</option>
                                <option value="Bank Transfer">Bank Transfer / NEFT</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Cheque">Cheque</option>
                            </select>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Bill / Voucher / Ref Number</label>
                        <input type="text" name="reference_number" class="form-control font-monospace" placeholder="e.g. EB-JAN-2026, VOUCH-01">
                    </div>

                    <div class="mb-4">
                        <label class="form-label">Description / Purpose <span class="text-danger">*</span></label>
                        <textarea name="description" class="form-control" rows="2" required placeholder="e.g. Office electricity bill for January 2026"></textarea>
                    </div>

                    <div class="text-end pt-3 border-top">
                        <a href="index.php" class="btn btn-outline-secondary me-2">Cancel</a>
                        <button type="submit" class="btn btn-primary px-4">Save Expense</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
