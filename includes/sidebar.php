<?php
/**
 * SmartBill - Sidebar Navigation Component
 */

// Determine active link based on current page
$current_page = basename($_SERVER['PHP_SELF'] ?? '');
$current_dir = basename(dirname($_SERVER['PHP_SELF'] ?? ''));

// Calculate relative path to root based on directory depth
$to_root = ($current_dir === 'smartbill' || $current_dir === 'applet' || $current_dir === 'public_html' || file_exists('dashboard.php')) ? '' : '../';
?>

<aside class="sb-sidebar">
    <a href="<?= $to_root ?>dashboard.php" class="sb-sidebar-brand">
        <i class="fa-solid fa-file-invoice-dollar text-primary"></i>
        <span>Smart<span class="text-primary">Bill</span></span>
    </a>

    <ul class="sb-sidebar-nav">
        <li>
            <a href="<?= $to_root ?>dashboard.php" class="sb-nav-link <?= ($current_page === 'dashboard.php') ? 'active' : '' ?>">
                <i class="fa-solid fa-gauge-high"></i>
                <span>Dashboard</span>
            </a>
        </li>

        <li class="sb-nav-category">Billing & Sales</li>
        <li>
            <a href="<?= $to_root ?>invoices/create.php" class="sb-nav-link <?= ($current_dir === 'invoices' && $current_page === 'create.php') ? 'active' : '' ?>">
                <i class="fa-solid fa-plus-circle text-primary"></i>
                <span>Create Invoice</span>
            </a>
        </li>
        <li>
            <a href="<?= $to_root ?>invoices/index.php" class="sb-nav-link <?= ($current_dir === 'invoices' && in_array($current_page, ['index.php', 'view.php', 'edit.php'])) ? 'active' : '' ?>">
                <i class="fa-solid fa-file-invoice"></i>
                <span>Invoices</span>
            </a>
        </li>
        <li>
            <a href="<?= $to_root ?>payments/index.php" class="sb-nav-link <?= ($current_dir === 'payments') ? 'active' : '' ?>">
                <i class="fa-solid fa-money-bill-wave"></i>
                <span>Payments</span>
            </a>
        </li>

        <li class="sb-nav-category">Parties</li>
        <li>
            <a href="<?= $to_root ?>customers/index.php" class="sb-nav-link <?= ($current_dir === 'customers') ? 'active' : '' ?>">
                <i class="fa-solid fa-users"></i>
                <span>Customers</span>
            </a>
        </li>
        <li>
            <a href="<?= $to_root ?>suppliers/index.php" class="sb-nav-link <?= ($current_dir === 'suppliers') ? 'active' : '' ?>">
                <i class="fa-solid fa-truck-field"></i>
                <span>Suppliers</span>
            </a>
        </li>

        <li class="sb-nav-category">Inventory & Purchases</li>
        <li>
            <a href="<?= $to_root ?>products/index.php" class="sb-nav-link <?= ($current_dir === 'products') ? 'active' : '' ?>">
                <i class="fa-solid fa-boxes-stacked"></i>
                <span>Products & Stock</span>
            </a>
        </li>
        <li>
            <a href="<?= $to_root ?>categories/index.php" class="sb-nav-link <?= ($current_dir === 'categories') ? 'active' : '' ?>">
                <i class="fa-solid fa-tags"></i>
                <span>Categories</span>
            </a>
        </li>
        <li>
            <a href="<?= $to_root ?>purchases/index.php" class="sb-nav-link <?= ($current_dir === 'purchases') ? 'active' : '' ?>">
                <i class="fa-solid fa-cart-shopping"></i>
                <span>Purchases</span>
            </a>
        </li>

        <li class="sb-nav-category">Accounting</li>
        <li>
            <a href="<?= $to_root ?>expenses/index.php" class="sb-nav-link <?= ($current_dir === 'expenses') ? 'active' : '' ?>">
                <i class="fa-solid fa-receipt"></i>
                <span>Expenses</span>
            </a>
        </li>
        <li>
            <a href="<?= $to_root ?>reports/index.php" class="sb-nav-link <?= ($current_dir === 'reports') ? 'active' : '' ?>">
                <i class="fa-solid fa-chart-pie"></i>
                <span>Reports & GST</span>
            </a>
        </li>

        <li class="sb-nav-category">Administration</li>
        <li>
            <a href="<?= $to_root ?>settings/company.php" class="sb-nav-link <?= ($current_dir === 'settings' && $current_page === 'company.php') ? 'active' : '' ?>">
                <i class="fa-solid fa-building-shield"></i>
                <span>Company Profile</span>
            </a>
        </li>
        <li>
            <a href="<?= $to_root ?>settings/users.php" class="sb-nav-link <?= ($current_dir === 'settings' && $current_page === 'users.php') ? 'active' : '' ?>">
                <i class="fa-solid fa-user-gear"></i>
                <span>User Management</span>
            </a>
        </li>
    </ul>

    <div class="sb-sidebar-footer">
        <div class="d-flex align-items-center justify-content-between text-white-50 small">
            <div>
                <span class="d-block text-white fw-semibold"><?= htmlspecialchars($_SESSION['user_name'] ?? 'User') ?></span>
                <span class="badge bg-primary text-uppercase"><?= htmlspecialchars($_SESSION['user_role'] ?? 'admin') ?></span>
            </div>
            <a href="<?= $to_root ?>logout.php" class="btn btn-outline-danger btn-sm p-1 px-2" title="Sign Out">
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
            </a>
        </div>
    </div>
</aside>
