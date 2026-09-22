<?php
/**
 * SmartBill - Delete Customer
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$token = $_GET['token'] ?? '';

if (!verifyCSRFToken($token)) {
    setFlash('danger', 'Security validation failed.');
    header("Location: index.php");
    exit;
}

// Check if customer has invoices
$stmt = $pdo->prepare("SELECT COUNT(*) FROM invoices WHERE customer_id = ?");
$stmt->execute([$id]);
if ($stmt->fetchColumn() > 0) {
    setFlash('danger', 'Cannot delete this customer because existing invoices are attached to their account.');
    header("Location: index.php");
    exit;
}

$stmt = $pdo->prepare("DELETE FROM customers WHERE id = ?");
$stmt->execute([$id]);

setFlash('success', 'Customer deleted successfully.');
header("Location: index.php");
exit;
