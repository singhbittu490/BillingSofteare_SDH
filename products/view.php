<?php
/**
 * SmartBill - Product Details & Stock History
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
");
$stmt->execute([$id]);
$product = $stmt->fetch();

if (!$product) {
    setFlash('danger', 'Product not found.');
    header("Location: index.php");
    exit;
}

$page_title = 'Product - ' . $product['name'];

// Fetch stock movements for this product
$stmt = $pdo->prepare("
    SELECT * FROM stock_movements 
    WHERE product_id = ? 
    ORDER BY id DESC 
    LIMIT 20
");
$stmt->execute([$id]);
$movements = $stmt->fetchAll();

// Calculate Profit Margin
$purchase_price = (float)$product['purchase_price'];
$selling_price = (float)$product['selling_price'];
$profit_margin = ($selling_price > 0 && $purchase_price > 0) ? (($selling_price - $purchase_price) / $selling_price) * 100 : 0;

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark"><?= htmlspecialchars($product['name']) ?></h4>
        <span class="badge bg-light text-dark border"><?= htmlspecialchars($product['category_name'] ?? 'General') ?></span>
        <span class="text-muted small ms-2">SKU: <?= htmlspecialchars($product['sku'] ?: '-') ?></span>
    </div>
    <div class="d-flex gap-2">
        <a href="stock_adjustment.php?product_id=<?= $id ?>" class="btn btn-outline-primary btn-sm">
            <i class="fa-solid fa-boxes-packing me-1"></i> Stock Adjustment
        </a>
        <a href="edit.php?id=<?= $id ?>" class="btn btn-outline-secondary btn-sm">
            <i class="fa-solid fa-pen me-1"></i> Edit
        </a>
        <a href="index.php" class="btn btn-light btn-sm border">Back</a>
    </div>
</div>

<!-- Product Metrics -->
<div class="row g-3 mb-4">
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">SELLING PRICE</span>
            <div class="fs-4 fw-bold text-dark mt-1"><?= formatCurrency($selling_price) ?></div>
            <div class="text-muted small">+<?= (float)$product['gst_rate'] ?>% GST Tax</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">PURCHASE PRICE</span>
            <div class="fs-4 fw-bold text-secondary mt-1"><?= formatCurrency($purchase_price) ?></div>
            <div class="text-muted small">Estimated unit cost</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">GROSS MARGIN</span>
            <div class="fs-4 fw-bold <?= $profit_margin >= 0 ? 'text-success' : 'text-danger' ?> mt-1">
                <?= number_format($profit_margin, 1) ?>%
            </div>
            <div class="text-muted small"><?= formatCurrency($selling_price - $purchase_price) ?> / unit</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">CURRENT STOCK</span>
            <div class="fs-4 fw-bold <?= ((float)$product['current_stock'] <= (float)$product['minimum_stock']) ? 'text-danger' : 'text-primary' ?> mt-1">
                <?= (float)$product['current_stock'] ?> <?= htmlspecialchars($product['unit']) ?>
            </div>
            <div class="text-muted small">Min Alert: <?= (float)$product['minimum_stock'] ?></div>
        </div>
    </div>
</div>

<!-- Product Specification Details -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-header bg-white py-3">
        <span class="fw-bold text-dark"><i class="fa-solid fa-circle-info text-primary me-2"></i>Tax & Specifications</span>
    </div>
    <div class="card-body">
        <div class="row g-3">
            <div class="col-md-3">
                <span class="text-muted small d-block">HSN / SAC Code:</span>
                <span class="font-monospace fw-bold"><?= htmlspecialchars($product['hsn_sac'] ?: 'N/A') ?></span>
            </div>
            <div class="col-md-3">
                <span class="text-muted small d-block">Applicable GST:</span>
                <span class="fw-semibold text-primary"><?= (float)$product['gst_rate'] ?>%</span>
                <?php if ((float)$product['cess'] > 0): ?>
                    <span class="text-muted small">(+<?= (float)$product['cess'] ?>% Cess)</span>
                <?php endif; ?>
            </div>
            <div class="col-md-3">
                <span class="text-muted small d-block">Initial Opening Stock:</span>
                <span class="fw-semibold"><?= (float)$product['opening_stock'] ?> <?= htmlspecialchars($product['unit']) ?></span>
            </div>
            <div class="col-md-3">
                <span class="text-muted small d-block">Item Status:</span>
                <span class="badge bg-success">Active</span>
            </div>
            <?php if (!empty($product['description'])): ?>
                <div class="col-12 pt-2 border-top">
                    <span class="text-muted small d-block">Description:</span>
                    <p class="small mb-0 text-dark"><?= nl2br(htmlspecialchars($product['description'])) ?></p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Stock Movement History Table -->
<div class="card border-0 shadow-sm">
    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <span class="fw-bold text-dark"><i class="fa-solid fa-clock-rotate-left text-primary me-2"></i>Recent Stock Movements</span>
        <a href="stock_history.php?product_id=<?= $id ?>" class="btn btn-outline-secondary btn-sm">Full History</a>
    </div>
    <div class="card-body p-0">
        <?php if (empty($movements)): ?>
            <div class="p-4 text-center text-muted small">No stock movements recorded yet.</div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 small">
                    <thead class="table-light">
                        <tr>
                            <th>Date & Time</th>
                            <th>Type</th>
                            <th>Reference</th>
                            <th class="text-end">Quantity</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($movements as $m): ?>
                            <tr>
                                <td><?= formatDate($m['created_at'], 'd M Y, h:i A') ?></td>
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
                                <td class="fw-semibold font-monospace"><?= htmlspecialchars($m['reference_number'] ?: '-') ?></td>
                                <td class="text-end fw-bold <?= ((float)$m['quantity'] >= 0) ? 'text-success' : 'text-danger' ?>">
                                    <?= ((float)$m['quantity'] > 0 ? '+' : '') . (float)$m['quantity'] ?> <?= htmlspecialchars($product['unit']) ?>
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
