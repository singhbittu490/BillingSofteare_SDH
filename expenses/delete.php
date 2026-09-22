<?php
/**
 * SmartBill - Delete Expense
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$token = $_GET['token'] ?? '';

if (!verifyCSRFToken($token)) {
    setFlash('danger', 'Security validation failed.');
    header("Location: index.php");
    exit;
}

$stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
$stmt->execute([$id]);

setFlash('success', 'Expense entry deleted successfully.');
header("Location: index.php");
exit;
