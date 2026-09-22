<?php
/**
 * SmartBill - Company Profile & GST Invoice Settings
 */

require_once __DIR__ . '/../includes/auth_check.php';
requireAdmin();

$page_title = 'Company Profile & Settings - SmartBill';
$company = getCompanySettings($pdo);
$states = getIndianStates();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCSRFToken($token)) {
        $error = 'Invalid security token. Please try again.';
    } else {
        $company_name = trim($_POST['company_name'] ?? '');
        $legal_name = trim($_POST['legal_name'] ?? '');
        $address = trim($_POST['address'] ?? '');
        $city = trim($_POST['city'] ?? '');
        $state = trim($_POST['state'] ?? '');
        $pin_code = trim($_POST['pin_code'] ?? '');
        $mobile = trim($_POST['mobile'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $gstin = strtoupper(trim($_POST['gstin'] ?? ''));
        $pan = strtoupper(trim($_POST['pan'] ?? ''));
        $state_code = trim($_POST['state_code'] ?? '');
        $invoice_prefix = trim($_POST['invoice_prefix'] ?? 'INV');
        $starting_invoice_number = (int)($_POST['starting_invoice_number'] ?? 1001);
        $bank_name = trim($_POST['bank_name'] ?? '');
        $account_number = trim($_POST['account_number'] ?? '');
        $ifsc = strtoupper(trim($_POST['ifsc'] ?? ''));
        $upi_id = trim($_POST['upi_id'] ?? '');
        $terms_conditions = trim($_POST['terms_conditions'] ?? '');
        $authorized_signatory = trim($_POST['authorized_signatory'] ?? '');

        // Auto-extract PAN from GSTIN if 15 characters (e.g. 27AABCS1429B1Z5 -> PAN: AABCS1429B)
        if (strlen($gstin) === 15 && empty($pan)) {
            $pan = substr($gstin, 2, 10);
        }

        // Auto-extract State Code from GSTIN (first 2 digits)
        if (strlen($gstin) === 15 && empty($state_code)) {
            $state_code = substr($gstin, 0, 2);
        }

        // Handle Logo Upload
        $logo_filename = $company['logo'] ?? null;
        if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
            $fileTmp = $_FILES['logo']['tmp_name'];
            $fileName = $_FILES['logo']['name'];
            $fileSize = $_FILES['logo']['size'];
            $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

            $allowed = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
            if (in_array($fileExt, $allowed) && $fileSize <= 2 * 1024 * 1024) {
                $targetDir = __DIR__ . '/../uploads/company/';
                if (!is_dir($targetDir)) {
                    mkdir($targetDir, 0755, true);
                }
                $newFileName = 'company_logo_' . time() . '.' . $fileExt;
                if (move_uploaded_file($fileTmp, $targetDir . $newFileName)) {
                    $logo_filename = 'uploads/company/' . $newFileName;
                }
            } else {
                $error = 'Logo must be an image (JPG, PNG, WebP, SVG) under 2MB.';
            }
        }

        if (empty($company_name)) {
            $error = 'Company Name is required.';
        }

        if (!$error) {
            $stmt = $pdo->prepare("
                UPDATE company_settings SET
                    company_name = ?, legal_name = ?, address = ?, city = ?, state = ?, pin_code = ?,
                    mobile = ?, email = ?, gstin = ?, pan = ?, state_code = ?, logo = ?,
                    invoice_prefix = ?, starting_invoice_number = ?, bank_name = ?, account_number = ?,
                    ifsc = ?, upi_id = ?, terms_conditions = ?, authorized_signatory = ?
                WHERE id = 1
            ");
            $stmt->execute([
                $company_name, $legal_name, $address, $city, $state, $pin_code,
                $mobile, $email, $gstin, $pan, $state_code, $logo_filename,
                $invoice_prefix, $starting_invoice_number, $bank_name, $account_number,
                $ifsc, $upi_id, $terms_conditions, $authorized_signatory
            ]);

            setFlash('success', 'Company profile and billing settings updated successfully!');
            header("Location: company.php");
            exit;
        }
    }
}

$csrf_token = getCSRFToken();
include __DIR__ . '/../includes/header.php';
?>

<div class="row justify-content-center">
    <div class="col-lg-10">
        <div class="card shadow-sm border-0">
            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                    <i class="fa-solid fa-building-circle-check text-primary fs-5"></i>
                    <h5 class="mb-0 fw-bold">Company Profile & GST Billing Settings</h5>
                </div>
                <span class="badge bg-light text-muted border">Automatic Invoice Header</span>
            </div>

            <div class="card-body p-4">
                <?php if ($error): ?>
                    <div class="alert alert-danger py-2 small"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <form action="company.php" method="POST" enctype="multipart/form-data">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

                    <!-- Section 1: Business Details -->
                    <h6 class="fw-bold text-dark border-bottom pb-2 mb-3">
                        <i class="fa-solid fa-store text-primary me-2"></i>Business Identity
                    </h6>
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <label class="form-label">Company / Trade Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" name="company_name" value="<?= htmlspecialchars($company['company_name'] ?? '') ?>" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Legal Registered Name</label>
                            <input type="text" class="form-control" name="legal_name" value="<?= htmlspecialchars($company['legal_name'] ?? '') ?>" placeholder="e.g. Acme Solutions Pvt Ltd">
                        </div>
                        <div class="col-md-8">
                            <label class="form-label">Office Address</label>
                            <textarea class="form-control" name="address" rows="2"><?= htmlspecialchars($company['address'] ?? '') ?></textarea>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Company Logo</label>
                            <input type="file" class="form-control" name="logo" accept="image/*">
                            <?php if (!empty($company['logo'])): ?>
                                <div class="mt-2 d-flex align-items-center gap-2">
                                    <img src="<?= $to_root . htmlspecialchars($company['logo']) ?>" alt="Logo" class="img-thumbnail" style="max-height: 48px;">
                                    <span class="text-muted small">Current Logo</span>
                                </div>
                            <?php endif; ?>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">City</label>
                            <input type="text" class="form-control" name="city" value="<?= htmlspecialchars($company['city'] ?? '') ?>">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">State</label>
                            <select class="form-select" name="state" id="compStateSelect">
                                <option value="">-- Select State --</option>
                                <?php foreach ($states as $code => $stName): ?>
                                    <option value="<?= htmlspecialchars($stName) ?>" data-code="<?= $code ?>" <?= ($company['state'] === $stName) ? 'selected' : '' ?>>
                                        <?= htmlspecialchars($stName) ?> (<?= $code ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">State Code</label>
                            <input type="text" class="form-control" name="state_code" id="compStateCode" value="<?= htmlspecialchars($company['state_code'] ?? '') ?>">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">PIN Code</label>
                            <input type="text" class="form-control" name="pin_code" value="<?= htmlspecialchars($company['pin_code'] ?? '') ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Phone / Mobile</label>
                            <input type="text" class="form-control" name="mobile" value="<?= htmlspecialchars($company['mobile'] ?? '') ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Billing Email</label>
                            <input type="email" class="form-control" name="email" value="<?= htmlspecialchars($company['email'] ?? '') ?>">
                        </div>
                    </div>

                    <!-- Section 2: GST & Tax Credentials -->
                    <h6 class="fw-bold text-dark border-bottom pb-2 mb-3">
                        <i class="fa-solid fa-stamp text-primary me-2"></i>GST & Tax Registration
                    </h6>
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <label class="form-label">GSTIN (15 Characters)</label>
                            <input type="text" class="form-control font-monospace" name="gstin" id="compGstin" maxlength="15" value="<?= htmlspecialchars($company['gstin'] ?? '') ?>" placeholder="e.g. 27AABCS1429B1Z5">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">PAN Number (10 Characters)</label>
                            <input type="text" class="form-control font-monospace" name="pan" id="compPan" maxlength="10" value="<?= htmlspecialchars($company['pan'] ?? '') ?>" placeholder="e.g. AABCS1429B">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Invoice Prefix</label>
                            <input type="text" class="form-control" name="invoice_prefix" value="<?= htmlspecialchars($company['invoice_prefix'] ?? 'INV-2026') ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Starting Invoice Number</label>
                            <input type="number" class="form-control" name="starting_invoice_number" value="<?= htmlspecialchars($company['starting_invoice_number'] ?? '1001') ?>">
                        </div>
                    </div>

                    <!-- Section 3: Bank Account & Payment Details -->
                    <h6 class="fw-bold text-dark border-bottom pb-2 mb-3">
                        <i class="fa-solid fa-building-columns text-primary me-2"></i>Bank & UPI Details (Printed on Invoices)
                    </h6>
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <label class="form-label">Bank Name</label>
                            <input type="text" class="form-control" name="bank_name" value="<?= htmlspecialchars($company['bank_name'] ?? '') ?>" placeholder="e.g. HDFC Bank Ltd">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Account Number</label>
                            <input type="text" class="form-control font-monospace" name="account_number" value="<?= htmlspecialchars($company['account_number'] ?? '') ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">IFSC Code</label>
                            <input type="text" class="form-control font-monospace" name="ifsc" value="<?= htmlspecialchars($company['ifsc'] ?? '') ?>" placeholder="e.g. HDFC0001234">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">UPI ID / VPA</label>
                            <input type="text" class="form-control" name="upi_id" value="<?= htmlspecialchars($company['upi_id'] ?? '') ?>" placeholder="e.g. company@bank">
                        </div>
                    </div>

                    <!-- Section 4: Invoice Terms & Signatory -->
                    <h6 class="fw-bold text-dark border-bottom pb-2 mb-3">
                        <i class="fa-solid fa-signature text-primary me-2"></i>Terms & Authorized Signature
                    </h6>
                    <div class="row g-3 mb-4">
                        <div class="col-md-8">
                            <label class="form-label">Invoice Terms & Conditions</label>
                            <textarea class="form-control" name="terms_conditions" rows="3"><?= htmlspecialchars($company['terms_conditions'] ?? '') ?></textarea>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Authorized Signatory Label</label>
                            <input type="text" class="form-control" name="authorized_signatory" value="<?= htmlspecialchars($company['authorized_signatory'] ?? '') ?>" placeholder="For SmartBill Solutions">
                        </div>
                    </div>

                    <div class="text-end pt-3 border-top">
                        <button type="submit" class="btn btn-primary px-4 py-2 fw-semibold shadow-sm">
                            <i class="fa-solid fa-floppy-disk me-1"></i> Save Company Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
document.getElementById('compStateSelect')?.addEventListener('change', function() {
    const opt = this.options[this.selectedIndex];
    const code = opt ? opt.getAttribute('data-code') : '';
    if (code) {
        document.getElementById('compStateCode').value = code;
    }
});

document.getElementById('compGstin')?.addEventListener('input', function() {
    const gstin = this.value.trim().toUpperCase();
    if (gstin.length >= 2 && !document.getElementById('compStateCode').value) {
        document.getElementById('compStateCode').value = gstin.substring(0, 2);
    }
    if (gstin.length >= 12 && !document.getElementById('compPan').value) {
        document.getElementById('compPan').value = gstin.substring(2, 12);
    }
});
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
