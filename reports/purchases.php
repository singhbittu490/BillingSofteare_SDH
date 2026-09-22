<?php
/**
 * SmartBill - Inward Purchases Report & Input Tax Credit
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Purchase Report - SmartBill';

$from_date = trim($_GET['from'] ?? date('Y-m-01'));
$to_date = trim($_GET['to'] ?? date('Y-m-d'));
$supplier_id = (int)($_GET['supplier_id'] ?? 0);

$query = "
    SELECT p.*, s.name as supplier_name, s.gstin as supplier_gstin
    FROM purchases p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.purchase_date >= ? AND p.purchase_date <= ?
";
$params = [$from_date, $to_date];

if ($supplier_id > 0) {
    $query .= " AND p.supplier_id = ?";
    $params[] = $supplier_id;
}

$query .= " ORDER BY p.purchase_date DESC, p.id DESC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$purchases = $stmt->fetchAll();

$total_subtotal = 0;
$total_tax = 0;
$total_grand = 0;

foreach ($purchases as $p) {
    $total_subtotal += (float)$p['subtotal'];
    $total_tax += (float)$p['tax_amount'];
    $total_grand += (float)$p['grand_total'];
}

// CSV Export
if (isset($_GET['export']) && $_GET['export'] === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=smartbill_purchases_' . $from_date . '_to_' . $to_date . '.csv');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Purchase Number', 'Bill Number', 'Date', 'Supplier Name', 'Supplier GSTIN', 'Subtotal', 'Tax (ITC)', 'Grand Total', 'Payment Status']);
    foreach ($purchases as $p) {
        fputcsv($out, [
            $p['purchase_number'],
            $p['supplier_bill_number'],
            $p['purchase_date'],
            $p['supplier_name'],
            $p['supplier_gstin'],
            $p['subtotal'],
            $p['tax_amount'],
            $p['grand_total'],
            $p['payment_status']
        ]);
    }
    fclose($out);
    exit;
}

$suppliers = $pdo->query("SELECT id, name FROM suppliers ORDER BY name ASC")->fetchAll();

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Procurement & Purchase Report</h4>
        <p class="text-muted small mb-0">Track supplier bills, inward expenditures, and eligible Input Tax Credit (ITC).</p>
    </div>
    <div class="d-flex gap-2">
        <a href="purchases.php?from=<?= urlencode($from_date) ?>&to=<?= urlencode($to_date) ?>&supplier_id=<?= $supplier_id ?>&export=csv" class="btn btn-outline-success btn-sm shadow-sm">
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
        <form method="GET" action="purchases.php" class="row g-2 align-items-center">
            <div class="col-md-4">
                <select name="supplier_id" class="form-select form-select-sm" onchange="this.form.submit()">
                    <option value="0">All Suppliers</option>
                    <?php foreach ($suppliers as $s): ?>
                        <option value="<?= $s['id'] ?>" <?= ($supplier_id === (int)$s['id']) ? 'selected' : '' ?>>
                            <?= htmlspecialchars($s['name']) ?>
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
                <button type="submit" class="btn btn-primary btn-sm flex-grow-1">Filter</button>
            </div>
        </form>
    </div>
</div>

<!-- Aggregates -->
<div class="row g-3 mb-4">
    <div class="col-md-4">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">TAXABLE PROCUREMENT</span>
            <div class="fs-4 fw-bold text-dark mt-1"><?= formatCurrency($total_subtotal) ?></div>
            <div class="small text-muted"><?= count($purchases) ?> Bills logged</div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">INPUT TAX CREDIT (ITC)</span>
            <div class="fs-4 fw-bold text-success mt-1"><?= formatCurrency($total_tax) ?></div>
            <div class="small text-muted">Eligible GST on purchases</div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">TOTAL PURCHASE SPEND</span>
            <div class="fs-4 fw-bold text-primary mt-1"><?= formatCurrency($total_grand) ?></div>
            <div class="small text-muted">Gross spend on goods</div>
        </div>
    </div>
</div>

<!-- Table -->
<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <?php if (empty($purchases)): ?>
            <div class="p-4 text-center text-muted small">No purchases found in selected date range.</div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 small">
                    <thead class="table-light">
                        <tr>
                            <th>Purchase #</th>
                            <th>Bill #</th>
                            <th>Date</th>
                            <th>Supplier</th>
                            <th class="text-end">Subtotal (₹)</th>
                            <th class="text-end">Tax (ITC)</th>
                            <th class="text-end">Grand Total</th>
                            <th class="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($purchases as $p): ?>
                            <tr>
                                <td class="fw-bold font-monospace">
                                    <a href="../purchases/view.php?id=<?= $p['id'] ?>" class="text-primary text-decoration-none">
                                        <?= htmlspecialchars($p['purchase_number']) ?>
                                    </a>
                                </td>
                                <td class="font-monospace"><?= htmlspecialchars($p['supplier_bill_number'] ?: '-') ?></td>
                                <td><?= formatDate($p['purchase_date'], 'd M Y') ?></td>
                                <td class="fw-semibold text-dark"><?= htmlspecialchars($p['supplier_name'] ?? 'Vendor') ?></td>
                                <td class="text-end"><?= formatCurrency($p['subtotal']) ?></td>
                                <td class="text-end text-success"><?= formatCurrency($p['tax_amount']) ?></td>
                                <td class="text-end fw-bold text-dark"><?= formatCurrency($p['grand_total']) ?></td>
                                <td class="text-center">
                                    <span class="badge bg-light text-dark border"><?= htmlspecialchars($p['payment_status']) ?></span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                    <tfoot class="table-light fw-bold">
                        <tr>
                            <td colspan="4" class="text-end">Total:</td>
                            <td class="text-end"><?= formatCurrency($total_subtotal) ?></td>
                            <td class="text-end text-success"><?= formatCurrency($total_tax) ?></td>
                            <td class="text-end text-primary"><?= formatCurrency($total_grand) ?></td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
