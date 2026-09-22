<?php
/**
 * SmartBill - Sales Report with CSV Export
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Sales Report - SmartBill';

$from_date = trim($_GET['from'] ?? date('Y-m-01'));
$to_date = trim($_GET['to'] ?? date('Y-m-d'));
$customer_id = (int)($_GET['customer_id'] ?? 0);

$query = "
    SELECT i.*, c.name as customer_name
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.invoice_date >= ? AND i.invoice_date <= ?
";
$params = [$from_date, $to_date];

if ($customer_id > 0) {
    $query .= " AND i.customer_id = ?";
    $params[] = $customer_id;
}

$query .= " ORDER BY i.invoice_date DESC, i.id DESC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$sales = $stmt->fetchAll();

// Aggregates
$total_invoices = count($sales);
$total_subtotal = 0;
$total_discount = 0;
$total_taxable = 0;
$total_tax = 0;
$total_grand = 0;
$total_received = 0;
$total_due = 0;

foreach ($sales as $s) {
    $total_subtotal += (float)$s['subtotal'];
    $total_discount += (float)$s['discount'];
    $total_taxable += (float)$s['taxable_amount'];
    $total_tax += ((float)$s['cgst'] + (float)$s['sgst'] + (float)$s['igst']);
    $total_grand += (float)$s['grand_total'];
    $total_received += (float)$s['paid_amount'];
    $total_due += (float)$s['outstanding_amount'];
}

// CSV Export
if (isset($_GET['export']) && $_GET['export'] === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=smartbill_sales_' . $from_date . '_to_' . $to_date . '.csv');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Invoice Number', 'Date', 'Customer', 'GSTIN', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Grand Total', 'Paid Amount', 'Due Balance', 'Status']);
    foreach ($sales as $s) {
        fputcsv($out, [
            $s['invoice_number'],
            $s['invoice_date'],
            $s['customer_name'],
            $s['customer_gstin'],
            $s['taxable_amount'],
            $s['cgst'],
            $s['sgst'],
            $s['igst'],
            $s['grand_total'],
            $s['paid_amount'],
            $s['outstanding_amount'],
            $s['status']
        ]);
    }
    fclose($out);
    exit;
}

$customers = $pdo->query("SELECT id, name FROM customers ORDER BY name ASC")->fetchAll();

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Sales & Invoicing Report</h4>
        <p class="text-muted small mb-0">Review billed revenue, collected taxes, and outstanding customer balances.</p>
    </div>
    <div class="d-flex gap-2">
        <a href="sales.php?from=<?= urlencode($from_date) ?>&to=<?= urlencode($to_date) ?>&customer_id=<?= $customer_id ?>&export=csv" class="btn btn-outline-success btn-sm shadow-sm">
            <i class="fa-solid fa-file-excel me-1"></i> Export to CSV
        </a>
        <button onclick="window.print()" class="btn btn-outline-secondary btn-sm shadow-sm">
            <i class="fa-solid fa-print me-1"></i> Print
        </button>
    </div>
</div>

<!-- Filters -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-body p-3">
        <form method="GET" action="sales.php" class="row g-2 align-items-center">
            <div class="col-md-4">
                <select name="customer_id" class="form-select form-select-sm" onchange="this.form.submit()">
                    <option value="0">All Customers</option>
                    <?php foreach ($customers as $c): ?>
                        <option value="<?= $c['id'] ?>" <?= ($customer_id === (int)$c['id']) ? 'selected' : '' ?>>
                            <?= htmlspecialchars($c['name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="col-md-3">
                <input type="date" name="from" class="form-control form-control-sm" value="<?= htmlspecialchars($from_date) ?>" required title="From Date">
            </div>
            <div class="col-md-3">
                <input type="date" name="to" class="form-control form-control-sm" value="<?= htmlspecialchars($to_date) ?>" required title="To Date">
            </div>
            <div class="col-md-2 d-flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm flex-grow-1">Run Report</button>
            </div>
        </form>
    </div>
</div>

<!-- Aggregates Dashboard -->
<div class="row g-3 mb-4">
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">TOTAL GROSS SALES</span>
            <div class="fs-4 fw-bold text-dark mt-1"><?= formatCurrency($total_grand) ?></div>
            <div class="small text-muted"><?= $total_invoices ?> Invoices issued</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">TAXABLE TURNOVER</span>
            <div class="fs-4 fw-bold text-primary mt-1"><?= formatCurrency($total_taxable) ?></div>
            <div class="small text-muted">Excluding GST</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">TOTAL GST COLLECTED</span>
            <div class="fs-4 fw-bold text-info mt-1"><?= formatCurrency($total_tax) ?></div>
            <div class="small text-muted">CGST + SGST + IGST</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">OUTSTANDING BALANCE</span>
            <div class="fs-4 fw-bold text-danger mt-1"><?= formatCurrency($total_due) ?></div>
            <div class="small text-success">Collected: <?= formatCurrency($total_received) ?></div>
        </div>
    </div>
</div>

<!-- Sales Table -->
<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <?php if (empty($sales)): ?>
            <div class="p-4 text-center text-muted small">No sales records found in selected date range.</div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 small">
                    <thead class="table-light">
                        <tr>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th class="text-end">Taxable (₹)</th>
                            <th class="text-end">GST (₹)</th>
                            <th class="text-end">Grand Total</th>
                            <th class="text-end">Paid</th>
                            <th class="text-end">Balance</th>
                            <th class="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($sales as $s): ?>
                            <?php $gst_amount = (float)$s['cgst'] + (float)$s['sgst'] + (float)$s['igst']; ?>
                            <tr>
                                <td class="fw-bold font-monospace">
                                    <a href="../invoices/view.php?id=<?= $s['id'] ?>" class="text-primary text-decoration-none">
                                        <?= htmlspecialchars($s['invoice_number']) ?>
                                    </a>
                                </td>
                                <td><?= formatDate($s['invoice_date'], 'd M Y') ?></td>
                                <td class="fw-semibold text-dark"><?= htmlspecialchars($s['customer_name']) ?></td>
                                <td class="text-end"><?= formatCurrency($s['taxable_amount']) ?></td>
                                <td class="text-end text-primary"><?= formatCurrency($gst_amount) ?></td>
                                <td class="text-end fw-bold"><?= formatCurrency($s['grand_total']) ?></td>
                                <td class="text-end text-success"><?= formatCurrency($s['paid_amount']) ?></td>
                                <td class="text-end fw-bold <?= ((float)$s['outstanding_amount'] > 0) ? 'text-danger' : 'text-muted' ?>">
                                    <?= formatCurrency($s['outstanding_amount']) ?>
                                </td>
                                <td class="text-center">
                                    <span class="badge bg-light text-dark border"><?= htmlspecialchars($s['status']) ?></span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                    <tfoot class="table-light fw-bold">
                        <tr>
                            <td colspan="3" class="text-end">Total Summary:</td>
                            <td class="text-end"><?= formatCurrency($total_taxable) ?></td>
                            <td class="text-end text-primary"><?= formatCurrency($total_tax) ?></td>
                            <td class="text-end"><?= formatCurrency($total_grand) ?></td>
                            <td class="text-end text-success"><?= formatCurrency($total_received) ?></td>
                            <td class="text-end text-danger"><?= formatCurrency($total_due) ?></td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
