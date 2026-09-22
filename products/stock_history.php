<?php
/**
 * SmartBill - Stock Movement History & Audit Log
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Stock Movement Log - SmartBill';
$product_id = (int)($_GET['product_id'] ?? 0);
$type = trim($_GET['type'] ?? '');

$query = "
    SELECT sm.*, p.name as product_name, p.sku, p.unit
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
    WHERE 1=1
";
$params = [];

if ($product_id > 0) {
    $query .= " AND sm.product_id = ?";
    $params[] = $product_id;
}

if ($type !== '') {
    $query .= " AND sm.movement_type = ?";
    $params[] = $type;
}

$query .= " ORDER BY sm.id DESC LIMIT 100";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$movements = $stmt->fetchAll();

$products = $pdo->query("SELECT id, name FROM products ORDER BY name ASC")->fetchAll();

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Stock Movement History</h4>
        <p class="text-muted small mb-0">Traceable audit record of every sales deduction, purchase receipt, and inventory adjustment.</p>
    </div>
    <div class="d-flex gap-2">
        <a href="stock_adjustment.php" class="btn btn-primary btn-sm shadow-sm">
            <i class="fa-solid fa-boxes-packing me-1"></i> New Adjustment
        </a>
    </div>
</div>

<!-- Filters -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-body p-3">
        <form method="GET" action="stock_history.php" class="row g-2 align-items-center">
            <div class="col-md-5">
                <select name="product_id" class="form-select form-select-sm" onchange="this.form.submit()">
                    <option value="0">All Products</option>
                    <?php foreach ($products as $p): ?>
                        <option value="<?= $p['id'] ?>" <?= ($product_id === (int)$p['id']) ? 'selected' : '' ?>>
                            <?= htmlspecialchars($p['name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="col-md-4">
                <select name="type" class="form-select form-select-sm" onchange="this.form.submit()">
                    <option value="">All Movement Types</option>
                    <option value="sale" <?= ($type === 'sale') ? 'selected' : '' ?>>Sale (Invoice)</option>
                    <option value="purchase" <?= ($type === 'purchase') ? 'selected' : '' ?>>Purchase (Receipt)</option>
                    <option value="adjustment" <?= ($type === 'adjustment') ? 'selected' : '' ?>>Manual Adjustment</option>
                    <option value="return" <?= ($type === 'return') ? 'selected' : '' ?>>Return</option>
                </select>
            </div>
            <div class="col-md-3 d-flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm flex-grow-1">Filter</button>
                <?php if ($product_id || $type): ?>
                    <a href="stock_history.php" class="btn btn-outline-secondary btn-sm">Reset</a>
                <?php endif; ?>
            </div>
        </form>
    </div>
</div>

<!-- Stock Log Table -->
<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <?php if (empty($movements)): ?>
            <div class="p-4 text-center text-muted small">No stock records found matching filters.</div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 small">
                    <thead class="table-light">
                        <tr>
                            <th>Date & Time</th>
                            <th>Product</th>
                            <th>Type</th>
                            <th>Reference #</th>
                            <th class="text-end">Quantity Change</th>
                            <th>Notes / Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($movements as $m): ?>
                            <tr>
                                <td><?= formatDate($m['created_at'], 'd M Y, h:i A') ?></td>
                                <td>
                                    <a href="view.php?id=<?= $m['product_id'] ?>" class="fw-bold text-dark text-decoration-none">
                                        <?= htmlspecialchars($m['product_name'] ?? 'Unknown Product') ?>
                                    </a>
                                </td>
                                <td>
                                    <?php 
                                        $mtype = $m['movement_type'];
                                        $badge = 'bg-secondary';
                                        if ($mtype === 'sale') $badge = 'bg-danger-subtle text-danger';
                                        elseif ($mtype === 'purchase') $badge = 'bg-success-subtle text-success';
                                        elseif ($mtype === 'adjustment') $badge = 'bg-warning-subtle text-warning';
                                        elseif ($mtype === 'return') $badge = 'bg-info-subtle text-info';
                                    ?>
                                    <span class="badge <?= $badge ?> text-uppercase"><?= $mtype ?></span>
                                </td>
                                <td class="font-monospace fw-semibold"><?= htmlspecialchars($m['reference_number'] ?: '-') ?></td>
                                <td class="text-end fw-bold <?= ((float)$m['quantity'] >= 0) ? 'text-success' : 'text-danger' ?>">
                                    <?= ((float)$m['quantity'] > 0 ? '+' : '') . (float)$m['quantity'] ?> <?= htmlspecialchars($m['unit'] ?? '') ?>
                                </td>
                                <td class="text-muted"><?= htmlspecialchars($m['note'] ?: '-') ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
