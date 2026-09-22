<?php
/**
 * SmartBill - Customer Ledger Statement
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
$stmt->execute([$id]);
$customer = $stmt->fetch();

if (!$customer) {
    setFlash('danger', 'Customer not found.');
    header("Location: index.php");
    exit;
}

$page_title = 'Statement - ' . $customer['name'];
$company = getCompanySettings($pdo);

// Date filters
$from_date = $_GET['from'] ?? date('Y-01-01');
$to_date = $_GET['to'] ?? date('Y-m-d');

// Combine invoices and payments into a ledger timeline
$stmt = $pdo->prepare("
    SELECT 'INVOICE' as trans_type, id, invoice_number as ref_no, invoice_date as trans_date, grand_total as debit, 0 as credit, 'Tax Invoice' as description
    FROM invoices 
    WHERE customer_id = ? AND invoice_date BETWEEN ? AND ?
    UNION ALL
    SELECT 'PAYMENT' as trans_type, id, COALESCE(reference_number, CONCAT('RCPT-', id)) as ref_no, payment_date as trans_date, 0 as debit, amount as credit, CONCAT('Payment (', payment_method, ')') as description
    FROM payments
    WHERE customer_id = ? AND payment_date BETWEEN ? AND ?
    ORDER BY trans_date ASC, id ASC
");
$stmt->execute([$id, $from_date, $to_date, $id, $from_date, $to_date]);
$transactions = $stmt->fetchAll();

// Calculate total debit, credit, opening balance
$opening_balance = (float)$customer['opening_balance'];
$running_balance = $opening_balance;
$total_debit = 0;
$total_credit = 0;

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex justify-content-between align-items-center mb-4 no-print">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Customer Account Statement</h4>
        <p class="text-muted small mb-0">Detailed transaction timeline and running ledger balance for <?= htmlspecialchars($customer['name']) ?>.</p>
    </div>
    <div class="d-flex gap-2">
        <button onclick="window.print()" class="btn btn-outline-dark btn-sm">
            <i class="fa-solid fa-print me-1"></i> Print Statement
        </button>
        <a href="view.php?id=<?= $id ?>" class="btn btn-light btn-sm border">Back</a>
    </div>
</div>

<!-- Date Filter Form (Hidden in Print) -->
<div class="card border-0 shadow-sm mb-4 no-print">
    <div class="card-body p-3">
        <form method="GET" action="statement.php" class="row g-2 align-items-center">
            <input type="hidden" name="id" value="<?= $id ?>">
            <div class="col-md-4">
                <div class="input-group input-group-sm">
                    <span class="input-group-text">From</span>
                    <input type="date" name="from" class="form-control" value="<?= htmlspecialchars($from_date) ?>">
                </div>
            </div>
            <div class="col-md-4">
                <div class="input-group input-group-sm">
                    <span class="input-group-text">To</span>
                    <input type="date" name="to" class="form-control" value="<?= htmlspecialchars($to_date) ?>">
                </div>
            </div>
            <div class="col-md-4 d-flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm flex-grow-1">Filter Statement</button>
                <a href="statement.php?id=<?= $id ?>" class="btn btn-outline-secondary btn-sm">Reset</a>
            </div>
        </form>
    </div>
</div>

<!-- Statement Paper Layout (Matches A4 print standard) -->
<div class="invoice-paper">
    <!-- Header with Company & Customer Info -->
    <div class="row mb-4">
        <div class="col-7">
            <h4 class="fw-bold mb-1"><?= htmlspecialchars($company['company_name'] ?? 'SmartBill') ?></h4>
            <div class="text-muted small"><?= htmlspecialchars($company['address'] ?? '') ?></div>
            <div class="text-muted small"><?= htmlspecialchars($company['city'] ?? '') ?>, <?= htmlspecialchars($company['state'] ?? '') ?> - <?= htmlspecialchars($company['pin_code'] ?? '') ?></div>
            <div class="text-muted small"><strong>GSTIN:</strong> <?= htmlspecialchars($company['gstin'] ?? '') ?></div>
        </div>
        <div class="col-5 text-end">
            <div class="invoice-badge-tax mb-2">Statement of Account</div>
            <div class="small text-muted"><strong>Period:</strong> <?= formatDate($from_date) ?> to <?= formatDate($to_date) ?></div>
            <div class="small text-muted"><strong>Date Generated:</strong> <?= date('d M Y') ?></div>
        </div>
    </div>

    <!-- Statement For Party Box -->
    <div class="invoice-box mb-4 bg-light">
        <div class="row">
            <div class="col-sm-6">
                <div class="invoice-box-title">Statement Prepared For:</div>
                <div class="fw-bold text-dark fs-6"><?= htmlspecialchars($customer['name']) ?></div>
                <?php if ($customer['business_name']): ?>
                    <div class="small text-muted"><?= htmlspecialchars($customer['business_name']) ?></div>
                <?php endif; ?>
                <div class="small text-muted"><?= nl2br(htmlspecialchars($customer['billing_address'] ?? '')) ?></div>
            </div>
            <div class="col-sm-6 text-sm-end">
                <div class="small text-muted"><strong>GSTIN:</strong> <?= htmlspecialchars($customer['gstin'] ?: 'Unregistered') ?></div>
                <div class="small text-muted"><strong>Phone:</strong> <?= htmlspecialchars($customer['mobile'] ?: 'N/A') ?></div>
                <div class="small text-muted"><strong>State:</strong> <?= htmlspecialchars($customer['state'] ?: '') ?> (<?= htmlspecialchars($customer['state_code'] ?: '') ?>)</div>
            </div>
        </div>
    </div>

    <!-- Ledger Table -->
    <table class="invoice-table mb-4">
        <thead>
            <tr>
                <th style="width: 15%;">Date</th>
                <th style="width: 20%;">Reference / Invoice #</th>
                <th style="width: 25%;">Particulars</th>
                <th style="width: 13%;" class="text-end">Billed (Dr)</th>
                <th style="width: 13%;" class="text-end">Paid (Cr)</th>
                <th style="width: 14%;" class="text-end">Balance (₹)</th>
            </tr>
        </thead>
        <tbody>
            <tr class="table-light">
                <td colspan="3" class="fw-semibold">Opening Balance</td>
                <td class="text-end">-</td>
                <td class="text-end">-</td>
                <td class="text-end fw-bold"><?= formatCurrency($opening_balance) ?></td>
            </tr>

            <?php if (empty($transactions)): ?>
                <tr>
                    <td colspan="6" class="text-center text-muted py-3">No transactions found within this period.</td>
                </tr>
            <?php else: ?>
                <?php foreach ($transactions as $tx): ?>
                    <?php 
                        $debit = (float)$tx['debit'];
                        $credit = (float)$tx['credit'];
                        $total_debit += $debit;
                        $total_credit += $credit;
                        $running_balance += ($debit - $credit);
                    ?>
                    <tr>
                        <td><?= formatDate($tx['trans_date']) ?></td>
                        <td class="fw-semibold">
                            <?= htmlspecialchars($tx['ref_no']) ?>
                        </td>
                        <td><?= htmlspecialchars($tx['description']) ?></td>
                        <td class="text-end text-dark"><?= $debit > 0 ? formatCurrency($debit) : '-' ?></td>
                        <td class="text-end text-success"><?= $credit > 0 ? formatCurrency($credit) : '-' ?></td>
                        <td class="text-end fw-bold <?= $running_balance > 0 ? 'text-danger' : 'text-success' ?>">
                            <?= formatCurrency($running_balance) ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
        <tfoot class="table-light fw-bold">
            <tr>
                <td colspan="3" class="text-end">Totals:</td>
                <td class="text-end text-dark"><?= formatCurrency($total_debit) ?></td>
                <td class="text-end text-success"><?= formatCurrency($total_credit) ?></td>
                <td class="text-end text-danger fs-6"><?= formatCurrency($running_balance) ?></td>
            </tr>
        </tfoot>
    </table>

    <!-- Summary Box -->
    <div class="row">
        <div class="col-7 small text-muted">
            <p class="mb-0"><strong>Note:</strong> This is a computer-generated account statement and does not require a physical signature.</p>
        </div>
        <div class="col-5">
            <div class="invoice-total-card">
                <div class="invoice-total-row">
                    <span>Total Billed:</span>
                    <span><?= formatCurrency($total_debit) ?></span>
                </div>
                <div class="invoice-total-row">
                    <span>Total Paid:</span>
                    <span class="text-success"><?= formatCurrency($total_credit) ?></span>
                </div>
                <div class="invoice-total-row grand-total">
                    <span>Closing Balance:</span>
                    <span class="text-danger"><?= formatCurrency($running_balance) ?></span>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
