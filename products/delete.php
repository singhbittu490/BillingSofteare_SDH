<?php
/**
 * SmartBill - Delete Product
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$token = $_GET['token'] ?? '';

if (!verifyCSRFToken($token)) {
    setFlash('danger', 'Security validation failed.');
    header("Location: index.php");
    exit;
}

// Check if product is in invoice items
$stmt = $pdo->prepare("SELECT COUNT(*) FROM invoice_items WHERE product_id = ?");
$stmt->execute([$id]);
if ($stmt->fetchColumn() > 0) {
    setFlash('danger', 'Cannot delete this product because it has been invoiced to customers. Deactivate or rename the item instead.');
    header("Location: index.php");
    exit;
}

// Delete product & its stock movements
$pdo->prepare("DELETE FROM stock_movements WHERE product_id = ?")->execute([$id]);
$pdo->prepare("DELETE FROM products WHERE id = ?")->execute([$id]);

setFlash('success', 'Product deleted successfully.');
header("Location: index.php");
exit;
