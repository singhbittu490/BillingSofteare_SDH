<?php
/**
 * SmartBill - Delete Payment & Adjust Invoice Balance
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$token = $_GET['token'] ?? '';

if (!verifyCSRFToken($token)) {
    setFlash('danger', 'Security validation failed.');
    header("Location: index.php");
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM payments WHERE id = ?");
$stmt->execute([$id]);
$payment = $stmt->fetch();

if (!$payment) {
    setFlash('danger', 'Payment not found.');
    header("Location: index.php");
    exit;
}

try {
    $pdo->beginTransaction();

    $inv_id = $payment['invoice_id'];
    $amount = (float)$payment['amount'];

    // Delete payment
    $pdo->prepare("DELETE FROM payments WHERE id = ?")->execute([$id]);

    // Recalculate invoice if linked
    if ($inv_id) {
        $inv_stmt = $pdo->prepare("SELECT grand_total, paid_amount FROM invoices WHERE id = ?");
        $inv_stmt->execute([$inv_id]);
        $inv = $inv_stmt->fetch();

        if ($inv) {
            $new_paid = max(0, (float)$inv['paid_amount'] - $amount);
            $new_due = max(0, (float)$inv['grand_total'] - $new_paid);
            $new_status = ($new_due <= 0) ? 'Paid' : (($new_paid > 0) ? 'Partially Paid' : 'Unpaid');

            $upd = $pdo->prepare("UPDATE invoices SET paid_amount = ?, outstanding_amount = ?, status = ? WHERE id = ?");
            $upd->execute([$new_paid, $new_due, $new_status, $inv_id]);
        }
    }

    $pdo->commit();
    setFlash('success', 'Payment deleted and invoice balance adjusted.');

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    setFlash('danger', 'Error deleting payment: ' . $e->getMessage());
}

header("Location: index.php");
exit;
