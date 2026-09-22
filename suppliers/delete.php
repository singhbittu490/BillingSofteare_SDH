<?php
/**
 * SmartBill - Delete Supplier
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$token = $_GET['token'] ?? '';

if (!verifyCSRFToken($token)) {
    setFlash('danger', 'Security validation failed.');
    header("Location: index.php");
    exit;
}

// Check if supplier has purchases
$stmt = $pdo->prepare("SELECT COUNT(*) FROM purchases WHERE supplier_id = ?");
$stmt->execute([$id]);
if ($stmt->fetchColumn() > 0) {
    setFlash('danger', 'Cannot delete this supplier because purchase bills are attached to their record.');
    header("Location: index.php");
    exit;
}

$stmt = $pdo->prepare("DELETE FROM suppliers WHERE id = ?");
$stmt->execute([$id]);

setFlash('success', 'Supplier deleted successfully.');
header("Location: index.php");
exit;
