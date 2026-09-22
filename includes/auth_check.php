<?php
/**
 * SmartBill - Authentication Check Middleware
 * Protects administrative & dashboard pages
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/functions.php';

// Check if user is logged in
if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
    // Determine base URL relative to root
    $current_url = urlencode($_SERVER['REQUEST_URI'] ?? 'dashboard.php');
    
    // Compute relative path to root login.php
    $depth = substr_count(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
    // If running in subfolder like customers/, we need ../login.php
    $script_dir = trim(dirname($_SERVER['PHP_SELF'] ?? ''), '/');
    $parts = explode('/', $script_dir);
    $back = '';
    // Check if we are in a subfolder
    if (in_array(end($parts), ['customers', 'suppliers', 'products', 'categories', 'invoices', 'payments', 'purchases', 'expenses', 'reports', 'settings', 'auth', 'api'])) {
        $back = '../';
    }
    
    header("Location: {$back}login.php?msg=login_required");
    exit;
}

// Verify that user still exists and is active in database
$stmt = $pdo->prepare("SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1");
$stmt->execute([$_SESSION['user_id']]);
$current_user = $stmt->fetch();

if (!$current_user || $current_user['status'] !== 'active') {
    // Account deactivated or deleted
    session_unset();
    session_destroy();
    $back = (file_exists('login.php')) ? '' : '../';
    header("Location: {$back}login.php?msg=account_inactive");
    exit;
}

// Refresh session data
$_SESSION['user_name'] = $current_user['name'];
$_SESSION['user_role'] = $current_user['role'];

/**
 * Check if current user has specific role
 */
function hasRole($role) {
    global $current_user;
    if (!$current_user) return false;
    if ($current_user['role'] === 'admin') return true; // admin has all privileges
    return $current_user['role'] === $role;
}

/**
 * Enforce Admin Role
 */
function requireAdmin() {
    global $current_user;
    if ($current_user['role'] !== 'admin') {
        $back = (file_exists('dashboard.php')) ? '' : '../';
        setFlash('danger', 'Access denied. You do not have permission to access that section.');
        header("Location: {$back}dashboard.php");
        exit;
    }
}
