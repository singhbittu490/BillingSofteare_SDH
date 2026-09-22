<?php
/**
 * SmartBill - Edit Invoice Metadata & Notes
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ?");
$stmt->execute([$id]);
$invoice = $stmt->fetch();

if (!$invoice) {
    setFlash('danger', 'Invoice not found.');
    header("Location: index.php");
    exit;
}

$page_title = 'Edit Invoice - ' . $invoice['invoice_number'];
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCSRFToken($token)) {
        $error = 'Invalid security token.';
    } else {
        $due_date = $_POST['due_date'] ?? $invoice['due_date'];
        $notes = trim($_POST['notes'] ?? '');
        $terms = trim($_POST['terms_conditions'] ?? '');
        $reverse_charge = $_POST['reverse_charge'] ?? 'No';
        $status = $_POST['status'] ?? $invoice['status'];

        $upd = $pdo->prepare("
            UPDATE invoices SET 
                due_date = ?, notes = ?, terms_conditions = ?, reverse_charge = ?, status = ?
            WHERE id = ?
        ");
        $upd->execute([$due_date, $notes, $terms, $reverse_charge, $status, $id]);

        setFlash('success', 'Invoice updated successfully.');
        header("Location: view.php?id=" . $id);
        exit;
    }
}

$csrf_token = getCSRFToken();
include __DIR__ . '/../includes/header.php';
?>

<div class="row justify-content-center">
    <div class="col-lg-7">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <div>
                    <h5 class="fw-bold mb-0 text-dark">Edit Invoice #<?= htmlspecialchars($invoice['invoice_number']) ?></h5>
                    <span class="text-muted small">Customer: <?= htmlspecialchars($invoice['customer_name']) ?></span>
                </div>
                <a href="view.php?id=<?= $id ?>" class="btn btn-outline-secondary btn-sm">Cancel</a>
            </div>
            <div class="card-body p-4">
                <?php if ($error): ?>
                    <div class="alert alert-danger py-2 small"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <form action="edit.php?id=<?= $id ?>" method="POST">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Payment Due Date</label>
                            <input type="date" name="due_date" class="form-control" value="<?= htmlspecialchars($invoice['due_date']) ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Reverse Charge</label>
                            <select name="reverse_charge" class="form-select">
                                <option value="No" <?= ($invoice['reverse_charge'] === 'No') ? 'selected' : '' ?>>No</option>
                                <option value="Yes" <?= ($invoice['reverse_charge'] === 'Yes') ? 'selected' : '' ?>>Yes</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Invoice Status</label>
                            <select name="status" class="form-select">
                                <option value="Paid" <?= ($invoice['status'] === 'Paid') ? 'selected' : '' ?>>Paid</option>
                                <option value="Partially Paid" <?= ($invoice['status'] === 'Partially Paid') ? 'selected' : '' ?>>Partially Paid</option>
                                <option value="Unpaid" <?= ($invoice['status'] === 'Unpaid') ? 'selected' : '' ?>>Unpaid</option>
                            </select>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Customer Notes</label>
                        <textarea class="form-control" name="notes" rows="2"><?= htmlspecialchars($invoice['notes'] ?? '') ?></textarea>
                    </div>

                    <div class="mb-4">
                        <label class="form-label">Terms & Conditions</label>
                        <textarea class="form-control" name="terms_conditions" rows="3"><?= htmlspecialchars($invoice['terms_conditions'] ?? '') ?></textarea>
                    </div>

                    <div class="text-end pt-3 border-top">
                        <a href="view.php?id=<?= $id ?>" class="btn btn-outline-secondary me-2">Cancel</a>
                        <button type="submit" class="btn btn-primary px-4">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
