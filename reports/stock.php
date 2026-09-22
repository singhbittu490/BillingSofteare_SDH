<?php
/**
 * SmartBill - Inventory Stock Valuation & Health Report
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Stock Valuation - SmartBill';

$filter = trim($_GET['filter'] ?? '');

$query = "
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
";

if ($filter === 'low') {
    $query .= " AND p.current_stock <= p.minimum_stock AND p.current_stock > 0";
} elseif ($filter === 'out') {
    $query .= " AND p.current_stock <= 0";
}

$query .= " ORDER BY p.current_stock ASC";

$products = $pdo->query($query)->fetchAll();

// Calculate inventory valuation
$total_purchase_valuation = 0;
$total_retail_valuation = 0;
$out_of_stock_count = 0;
$low_stock_count = 0;

$all_prods = $pdo->query("SELECT current_stock, minimum_stock, purchase_price, selling_price FROM products")->fetchAll();
foreach ($all_prods as $p) {
    $qty = (float)$p['current_stock'];
    $cost = (float)$p['purchase_price'];
    $sell = (float)$p['selling_price'];

    if ($qty <= 0) {
        $out_of_stock_count++;
    } elseif ($qty <= (float)$p['minimum_stock']) {
        $low_stock_count++;
    }

    if ($qty > 0) {
        $total_purchase_valuation += ($qty * $cost);
        $total_retail_valuation += ($qty * $sell);
    }
}

// CSV Export
if (isset($_GET['export']) && $_GET['export'] === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=smartbill_stock_valuation_' . date('Y-m-d') . '.csv');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Product Name', 'SKU', 'Category', 'Unit', 'Current Stock', 'Cost Price', 'Selling Price', 'Total Cost Valuation', 'Total Retail Valuation', 'Stock Status']);
    foreach ($products as $p) {
        $qty = (float)$p['current_stock'];
        $cost = (float)$p['purchase_price'];
        $sell = (float)$p['selling_price'];
        $status = ($qty <= 0) ? 'Out of Stock' : (($qty <= (float)$p['minimum_stock']) ? 'Low Stock' : 'In Stock');
        fputcsv($out, [
            $p['name'],
            $p['sku'],
            $p['category_name'],
            $p['unit'],
            $qty,
            $cost,
            $sell,
            $qty * $cost,
            $qty * $sell,
            $status
        ]);
    }
    fclose($out);
    exit;
}

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Stock Valuation & Inventory Health</h4>
        <p class="text-muted small mb-0">Monitor total inventory asset valuation, reorder thresholds, and zero-stock alerts.</p>
    </div>
    <div class="d-flex gap-2">
        <a href="stock.php?filter=<?= urlencode($filter) ?>&export=csv" class="btn btn-outline-success btn-sm shadow-sm">
            <i class="fa-solid fa-file-excel me-1"></i> Export to CSV
        </a>
        <button onclick="window.print()" class="btn btn-outline-secondary btn-sm shadow-sm">
            <i class="fa-solid fa-print me-1"></i> Print
        </button>
    </div>
</div>

<!-- Stock Valuation Summary Cards -->
<div class="row g-3 mb-4">
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">TOTAL STOCK VALUE (COST)</span>
            <div class="fs-4 fw-bold text-dark mt-1"><?= formatCurrency($total_purchase_valuation) ?></div>
            <div class="small text-muted">Capital tied up in inventory</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">RETAIL VALUE (POTENTIAL)</span>
            <div class="fs-4 fw-bold text-primary mt-1"><?= formatCurrency($total_retail_valuation) ?></div>
            <div class="small text-muted">At current selling prices</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">LOW STOCK WARNINGS</span>
            <div class="fs-4 fw-bold text-warning mt-1"><?= $low_stock_count ?> Items</div>
            <a href="stock.php?filter=low" class="small text-decoration-none">View low stock items</a>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">OUT OF STOCK</span>
            <div class="fs-4 fw-bold text-danger mt-1"><?= $out_of_stock_count ?> Items</div>
            <a href="stock.php?filter=out" class="small text-danger text-decoration-none">View exhausted items</a>
        </div>
    </div>
</div>

<!-- Filter Tabs -->
<ul class="nav nav-pills mb-3 small">
    <li class="nav-item">
        <a class="nav-link <?= empty($filter) ? 'active' : '' ?>" href="stock.php">All Inventory</a>
    </li>
    <li class="nav-item">
        <a class="nav-link <?= ($filter === 'low') ? 'active' : '' ?>" href="stock.php?filter=low">Low Stock Alerts (<?= $low_stock_count ?>)</a>
    </li>
    <li class="nav-item">
        <a class="nav-link <?= ($filter === 'out') ? 'active' : '' ?>" href="stock.php?filter=out">Out of Stock (<?= $out_of_stock_count ?>)</a>
    </li>
</ul>

<!-- Products Stock Table -->
<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <?php if (empty($products)): ?>
            <div class="p-4 text-center text-muted small">No products match this filter.</div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 small">
                    <thead class="table-light">
                        <tr>
                            <th>Product / SKU</th>
                            <th>Category</th>
                            <th class="text-end">Current Stock</th>
                            <th class="text-end">Cost Price</th>
                            <th class="text-end">Selling Price</th>
                            <th class="text-end">Total Valuation (Cost)</th>
                            <th class="text-center">Status</th>
                            <th class="text-end">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($products as $p): ?>
                            <?php 
                                $qty = (float)$p['current_stock'];
                                $cost = (float)$p['purchase_price'];
                                $val = $qty * $cost;
                                $is_out = ($qty <= 0);
                                $is_low = ($qty <= (float)$p['minimum_stock']);
                            ?>
                            <tr>
                                <td>
                                    <a href="../products/view.php?id=<?= $p['id'] ?>" class="fw-bold text-dark text-decoration-none">
                                        <?= htmlspecialchars($p['name']) ?>
                                    </a>
                                    <div class="text-muted font-monospace" style="font-size: 0.75rem;">SKU: <?= htmlspecialchars($p['sku'] ?: '-') ?></div>
                                </td>
                                <td><?= htmlspecialchars($p['category_name'] ?? 'General') ?></td>
                                <td class="text-end fw-bold <?= $is_out ? 'text-danger' : ($is_low ? 'text-warning' : 'text-dark') ?>">
                                    <?= $qty ?> <?= htmlspecialchars($p['unit']) ?>
                                </td>
                                <td class="text-end"><?= formatCurrency($cost) ?></td>
                                <td class="text-end"><?= formatCurrency($p['selling_price']) ?></td>
                                <td class="text-end fw-bold text-dark"><?= formatCurrency($val) ?></td>
                                <td class="text-center">
                                    <?php if ($is_out): ?>
                                        <span class="badge bg-danger">OUT OF STOCK</span>
                                    <?php elseif ($is_low): ?>
                                        <span class="badge bg-warning text-dark">LOW STOCK</span>
                                    <?php else: ?>
                                        <span class="badge bg-success">IN STOCK</span>
                                    <?php endif; ?>
                                </td>
                                <td class="text-end">
                                    <a href="../products/stock_adjustment.php?product_id=<?= $p['id'] ?>" class="btn btn-light btn-sm border" title="Adjust Stock">
                                        <i class="fa-solid fa-boxes-packing text-primary"></i>
                                    </a>
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
