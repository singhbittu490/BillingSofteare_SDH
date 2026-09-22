<?php
/**
 * SmartBill - Add New Customer
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Add Customer - SmartBill';
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
            // Auto extract PAN and state code if GSTIN provided
            if (strlen($gstin) === 15) {
                if (empty($pan)) $pan = substr($gstin, 2, 10);
                if (empty($state_code)) $state_code = substr($gstin, 0, 2);
            }

            if (empty($shipping_address)) {
                $shipping_address = $billing_address;
            }

            $stmt = $pdo->prepare("
                INSERT INTO customers (name, business_name, mobile, email, billing_address, shipping_address, gstin, pan, state, state_code, customer_type, opening_balance)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$name, $business_name, $mobile, $email, $billing_address, $shipping_address, $gstin, $pan, $state, $state_code, $customer_type, $opening_balance]);

            setFlash('success', 'Customer added successfully!');
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
                    <i class="fa-solid fa-user-plus text-primary fs-5"></i>
                    <h5 class="mb-0 fw-bold">Add New Customer</h5>
                </div>
                <a href="index.php" class="btn btn-outline-secondary btn-sm">Back to List</a>
            </div>
            <div class="card-body p-4">
                <?php if ($error): ?>
                    <div class="alert alert-danger py-2 small"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <form action="add.php" method="POST">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Customer Contact Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" name="name" required placeholder="e.g. Rajesh Sharma">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Business / Firm Name</label>
                            <input type="text" class="form-control" name="business_name" placeholder="e.g. Apex Traders Ltd">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Mobile Phone</label>
                            <input type="text" class="form-control" name="mobile" placeholder="e.g. 9876543210">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Email Address</label>
                            <input type="email" class="form-control" name="email" placeholder="e.g. buyer@example.com">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Customer Type</label>
                            <select class="form-select" name="customer_type">
                                <option value="Registered" selected>Registered (Regular GST)</option>
                                <option value="Unregistered">Unregistered Business</option>
                                <option value="Composition">Composition Dealer</option>
                                <option value="Consumer">Consumer / End User</option>
                            </select>
                        </div>
                    </div>

                    <h6 class="fw-bold text-dark border-bottom pb-2 my-3">GST & Tax Details</h6>
                    <div class="row g-3 mb-3">
                        <div class="col-md-4">
                            <label class="form-label">GSTIN (15 Digits)</label>
                            <input type="text" class="form-control font-monospace" name="gstin" id="custGstin" maxlength="15" placeholder="e.g. 27AADCA1234A1Z1">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">PAN Number</label>
                            <input type="text" class="form-control font-monospace" name="pan" id="custPan" maxlength="10" placeholder="e.g. AADCA1234A">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Opening Balance (₹)</label>
                            <input type="number" step="0.01" class="form-control" name="opening_balance" value="0.00">
                        </div>
                        <div class="col-md-8">
                            <label class="form-label">State</label>
                            <select class="form-select" name="state" id="custState">
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
                            <input type="text" class="form-control" name="state_code" id="custStateCode" placeholder="e.g. 27">
                        </div>
                    </div>

                    <h6 class="fw-bold text-dark border-bottom pb-2 my-3">Address Information</h6>
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <label class="form-label">Billing Address</label>
                            <textarea class="form-control" name="billing_address" id="billingAddr" rows="3" placeholder="Full billing address"></textarea>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <label class="form-label mb-0">Shipping Address</label>
                                <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none" onclick="document.getElementById('shippingAddr').value = document.getElementById('billingAddr').value">
                                    Same as billing
                                </button>
                            </div>
                            <textarea class="form-control" name="shipping_address" id="shippingAddr" rows="3" placeholder="Shipping destination"></textarea>
                        </div>
                    </div>

                    <div class="text-end pt-3 border-top">
                        <a href="index.php" class="btn btn-outline-secondary me-2">Cancel</a>
                        <button type="submit" class="btn btn-primary px-4">
                            <i class="fa-solid fa-check me-1"></i> Save Customer
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

document.getElementById('custGstin')?.addEventListener('input', function() {
    const gstin = this.value.trim().toUpperCase();
    if (gstin.length >= 2) {
        const code = gstin.substring(0, 2);
        document.getElementById('custStateCode').value = code;
        // Match state select
        const sel = document.getElementById('custState');
        for (let i = 0; i < sel.options.length; i++) {
            if (sel.options[i].getAttribute('data-code') === code) {
                sel.selectedIndex = i;
                break;
            }
        }
    }
    if (gstin.length >= 12) {
        document.getElementById('custPan').value = gstin.substring(2, 12);
    }
});
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
