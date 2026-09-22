<?php
/**
 * SmartBill - Edit Supplier
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT * FROM suppliers WHERE id = ?");
$stmt->execute([$id]);
$supplier = $stmt->fetch();

if (!$supplier) {
    setFlash('danger', 'Supplier not found.');
    header("Location: index.php");
    exit;
}

$page_title = 'Edit Supplier - ' . $supplier['name'];
$states = getIndianStates();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCSRFToken($token)) {
        $error = 'Invalid security token.';
    } else {
        $name = trim($_POST['name'] ?? '');
        $company_name = trim($_POST['company_name'] ?? '');
        $mobile = trim($_POST['mobile'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $address = trim($_POST['address'] ?? '');
        $gstin = strtoupper(trim($_POST['gstin'] ?? ''));
        $pan = strtoupper(trim($_POST['pan'] ?? ''));
        $state = trim($_POST['state'] ?? '');
        $state_code = trim($_POST['state_code'] ?? '');
        $opening_balance = (float)($_POST['opening_balance'] ?? 0);

        if (empty($name)) {
            $error = 'Supplier Name is required.';
        } else {
            $stmt = $pdo->prepare("
                UPDATE suppliers SET
                    name = ?, company_name = ?, mobile = ?, email = ?,
                    address = ?, gstin = ?, pan = ?, state = ?, state_code = ?, opening_balance = ?
                WHERE id = ?
            ");
            $stmt->execute([$name, $company_name, $mobile, $email, $address, $gstin, $pan, $state, $state_code, $opening_balance, $id]);

            setFlash('success', 'Supplier updated successfully!');
            header("Location: index.php");
            exit;
        }
    }
}

$csrf_token = getCSRFToken();
include __DIR__ . '/../includes/header.php';
?>

<div class="row justify-content-center">
    <div class="col-lg-9">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                    <i class="fa-solid fa-pen-to-square text-primary fs-5"></i>
                    <h5 class="mb-0 fw-bold">Edit Supplier</h5>
                </div>
                <a href="index.php" class="btn btn-outline-secondary btn-sm">Back</a>
            </div>
            <div class="card-body p-4">
                <?php if ($error): ?>
                    <div class="alert alert-danger py-2 small"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <form action="edit.php?id=<?= $id ?>" method="POST">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Contact Person Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" name="name" value="<?= htmlspecialchars($supplier['name']) ?>" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Vendor / Company Name</label>
                            <input type="text" class="form-control" name="company_name" value="<?= htmlspecialchars($supplier['company_name'] ?? '') ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Phone / Mobile</label>
                            <input type="text" class="form-control" name="mobile" value="<?= htmlspecialchars($supplier['mobile'] ?? '') ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Email Address</label>
                            <input type="email" class="form-control" name="email" value="<?= htmlspecialchars($supplier['email'] ?? '') ?>">
                        </div>
                    </div>

                    <h6 class="fw-bold text-dark border-bottom pb-2 my-3">Tax & Balance</h6>
                    <div class="row g-3 mb-3">
                        <div class="col-md-4">
                            <label class="form-label">GSTIN</label>
                            <input type="text" class="form-control font-monospace" name="gstin" id="supGstin" maxlength="15" value="<?= htmlspecialchars($supplier['gstin'] ?? '') ?>">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">PAN</label>
                            <input type="text" class="form-control font-monospace" name="pan" id="supPan" maxlength="10" value="<?= htmlspecialchars($supplier['pan'] ?? '') ?>">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Opening Balance (₹)</label>
                            <input type="number" step="0.01" class="form-control" name="opening_balance" value="<?= htmlspecialchars($supplier['opening_balance'] ?? '0.00') ?>">
                        </div>
                        <div class="col-md-8">
                            <label class="form-label">State</label>
                            <select class="form-select" name="state" id="supState">
                                <option value="">-- Select State --</option>
                                <?php foreach ($states as $code => $stName): ?>
                                    <option value="<?= htmlspecialchars($stName) ?>" data-code="<?= $code ?>" <?= ($supplier['state'] === $stName) ? 'selected' : '' ?>>
                                        <?= htmlspecialchars($stName) ?> (<?= $code ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">State Code</label>
                            <input type="text" class="form-control" name="state_code" id="supStateCode" value="<?= htmlspecialchars($supplier['state_code'] ?? '') ?>">
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label">Vendor Address</label>
                        <textarea class="form-control" name="address" rows="3"><?= htmlspecialchars($supplier['address'] ?? '') ?></textarea>
                    </div>

                    <div class="text-end pt-3 border-top">
                        <a href="index.php" class="btn btn-outline-secondary me-2">Cancel</a>
                        <button type="submit" class="btn btn-primary px-4">Update Supplier</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
document.getElementById('supState')?.addEventListener('change', function() {
    const opt = this.options[this.selectedIndex];
    const code = opt ? opt.getAttribute('data-code') : '';
    if (code) document.getElementById('supStateCode').value = code;
});
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
