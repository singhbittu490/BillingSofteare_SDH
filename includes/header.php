<?php
/**
 * SmartBill - Common Page Header Component
 */

if (!defined('SMARTBILL_ACCESS')) {
    define('SMARTBILL_ACCESS', true);
}

// Calculate root path
$current_dir = basename(dirname($_SERVER['PHP_SELF'] ?? ''));
$to_root = (in_array($current_dir, ['customers', 'suppliers', 'products', 'categories', 'invoices', 'payments', 'purchases', 'expenses', 'reports', 'settings', 'auth', 'api'])) ? '../' : '';

$company_info = getCompanySettings($pdo);
$page_title = $page_title ?? 'SmartBill - Billing & GST Accounting';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($page_title) ?></title>
    
    <!-- Bootstrap 5.3.3 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome 6.5.1 Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <!-- SmartBill Custom CSS -->
    <link rel="stylesheet" href="<?= $to_root ?>assets/css/style.css">
    
    <script>
        window.SB_BASE_PATH = "<?= $to_root ?>";
    </script>
</head>
<body>

<div class="sb-wrapper">
    <!-- Sidebar Component -->
    <?php include __DIR__ . '/sidebar.php'; ?>

    <!-- Mobile Sidebar Backdrop -->
    <div class="sb-sidebar-overlay"></div>

    <!-- Main Content Container -->
    <div class="sb-main">
        <!-- Top Navbar -->
        <header class="sb-navbar">
            <div class="d-flex align-items-center gap-3">
                <button class="btn btn-light d-lg-none" id="sbSidebarToggle" type="button" aria-label="Toggle Navigation">
                    <i class="fa-solid fa-bars"></i>
                </button>

                <!-- Global Autocomplete Search Form -->
                <div class="sb-search-form d-none d-md-block">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="sbGlobalSearch" class="form-control" placeholder="Search invoices, customers, products..." autocomplete="off">
                    <div id="sbSearchResults" class="sb-search-results"></div>
                </div>
            </div>

            <div class="d-flex align-items-center gap-2">
                <a href="<?= $to_root ?>invoices/create.php" class="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
                    <i class="fa-solid fa-plus"></i>
                    <span class="d-none d-sm-inline">Create Invoice</span>
                </a>

                <div class="dropdown">
                    <button class="btn btn-light btn-sm dropdown-toggle border d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
                        <i class="fa-solid fa-circle-user text-primary fs-5"></i>
                        <span class="d-none d-md-inline fw-semibold"><?= htmlspecialchars($_SESSION['user_name'] ?? 'Account') ?></span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                        <li class="px-3 py-2 border-bottom">
                            <span class="d-block fw-bold text-dark"><?= htmlspecialchars($_SESSION['user_name'] ?? 'User') ?></span>
                            <span class="small text-muted"><?= htmlspecialchars($_SESSION['user_email'] ?? '') ?></span>
                        </li>
                        <li><a class="dropdown-item py-2" href="<?= $to_root ?>settings/company.php"><i class="fa-solid fa-building me-2 text-muted"></i>Company Settings</a></li>
                        <li><a class="dropdown-item py-2" href="<?= $to_root ?>auth/change_password.php"><i class="fa-solid fa-key me-2 text-muted"></i>Change Password</a></li>
                        <li><hr class="dropdown-divider my-1"></li>
                        <li><a class="dropdown-item py-2 text-danger" href="<?= $to_root ?>logout.php"><i class="fa-solid fa-arrow-right-from-bracket me-2"></i>Sign Out</a></li>
                    </ul>
                </div>
            </div>
        </header>

        <!-- Page Content View -->
        <main class="p-3 p-md-4 flex-grow-1">
            <?php displayFlash(); ?>
