<?php
/**
 * SmartBill - Edit Customer
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
$stmt->execute([$id]);
$customer = $stmt->fetch();

if (!$customer) {
    setFlash('danger', 'Customer not found.');
    header("Location: index.php");
    exit;
}

$page_title = 'Edit Customer - ' . $customer['name'];
$states = getIndianStates();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCSRFToken($token)) {
        $error = 'Invalid security token.';
    } else {
        $name = trim($_POST['name'] ?? '');
        $business_name = trim($_POST['business_name'] ?? '');
        $mobile = trim($_POST['mobile'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $billing_address = trim($_POST['billing_address'] ?? '');
        $shipping_address = trim($_POST['shipping_address'] ?? '');
        $gstin = strtoupper(trim($_POST['gstin'] ?? ''));
        $pan = strtoupper(trim($_POST['pan'] ?? ''));
        $state = trim($_POST['state'] ?? '');
        $state_code = trim($_POST['state_code'] ?? '');
        $customer_type = trim($_POST['customer_type'] ?? 'Registered');
        $opening_balance = (float)($_POST['opening_balance'] ?? 0);

        if (empty($name)) {
            $error = 'Customer Name is required.';
        } else {
            $stmt = $pdo->prepare("
                UPDATE customers SET
                    name = ?, business_name = ?, mobile = ?, email = ?,
                    billing_address = ?, shipping_address = ?, gstin = ?, pan = ?,
                    state = ?, state_code = ?, customer_type = ?, opening_balance = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $name, $business_name, $mobile, $email,
                $billing_address, $shipping_address, $gstin, $pan,
                $state, $state_code, $customer_type, $opening_balance, $id
            ]);

            setFlash('success', 'Customer updated successfully!');
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
                    <i class="fa-solid fa-user-pen text-primary fs-5"></i>
                    <h5 class="mb-0 fw-bold">Edit Customer</h5>
                </div>
                <div class="d-flex gap-2">
                    <a href="statement.php?id=<?= $id ?>" class="btn btn-outline-info btn-sm">Statement</a>
                    <a href="index.php" class="btn btn-outline-secondary btn-sm">Back</a>
                </div>
            </div>
            <div class="card-body p-4">
                <?php if ($error): ?>
                    <div class="alert alert-danger py-2 small"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <form action="edit.php?id=<?= $id ?>" method="POST">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Customer Contact Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" name="name" value="<?= htmlspecialchars($customer['name']) ?>" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Business / Firm Name</label>
                            <input type="text" class="form-control" name="business_name" value="<?= htmlspecialchars($customer['business_name'] ?? '') ?>">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Mobile Phone</label>
                            <input type="text" class="form-control" name="mobile" value="<?= htmlspecialchars($customer['mobile'] ?? '') ?>">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Email Address</label>
                            <input type="email" class="form-control" name="email" value="<?= htmlspecialchars($customer['email'] ?? '') ?>">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Customer Type</label>
                            <select class="form-select" name="customer_type">
                                <option value="Registered" <?= ($customer['customer_type'] === 'Registered') ? 'selected' : '' ?>>Registered (Regular GST)</option>
                                <option value="Unregistered" <?= ($customer['customer_type'] === 'Unregistered') ? 'selected' : '' ?>>Unregistered Business</option>
                                <option value="Composition" <?= ($customer['customer_type'] === 'Composition') ? 'selected' : '' ?>>Composition Dealer</option>
                                <option value="Consumer" <?= ($customer['customer_type'] === 'Consumer') ? 'selected' : '' ?>>Consumer / End User</option>
                            </select>
                        </div>
                    </div>

                    <h6 class="fw-bold text-dark border-bottom pb-2 my-3">GST & Tax Details</h6>
                    <div class="row g-3 mb-3">
                        <div class="col-md-4">
                            <label class="form-label">GSTIN</label>
                            <input type="text" class="form-control font-monospace" name="gstin" id="custGstin" maxlength="15" value="<?= htmlspecialchars($customer['gstin'] ?? '') ?>">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">PAN Number</label>
                            <input type="text" class="form-control font-monospace" name="pan" id="custPan" maxlength="10" value="<?= htmlspecialchars($customer['pan'] ?? '') ?>">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Opening Balance (₹)</label>
                            <input type="number" step="0.01" class="form-control" name="opening_balance" value="<?= htmlspecialchars($customer['opening_balance'] ?? '0.00') ?>">
                        </div>
                        <div class="col-md-8">
                            <label class="form-label">State</label>
                            <select class="form-select" name="state" id="custState">
                                <option value="">-- Select State --</option>
                                <?php foreach ($states as $code => $stName): ?>
                                    <option value="<?= htmlspecialchars($stName) ?>" data-code="<?= $code ?>" <?= ($customer['state'] === $stName) ? 'selected' : '' ?>>
                                        <?= htmlspecialchars($stName) ?> (<?= $code ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">State Code</label>
                            <input type="text" class="form-control" name="state_code" id="custStateCode" value="<?= htmlspecialchars($customer['state_code'] ?? '') ?>">
                        </div>
                    </div>

                    <h6 class="fw-bold text-dark border-bottom pb-2 my-3">Address Information</h6>
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <label class="form-label">Billing Address</label>
                            <textarea class="form-control" name="billing_address" id="billingAddr" rows="3"><?= htmlspecialchars($customer['billing_address'] ?? '') ?></textarea>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Shipping Address</label>
                            <textarea class="form-control" name="shipping_address" id="shippingAddr" rows="3"><?= htmlspecialchars($customer['shipping_address'] ?? '') ?></textarea>
                        </div>
                    </div>

                    <div class="text-end pt-3 border-top">
                        <a href="index.php" class="btn btn-outline-secondary me-2">Cancel</a>
                        <button type="submit" class="btn btn-primary px-4">
                            <i class="fa-solid fa-check me-1"></i> Update Customer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
document.getElementById('custState')?.addEventListener('change', function() {
    const opt = this.options[this.selectedIndex];
    const code = opt ? opt.getAttribute('data-code') : '';
    if (code) document.getElementById('custStateCode').value = code;
});
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
