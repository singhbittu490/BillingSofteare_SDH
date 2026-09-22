<?php
/**
 * SmartBill - GST Tax Summary Report (GSTR-1 / GSTR-3B Friendly)
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'GST Tax Report - SmartBill';

$from_date = trim($_GET['from'] ?? date('Y-m-01'));
$to_date = trim($_GET['to'] ?? date('Y-m-d'));

// Fetch Invoices in range
$stmt = $pdo->prepare("
    SELECT * FROM invoices 
    WHERE invoice_date >= ? AND invoice_date <= ? 
    ORDER BY invoice_date ASC
");
$stmt->execute([$from_date, $to_date]);
$invoices = $stmt->fetchAll();

// Fetch HSN line items in range
$stmt = $pdo->prepare("
    SELECT ii.*, i.invoice_date, i.invoice_number, i.customer_name, i.place_of_supply
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    WHERE i.invoice_date >= ? AND i.invoice_date <= ?
    ORDER BY ii.hsn_sac ASC
");
$stmt->execute([$from_date, $to_date]);
$items = $stmt->fetchAll();

// Totals
$total_taxable = 0;
$total_cgst = 0;
$total_sgst = 0;
$total_igst = 0;

foreach ($invoices as $inv) {
    $total_taxable += (float)$inv['taxable_amount'];
    $total_cgst += (float)$inv['cgst'];
    $total_sgst += (float)$inv['sgst'];
    $total_igst += (float)$inv['igst'];
}
$total_gst = $total_cgst + $total_sgst + $total_igst;

// HSN Aggregates
$hsn_map = [];
foreach ($items as $it) {
    $hsn = $it['hsn_sac'] ?: 'N/A';
    if (!isset($hsn_map[$hsn])) {
        $hsn_map[$hsn] = [
            'hsn' => $hsn,
            'description' => $it['product_name'],
            'unit' => $it['unit'],
            'total_qty' => 0,
            'taxable_amount' => 0,
            'gst_rate' => $it['gst_rate'],
            'cgst' => 0,
            'sgst' => 0,
            'igst' => 0,
            'total_tax' => 0
        ];
    }
    $hsn_map[$hsn]['total_qty'] += (float)$it['quantity'];
    $hsn_map[$hsn]['taxable_amount'] += (float)$it['taxable_amount'];
    $hsn_map[$hsn]['cgst'] += (float)$it['cgst_amount'];
    $hsn_map[$hsn]['sgst'] += (float)$it['sgst_amount'];
    $hsn_map[$hsn]['igst'] += (float)$it['igst_amount'];
    $hsn_map[$hsn]['total_tax'] += ((float)$it['cgst_amount'] + (float)$it['sgst_amount'] + (float)$it['igst_amount']);
}

// Export HSN summary CSV
if (isset($_GET['export']) && $_GET['export'] === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=smartbill_gstr_hsn_' . $from_date . '_to_' . $to_date . '.csv');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['HSN/SAC', 'Description', 'Total Qty', 'Unit', 'Taxable Value', 'GST Rate %', 'CGST', 'SGST', 'IGST', 'Total GST Tax']);
    foreach ($hsn_map as $h) {
        fputcsv($out, [
            $h['hsn'],
            $h['description'],
            $h['total_qty'],
            $h['unit'],
            $h['taxable_amount'],
            $h['gst_rate'],
            $h['cgst'],
            $h['sgst'],
            $h['igst'],
            $h['total_tax']
        ]);
    }
    fclose($out);
    exit;
}

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">GST Returns Tax Report</h4>
        <p class="text-muted small mb-0">Consolidated GSTR-1 & GSTR-3B tax report with HSN/SAC chapter summaries.</p>
    </div>
    <div class="d-flex gap-2">
        <a href="gst.php?from=<?= urlencode($from_date) ?>&to=<?= urlencode($to_date) ?>&export=csv" class="btn btn-outline-success btn-sm shadow-sm">
            <i class="fa-solid fa-file-excel me-1"></i> Export HSN Summary CSV
        </a>
        <button onclick="window.print()" class="btn btn-outline-secondary btn-sm shadow-sm">
            <i class="fa-solid fa-print me-1"></i> Print Report
        </button>
    </div>
</div>

<!-- Filters -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-body p-3">
        <form method="GET" action="gst.php" class="row g-2 align-items-center">
            <div class="col-md-5">
                <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light">From</span>
                    <input type="date" name="from" class="form-control" value="<?= htmlspecialchars($from_date) ?>" required>
                </div>
            </div>
            <div class="col-md-5">
                <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light">To</span>
                    <input type="date" name="to" class="form-control" value="<?= htmlspecialchars($to_date) ?>" required>
                </div>
            </div>
            <div class="col-md-2 d-flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm flex-grow-1">Generate</button>
            </div>
        </form>
    </div>
</div>

<!-- Tax Totals -->
<div class="row g-3 mb-4">
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">TOTAL TAXABLE TURNOVER</span>
            <div class="fs-4 fw-bold text-dark mt-1"><?= formatCurrency($total_taxable) ?></div>
            <div class="small text-muted"><?= count($invoices) ?> Total Bills</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">CGST COLLECTED</span>
            <div class="fs-4 fw-bold text-primary mt-1"><?= formatCurrency($total_cgst) ?></div>
            <div class="small text-muted">Central GST liability</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">SGST COLLECTED</span>
            <div class="fs-4 fw-bold text-primary mt-1"><?= formatCurrency($total_sgst) ?></div>
            <div class="small text-muted">State GST liability</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">IGST COLLECTED</span>
            <div class="fs-4 fw-bold text-info mt-1"><?= formatCurrency($total_igst) ?></div>
            <div class="small text-muted">Integrated interstate GST</div>
        </div>
    </div>
</div>

<!-- Total Combined Liability Banner -->
<div class="p-3 bg-white rounded shadow-sm border d-flex justify-content-between align-items-center mb-4">
    <div>
        <span class="text-muted small fw-bold text-uppercase">Total Output Tax Liability (GSTR-3B Table 3.1)</span>
        <div class="text-muted small">Combined CGST + SGST + IGST collected on outward supplies</div>
    </div>
    <div class="fs-3 fw-bold text-primary">
        <?= formatCurrency($total_gst) ?>
    </div>
</div>

<!-- HSN/SAC Summary Table -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-header bg-white py-3">
        <span class="fw-bold text-dark"><i class="fa-solid fa-list-ol text-primary me-2"></i>HSN / SAC Summary (GSTR-1 Table 12)</span>
    </div>
    <div class="card-body p-0">
        <?php if (empty($hsn_map)): ?>
            <div class="p-4 text-center text-muted small">No items invoiced in this period.</div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 small">
                    <thead class="table-light">
                        <tr>
                            <th>HSN/SAC</th>
                            <th>Description</th>
                            <th class="text-center">UQC / Unit</th>
                            <th class="text-end">Total Qty</th>
                            <th class="text-end">Taxable Value (₹)</th>
                            <th class="text-center">Rate</th>
                            <th class="text-end">CGST (₹)</th>
                            <th class="text-end">SGST (₹)</th>
                            <th class="text-end">IGST (₹)</th>
                            <th class="text-end">Total Tax (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($hsn_map as $h): ?>
                            <tr>
                                <td class="font-monospace fw-bold"><?= htmlspecialchars($h['hsn']) ?></td>
                                <td><?= htmlspecialchars($h['description']) ?></td>
                                <td class="text-center"><span class="badge bg-light text-dark border"><?= htmlspecialchars($h['unit']) ?></span></td>
                                <td class="text-end fw-semibold"><?= (float)$h['total_qty'] ?></td>
                                <td class="text-end fw-semibold"><?= formatCurrency($h['taxable_amount']) ?></td>
                                <td class="text-center"><?= (float)$h['gst_rate'] ?>%</td>
                                <td class="text-end"><?= formatCurrency($h['cgst']) ?></td>
                                <td class="text-end"><?= formatCurrency($h['sgst']) ?></td>
                                <td class="text-end"><?= formatCurrency($h['igst']) ?></td>
                                <td class="text-end fw-bold text-primary"><?= formatCurrency($h['total_tax']) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
