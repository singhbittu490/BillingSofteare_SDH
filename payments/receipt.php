<?php
/**
 * SmartBill - Payment Voucher / Receipt
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("
    SELECT p.*, i.invoice_number, i.grand_total as invoice_total, i.outstanding_amount,
           c.name as customer_name, c.mobile as customer_mobile, c.billing_address
    FROM payments p
    LEFT JOIN invoices i ON p.invoice_id = i.id
    LEFT JOIN customers c ON p.customer_id = c.id
    WHERE p.id = ?
");
$stmt->execute([$id]);
$payment = $stmt->fetch();

if (!$payment) {
    setFlash('danger', 'Payment receipt not found.');
    header("Location: index.php");
    exit;
}

$company = getCompanySettings($pdo);
$page_title = 'Payment Receipt - ' . $payment['reference_number'];

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex justify-content-between align-items-center mb-4 no-print">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Payment Receipt</h4>
        <span class="text-muted small">Reference: <?= htmlspecialchars($payment['reference_number']) ?></span>
    </div>
    <div class="d-flex gap-2">
        <button onclick="window.print()" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-print me-1"></i> Print Receipt
        </button>
        <a href="index.php" class="btn btn-outline-secondary btn-sm">All Payments</a>
    </div>
</div>

<div class="row justify-content-center">
    <div class="col-lg-7">
        <div class="card border-0 shadow-sm p-4 print-receipt-card">
            <!-- Header -->
            <div class="d-flex justify-content-between border-bottom pb-3 mb-3">
                <div>
                    <h5 class="fw-bold text-dark mb-1"><?= htmlspecialchars($company['company_name'] ?? 'SmartBill') ?></h5>
                    <div class="small text-muted"><?= htmlspecialchars($company['address'] ?? '') ?></div>
                    <div class="small text-muted">GSTIN: <?= htmlspecialchars($company['gstin'] ?? 'N/A') ?></div>
                </div>
                <div class="text-end">
                    <span class="badge bg-success text-white px-3 py-2 text-uppercase fs-6">PAYMENT RECEIPT</span>
                    <div class="small text-muted mt-2"><strong>Receipt No:</strong> <?= htmlspecialchars($payment['reference_number']) ?></div>
                    <div class="small text-muted"><strong>Date:</strong> <?= formatDate($payment['payment_date'], 'd M Y') ?></div>
                </div>
            </div>

            <!-- Receipt Body -->
            <div class="mb-4">
                <table class="table table-borderless small mb-0">
                    <tr>
                        <td class="text-muted ps-0" style="width: 140px;">Received From:</td>
                        <td class="fw-bold text-dark fs-6"><?= htmlspecialchars($payment['customer_name']) ?></td>
                    </tr>
                    <tr>
                        <td class="text-muted ps-0">Payment Method:</td>
                        <td><span class="badge bg-light text-dark border"><?= htmlspecialchars($payment['payment_method']) ?></span></td>
                    </tr>
                    <tr>
                        <td class="text-muted ps-0">Invoice Linked:</td>
                        <td>
                            <a href="../invoices/view.php?id=<?= $payment['invoice_id'] ?>" class="text-decoration-none fw-semibold">
                                <?= htmlspecialchars($payment['invoice_number']) ?>
                            </a>
                        </td>
                    </tr>
                    <?php if (!empty($payment['notes'])): ?>
                        <tr>
                            <td class="text-muted ps-0">Remarks / Note:</td>
                            <td><?= htmlspecialchars($payment['notes']) ?></td>
                        </tr>
                    <?php endif; ?>
                </table>
            </div>

            <!-- Amount Callout -->
            <div class="p-3 bg-light rounded text-center border mb-4">
                <span class="text-muted small fw-semibold text-uppercase">Amount Received</span>
                <div class="fs-2 fw-bold text-success mt-1"><?= formatCurrency($payment['amount']) ?></div>
                <div class="small text-dark mt-1"><em><?= numberToWordsIndian($payment['amount']) ?></em></div>
            </div>

            <!-- Invoice Balance Status -->
            <div class="row pt-2 border-top small text-muted">
                <div class="col-6">
                    Total Invoice Amount: <strong><?= formatCurrency($payment['invoice_total']) ?></strong><br>
                    Remaining Balance: <strong class="<?= ((float)$payment['outstanding_amount'] > 0) ? 'text-danger' : 'text-success' ?>"><?= formatCurrency($payment['outstanding_amount']) ?></strong>
                </div>
                <div class="col-6 text-end">
                    <div class="mb-4">Authorized Signature</div>
                    <div class="border-top d-inline-block pt-1 px-4 text-muted" style="border-top-style: dashed !important;">
                        SmartBill Accounts
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
