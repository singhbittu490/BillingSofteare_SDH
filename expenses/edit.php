<?php
/**
 * SmartBill - Edit Expense
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT * FROM expenses WHERE id = ?");
$stmt->execute([$id]);
$expense = $stmt->fetch();

if (!$expense) {
    setFlash('danger', 'Expense entry not found.');
    header("Location: index.php");
    exit;
}

$page_title = 'Edit Expense - SmartBill';
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
            $error = 'Please enter an amount greater than zero.';
        } elseif (empty($description)) {
            $error = 'Description is required.';
        } else {
            $stmt = $pdo->prepare("
                UPDATE expenses SET 
                    category = ?, expense_date = ?, amount = ?, payment_method = ?,
                    reference_number = ?, description = ?
                WHERE id = ?
            ");
            $stmt->execute([$category, $expense_date, $amount, $payment_method, $reference_number, $description, $id]);

            setFlash('success', 'Expense updated successfully.');
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
                <h5 class="mb-0 fw-bold">Edit Business Expense</h5>
                <a href="index.php" class="btn btn-outline-secondary btn-sm">Cancel</a>
            </div>
            <div class="card-body p-4">
                <?php if ($error): ?>
                    <div class="alert alert-danger py-2 small"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <form action="edit.php?id=<?= $id ?>" method="POST">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Expense Category <span class="text-danger">*</span></label>
                            <select name="category" class="form-select" required>
                                <?php foreach ($categories as $cat): ?>
                                    <option value="<?= $cat ?>" <?= ($expense['category'] === $cat) ? 'selected' : '' ?>><?= $cat ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Expense Date <span class="text-danger">*</span></label>
                            <input type="date" name="expense_date" class="form-control" value="<?= htmlspecialchars($expense['expense_date']) ?>" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Amount (₹) <span class="text-danger">*</span></label>
                            <input type="number" step="0.01" min="0.01" name="amount" class="form-control fw-bold text-danger" value="<?= htmlspecialchars($expense['amount']) ?>" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Payment Method</label>
                            <select name="payment_method" class="form-select">
                                <?php foreach (['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Cheque'] as $m): ?>
                                    <option value="<?= $m ?>" <?= ($expense['payment_method'] === $m) ? 'selected' : '' ?>><?= $m ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Reference Number</label>
                        <input type="text" name="reference_number" class="form-control font-monospace" value="<?= htmlspecialchars($expense['reference_number'] ?? '') ?>">
                    </div>

                    <div class="mb-4">
                        <label class="form-label">Description <span class="text-danger">*</span></label>
                        <textarea name="description" class="form-control" rows="2" required><?= htmlspecialchars($expense['description'] ?? '') ?></textarea>
                    </div>

                    <div class="text-end pt-3 border-top">
                        <a href="index.php" class="btn btn-outline-secondary me-2">Cancel</a>
                        <button type="submit" class="btn btn-primary px-4">Update Expense</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
