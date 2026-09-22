<?php
/**
 * SmartBill - Login View
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';

// If already logged in, go straight to dashboard
if (isset($_SESSION['user_id']) && !empty($_SESSION['user_id'])) {
    header("Location: dashboard.php");
    exit;
}

$csrf_token = getCSRFToken();
$company = getCompanySettings($pdo);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In - SmartBill GST Billing</title>
    <!-- Bootstrap 5.3.3 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="bg-light d-flex align-items-center min-vh-100 py-5">

<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-5 col-lg-4">
            <!-- App Logo / Header -->
            <div class="text-center mb-4">
                <div class="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 p-3 shadow-sm mb-2">
                    <i class="fa-solid fa-file-invoice-dollar fa-2x"></i>
                </div>
                <h3 class="fw-bold text-dark mb-1">Smart<span class="text-primary">Bill</span></h3>
                <p class="text-muted small">GST Billing, Inventory & Accounting System</p>
            </div>

            <!-- Login Card -->
            <div class="card shadow-sm border-0">
                <div class="card-body p-4">
                    <h5 class="fw-bold mb-3 text-dark">Sign In</h5>

                    <?php displayFlash(); ?>

                    <?php if (isset($_GET['msg']) && $_GET['msg'] === 'logged_out'): ?>
                        <div class="alert alert-info small py-2">
                            <i class="fa-solid fa-circle-check me-1"></i> You have logged out successfully.
                        </div>
                    <?php elseif (isset($_GET['msg']) && $_GET['msg'] === 'login_required'): ?>
                        <div class="alert alert-warning small py-2">
                            <i class="fa-solid fa-triangle-exclamation me-1"></i> Please log in to access the application.
                        </div>
                    <?php elseif (isset($_GET['msg']) && $_GET['msg'] === 'account_inactive'): ?>
                        <div class="alert alert-danger small py-2">
                            <i class="fa-solid fa-ban me-1"></i> This account is inactive. Please contact administrator.
                        </div>
                    <?php endif; ?>

                    <form action="auth/login_process.php" method="POST">
                        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

                        <div class="mb-3">
                            <label for="email" class="form-label">Email Address</label>
                            <div class="input-group">
                                <span class="input-group-text bg-white text-muted"><i class="fa-solid fa-envelope"></i></span>
                                <input type="email" class="form-control" id="email" name="email" value="admin@smartbill.com" required autofocus>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <label for="password" class="form-label mb-0">Password</label>
                                <a href="#" class="small text-decoration-none" data-bs-toggle="modal" data-bs-target="#forgotModal">Forgot?</a>
                            </div>
                            <div class="input-group">
                                <span class="input-group-text bg-white text-muted"><i class="fa-solid fa-lock"></i></span>
                                <input type="password" class="form-control" id="password" name="password" value="admin123" required>
                            </div>
                        </div>

                        <div class="mb-3 form-check">
                            <input type="checkbox" class="form-check-input" id="rememberMe" checked>
                            <label class="form-check-label small text-muted" for="rememberMe">Remember this browser</label>
                        </div>

                        <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold shadow-sm">
                            <i class="fa-solid fa-right-to-bracket me-2"></i> Log In
                        </button>
                    </form>

                    <!-- Quick Demo Credentials Fill -->
                    <div class="mt-4 pt-3 border-top text-center">
                        <span class="small text-muted d-block mb-2">Default Admin Credentials:</span>
                        <div class="badge bg-light text-dark border p-2 text-start font-monospace small w-100">
                            <div><strong>Email:</strong> admin@smartbill.com</div>
                            <div><strong>Password:</strong> admin123</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="text-center mt-3 text-muted small">
                Hostinger Deployment Ready &bull; MySQL &bull; PHP 8+
            </div>
        </div>
    </div>
</div>

<!-- Forgot Password Modal -->
<div class="modal fade" id="forgotModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <div class="modal-header">
                <h5 class="modal-title fw-bold"><i class="fa-solid fa-key text-primary me-2"></i>Forgot Password</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center p-4">
                <p class="text-muted">
                    For shared hosting environments, contact your system administrator or access your Hostinger <strong>phpMyAdmin</strong> &rarr; <code>users</code> table to reset your password.
                </p>
                <div class="alert alert-secondary small text-start">
                    To reset the default admin password to <code>admin123</code>, run:
                    <div class="bg-dark text-light p-2 rounded mt-2 font-monospace">
                        UPDATE users SET password = '$2y$10$46h2nMpjfOdUhKTh021kbuuJYcCObZERTQ0PXsYDHuXRLC15uCFle' WHERE email = 'admin@smartbill.com';
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
