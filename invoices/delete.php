<?php
/**
 * SmartBill - Delete Invoice & Restore Stock
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$token = $_GET['token'] ?? '';

if (!verifyCSRFToken($token)) {
    setFlash('danger', 'Security validation failed.');
    header("Location: index.php");
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ?");
$stmt->execute([$id]);
$invoice = $stmt->fetch();

if (!$invoice) {
    setFlash('danger', 'Invoice not found.');
    header("Location: index.php");
    exit;
}

try {
    $pdo->beginTransaction();

    // Fetch items to restore stock
    $item_stmt = $pdo->prepare("SELECT product_id, quantity FROM invoice_items WHERE invoice_id = ?");
    $item_stmt->execute([$id]);
    $items = $item_stmt->fetchAll();

    foreach ($items as $it) {
        if (!empty($it['product_id'])) {
            updateProductStock($pdo, $it['product_id'], (float)$it['quantity']);
            recordStockMovement(
                $pdo,
                $it['product_id'],
                'return',
                (float)$it['quantity'],
                'invoice_delete',
                $invoice['invoice_number'],
                "Stock restored from deleted invoice {$invoice['invoice_number']}"
            );
        }
    }

    // Delete linked records
    $pdo->prepare("DELETE FROM payments WHERE invoice_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM invoice_items WHERE invoice_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM invoices WHERE id = ?")->execute([$id]);

    $pdo->commit();
    setFlash('success', "Invoice {$invoice['invoice_number']} deleted and inventory restored successfully.");

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    setFlash('danger', 'Failed to delete invoice: ' . $e->getMessage());
}

header("Location: index.php");
exit;
