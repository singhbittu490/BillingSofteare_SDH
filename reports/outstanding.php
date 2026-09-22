<?php
/**
 * SmartBill - Customer Receivables & Aging Analysis
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Outstanding & Aging - SmartBill';
$company = getCompanySettings($pdo);

// Fetch all unpaid/partially paid invoices
$stmt = $pdo->query("
    SELECT i.*, c.name as customer_name, c.mobile as customer_mobile, c.email as customer_email,
           DATEDIFF(CURDATE(), i.invoice_date) as age_days
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.outstanding_amount > 0
    ORDER BY age_days DESC
");
$invoices = $stmt->fetchAll();

// Aging buckets
$bucket_0_30 = 0;
$bucket_31_60 = 0;
$bucket_60_plus = 0;
$total_outstanding = 0;

foreach ($invoices as $inv) {
    $bal = (float)$inv['outstanding_amount'];
    $total_outstanding += $bal;
    $days = (int)$inv['age_days'];

    if ($days <= 30) {
        $bucket_0_30 += $bal;
    } elseif ($days <= 60) {
        $bucket_31_60 += $bal;
    } else {
        $bucket_60_plus += $bal;
    }
}

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Outstanding Receivables & Aging</h4>
        <p class="text-muted small mb-0">Track pending customer dues, aging intervals, and send payment reminders.</p>
    </div>
    <div class="d-flex gap-2">
        <button onclick="window.print()" class="btn btn-outline-secondary btn-sm shadow-sm">
            <i class="fa-solid fa-print me-1"></i> Print Receivables
        </button>
    </div>
</div>

<!-- Aging Analysis Cards -->
<div class="row g-3 mb-4">
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">TOTAL RECEIVABLES</span>
            <div class="fs-4 fw-bold text-danger mt-1"><?= formatCurrency($total_outstanding) ?></div>
            <div class="small text-muted"><?= count($invoices) ?> Pending Invoices</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white border-start border-success border-4">
            <span class="text-muted small fw-semibold">0 - 30 DAYS (CURRENT)</span>
            <div class="fs-4 fw-bold text-success mt-1"><?= formatCurrency($bucket_0_30) ?></div>
            <div class="small text-muted">Normal credit period</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white border-start border-warning border-4">
            <span class="text-muted small fw-semibold">31 - 60 DAYS</span>
            <div class="fs-4 fw-bold text-warning mt-1"><?= formatCurrency($bucket_31_60) ?></div>
            <div class="small text-muted">Follow-up advised</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white border-start border-danger border-4">
            <span class="text-muted small fw-semibold">60+ DAYS (OVERDUE)</span>
            <div class="fs-4 fw-bold text-danger mt-1"><?= formatCurrency($bucket_60_plus) ?></div>
            <div class="small text-muted">Urgent recovery needed</div>
        </div>
    </div>
</div>

<!-- Receivables Table -->
<div class="card border-0 shadow-sm">
    <div class="card-header bg-white py-3">
        <span class="fw-bold text-dark"><i class="fa-solid fa-hourglass-half text-danger me-2"></i>Pending Bills List</span>
    </div>
    <div class="card-body p-0">
        <?php if (empty($invoices)): ?>
            <div class="p-5 text-center text-muted">
                <i class="fa-solid fa-circle-check fa-3x mb-3 text-success"></i>
                <h5>All Invoices Settled!</h5>
                <p class="small">There are currently no overdue or outstanding balances.</p>
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 small">
                    <thead class="table-light">
                        <tr>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th>Customer & Phone</th>
                            <th>Due Date</th>
                            <th class="text-center">Age</th>
                            <th class="text-end">Invoice Amount</th>
                            <th class="text-end">Paid So Far</th>
                            <th class="text-end">Balance Due</th>
                            <th class="text-end">Remind</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($invoices as $inv): ?>
                            <?php 
                                $days = (int)$inv['age_days'];
                                $badge_age = 'bg-success-subtle text-success';
                                if ($days > 60) $badge_age = 'bg-danger-subtle text-danger';
                                elseif ($days > 30) $badge_age = 'bg-warning-subtle text-warning';

                                // WhatsApp message
                                $wa_phone = preg_replace('/[^0-9]/', '', $inv['customer_mobile'] ?? '');
                                if (strlen($wa_phone) === 10) $wa_phone = '91' . $wa_phone;
                                $wa_msg = urlencode("Gentle reminder from " . ($company['company_name'] ?? 'SmartBill') . ": Dear " . $inv['customer_name'] . ", balance of " . formatCurrency($inv['outstanding_amount']) . " is pending for invoice " . $inv['invoice_number'] . " dated " . formatDate($inv['invoice_date']) . ". Please settle at earliest. Thank you.");
                                $wa_url = "https://api.whatsapp.com/send?phone={$wa_phone}&text={$wa_msg}";
                            ?>
                            <tr>
                                <td class="fw-bold font-monospace">
                                    <a href="../invoices/view.php?id=<?= $inv['id'] ?>" class="text-primary text-decoration-none">
                                        <?= htmlspecialchars($inv['invoice_number']) ?>
                                    </a>
                                </td>
                                <td><?= formatDate($inv['invoice_date'], 'd M Y') ?></td>
                                <td>
                                    <div class="fw-semibold text-dark"><?= htmlspecialchars($inv['customer_name']) ?></div>
                                    <div class="text-muted font-monospace" style="font-size: 0.75rem;"><?= htmlspecialchars($inv['customer_mobile'] ?: 'No Phone') ?></div>
                                </td>
                                <td><?= formatDate($inv['due_date'], 'd M Y') ?></td>
                                <td class="text-center">
                                    <span class="badge <?= $badge_age ?>"><?= $days ?> days</span>
                                </td>
                                <td class="text-end"><?= formatCurrency($inv['grand_total']) ?></td>
                                <td class="text-end text-success"><?= formatCurrency($inv['paid_amount']) ?></td>
                                <td class="text-end fw-bold text-danger fs-6"><?= formatCurrency($inv['outstanding_amount']) ?></td>
                                <td class="text-end">
                                    <div class="btn-group btn-group-sm">
                                        <a href="<?= $wa_url ?>" target="_blank" class="btn btn-light border text-success" title="WhatsApp Reminder">
                                            <i class="fa-brands fa-whatsapp"></i> Remind
                                        </a>
                                        <a href="../payments/create.php?invoice_id=<?= $inv['id'] ?>" class="btn btn-primary" title="Record Payment">
                                            <i class="fa-solid fa-hand-holding-dollar"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
