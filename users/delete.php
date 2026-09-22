<?php
/**
 * SmartBill - Delete User
 */

require_once __DIR__ . '/../includes/auth_check.php';
requireAdmin();

$id = (int)($_GET['id'] ?? 0);
$token = $_GET['token'] ?? '';

if (!verifyCSRFToken($token)) {
    setFlash('danger', 'Security validation failed.');
    header("Location: index.php");
    exit;
}

if ($id === (int)$_SESSION['user_id']) {
    setFlash('danger', 'You cannot delete your own logged-in account.');
    header("Location: index.php");
    exit;
}

$stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
$stmt->execute([$id]);

setFlash('success', 'User account deleted successfully.');
header("Location: index.php");
exit;
