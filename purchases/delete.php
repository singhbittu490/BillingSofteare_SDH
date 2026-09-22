<?php
/**
 * SmartBill - Delete Purchase Bill & Reverse Added Stock
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$token = $_GET['token'] ?? '';

if (!verifyCSRFToken($token)) {
    setFlash('danger', 'Security validation failed.');
    header("Location: index.php");
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM purchases WHERE id = ?");
$stmt->execute([$id]);
$purchase = $stmt->fetch();

if (!$purchase) {
    setFlash('danger', 'Purchase record not found.');
    header("Location: index.php");
    exit;
}

try {
    $pdo->beginTransaction();

    // Deduct stock for all items
    $item_stmt = $pdo->prepare("SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ?");
    $item_stmt->execute([$id]);
    $items = $item_stmt->fetchAll();

    foreach ($items as $it) {
        if (!empty($it['product_id'])) {
            updateProductStock($pdo, $it['product_id'], -(float)$it['quantity']);
            recordStockMovement(
                $pdo,
                $it['product_id'],
                'adjustment',
                -(float)$it['quantity'],
                'purchase_delete',
                $purchase['purchase_number'],
                "Stock removed due to purchase bill deletion"
            );
        }
    }

    $pdo->prepare("DELETE FROM purchase_items WHERE purchase_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM purchases WHERE id = ?")->execute([$id]);

    $pdo->commit();
    setFlash('success', "Purchase bill {$purchase['purchase_number']} deleted and inventory reversed.");

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    setFlash('danger', 'Failed to delete purchase: ' . $e->getMessage());
}

header("Location: index.php");
exit;
