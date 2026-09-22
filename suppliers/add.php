<?php
/**
 * SmartBill - Add Supplier
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Add Supplier - SmartBill';
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
            if (strlen($gstin) === 15) {
                if (empty($pan)) $pan = substr($gstin, 2, 10);
                if (empty($state_code)) $state_code = substr($gstin, 0, 2);
            }

            $stmt = $pdo->prepare("
                INSERT INTO suppliers (name, company_name, mobile, email, address, gstin, pan, state, state_code, opening_balance)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$name, $company_name, $mobile, $email, $address, $gstin, $pan, $state, $state_code, $opening_balance]);

            setFlash('success', 'Supplier added successfully!');
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
                    <i class="fa-solid fa-truck-ramp-box text-primary fs-5"></i>
                    <h5 class="mb-0 fw-bold">Add New Supplier</h5>
                </div>
                <a href="index.php" class="btn btn-outline-secondary btn-sm">Back</a>
            </div>
            <div class="card-body p-4">
                <?php if ($error): ?>
                    <div class="alert alert-danger py-2 small"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <form action="add.php" method="POST">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Contact Person Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" name="name" required placeholder="e.g. Anand Verma">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Vendor / Company Name</label>
                            <input type="text" class="form-control" name="company_name" placeholder="e.g. Star Electronics Wholesale">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Phone / Mobile</label>
                            <input type="text" class="form-control" name="mobile" placeholder="e.g. 9812345678">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Email Address</label>
                            <input type="email" class="form-control" name="email" placeholder="e.g. vendor@star.com">
                        </div>
                    </div>

                    <h6 class="fw-bold text-dark border-bottom pb-2 my-3">Tax & Balance</h6>
                    <div class="row g-3 mb-3">
                        <div class="col-md-4">
                            <label class="form-label">GSTIN</label>
                            <input type="text" class="form-control font-monospace" name="gstin" id="supGstin" maxlength="15" placeholder="e.g. 27AAAAA0000A1Z5">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">PAN</label>
                            <input type="text" class="form-control font-monospace" name="pan" id="supPan" maxlength="10">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Opening Balance (₹)</label>
                            <input type="number" step="0.01" class="form-control" name="opening_balance" value="0.00">
                        </div>
                        <div class="col-md-8">
                            <label class="form-label">State</label>
                            <select class="form-select" name="state" id="supState">
                                <option value="">-- Select State --</option>
                                <?php foreach ($states as $code => $stName): ?>
                                    <option value="<?= htmlspecialchars($stName) ?>" data-code="<?= $code ?>">
                                        <?= htmlspecialchars($stName) ?> (<?= $code ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">State Code</label>
                            <input type="text" class="form-control" name="state_code" id="supStateCode">
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label">Vendor Address</label>
                        <textarea class="form-control" name="address" rows="3" placeholder="Full address of vendor"></textarea>
                    </div>

                    <div class="text-end pt-3 border-top">
                        <a href="index.php" class="btn btn-outline-secondary me-2">Cancel</a>
                        <button type="submit" class="btn btn-primary px-4">Save Supplier</button>
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

document.getElementById('supGstin')?.addEventListener('input', function() {
    const gstin = this.value.trim().toUpperCase();
    if (gstin.length >= 2) {
        const code = gstin.substring(0, 2);
        document.getElementById('supStateCode').value = code;
    }
    if (gstin.length >= 12) {
        document.getElementById('supPan').value = gstin.substring(2, 12);
    }
});
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
