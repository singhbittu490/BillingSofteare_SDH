<?php
/**
 * SmartBill - Products & Inventory Catalog
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Products & Stock - SmartBill';
$search = trim($_GET['search'] ?? '');
$category_filter = (int)($_GET['category'] ?? 0);
$filter = trim($_GET['filter'] ?? '');

$query = "SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1";
$params = [];

if ($search !== '') {
    $query .= " AND (p.name LIKE ? OR p.sku LIKE ? OR p.hsn_sac LIKE ?)";
    $term = "%{$search}%";
    $params = [$term, $term, $term];
}

if ($category_filter > 0) {
    $query .= " AND p.category_id = ?";
    $params[] = $category_filter;
}

if ($filter === 'low_stock') {
    $query .= " AND p.current_stock <= p.minimum_stock";
}

$query .= " ORDER BY p.id DESC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$products = $stmt->fetchAll();

// Fetch categories for filter dropdown
$categories = $pdo->query("SELECT id, name FROM categories ORDER BY name ASC")->fetchAll();

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Products & Inventory</h4>
        <p class="text-muted small mb-0">Track item catalogs, HSN codes, GST tax rates, stock alerts, and margins.</p>
    </div>
    <div class="d-flex gap-2">
        <a href="stock_history.php" class="btn btn-outline-secondary btn-sm bg-white shadow-sm">
            <i class="fa-solid fa-clock-rotate-left me-1"></i> Stock Movement Log
        </a>
        <a href="stock_adjustment.php" class="btn btn-outline-primary btn-sm bg-white shadow-sm">
            <i class="fa-solid fa-boxes-packing me-1"></i> Stock Adjustment
        </a>
        <a href="add.php" class="btn btn-primary btn-sm shadow-sm">
            <i class="fa-solid fa-plus me-1"></i> Add Product
        </a>
    </div>
</div>

<!-- Filter Bar -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-body p-3">
        <form method="GET" action="index.php" class="row g-2 align-items-center">
            <div class="col-md-4">
                <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light"><i class="fa-solid fa-magnifying-glass"></i></span>
                    <input type="text" name="search" class="form-control" placeholder="Search by name, SKU, or HSN/SAC..." value="<?= htmlspecialchars($search) ?>">
                </div>
            </div>
            <div class="col-md-3">
                <select name="category" class="form-select form-select-sm" onchange="this.form.submit()">
                    <option value="0">All Categories</option>
                    <?php foreach ($categories as $cat): ?>
                        <option value="<?= $cat['id'] ?>" <?= ($category_filter === (int)$cat['id']) ? 'selected' : '' ?>>
                            <?= htmlspecialchars($cat['name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="col-md-3">
                <select name="filter" class="form-select form-select-sm" onchange="this.form.submit()">
                    <option value="">All Stock Levels</option>
                    <option value="low_stock" <?= ($filter === 'low_stock') ? 'selected' : '' ?>>Low Stock Alerts Only</option>
                </select>
            </div>
            <div class="col-md-2 d-flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm flex-grow-1">Filter</button>
                <?php if ($search || $category_filter || $filter): ?>
                    <a href="index.php" class="btn btn-outline-secondary btn-sm">Reset</a>
                <?php endif; ?>
            </div>
        </form>
    </div>
</div>

<!-- Products Table -->
<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <?php if (empty($products)): ?>
            <div class="p-5 text-center text-muted">
                <i class="fa-solid fa-box-open fa-3x mb-3 text-secondary"></i>
                <h5>No Products Found</h5>
                <p class="small">Add items and services to start generating tax invoices.</p>
                <a href="add.php" class="btn btn-primary btn-sm mt-2"><i class="fa-solid fa-plus me-1"></i> Add Product</a>
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Product / SKU</th>
                            <th>Category</th>
                            <th>HSN/SAC</th>
                            <th class="text-end">Selling Price</th>
                            <th class="text-center">GST Rate</th>
                            <th class="text-end">Current Stock</th>
                            <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($products as $p): ?>
                            <?php $is_low_stock = ((float)$p['current_stock'] <= (float)$p['minimum_stock']); ?>
                            <tr>
                                <td>
                                    <a href="view.php?id=<?= $p['id'] ?>" class="fw-bold text-dark text-decoration-none d-block">
                                        <?= htmlspecialchars($p['name']) ?>
                                    </a>
                                    <span class="text-muted small">SKU: <?= htmlspecialchars($p['sku'] ?: '-') ?></span>
                                </td>
                                <td>
                                    <span class="badge bg-light text-dark border"><?= htmlspecialchars($p['category_name'] ?? 'General') ?></span>
                                </td>
                                <td>
                                    <span class="font-monospace small text-secondary"><?= htmlspecialchars($p['hsn_sac'] ?: '-') ?></span>
                                </td>
                                <td class="text-end fw-bold text-dark">
                                    <?= formatCurrency($p['selling_price']) ?>
                                    <div class="text-muted small" style="font-size: 0.75rem;">Cost: <?= formatCurrency($p['purchase_price']) ?></div>
                                </td>
                                <td class="text-center">
                                    <span class="badge bg-primary-subtle text-primary fw-semibold"><?= (float)$p['gst_rate'] ?>%</span>
                                </td>
                                <td class="text-end">
                                    <span class="fw-bold <?= $is_low_stock ? 'text-danger' : 'text-success' ?>">
                                        <?= (float)$p['current_stock'] ?> <?= htmlspecialchars($p['unit']) ?>
                                    </span>
                                    <?php if ($is_low_stock): ?>
                                        <div class="badge bg-danger-subtle text-danger" style="font-size: 0.7rem;">Low Stock</div>
                                    <?php endif; ?>
                                </td>
                                <td class="text-end">
                                    <div class="btn-group btn-group-sm">
                                        <a href="stock_adjustment.php?product_id=<?= $p['id'] ?>" class="btn btn-light border" title="Adjust Stock">
                                            <i class="fa-solid fa-boxes-packing text-info"></i>
                                        </a>
                                        <a href="view.php?id=<?= $p['id'] ?>" class="btn btn-light border" title="Details">
                                            <i class="fa-solid fa-eye text-primary"></i>
                                        </a>
                                        <a href="edit.php?id=<?= $p['id'] ?>" class="btn btn-light border" title="Edit">
                                            <i class="fa-solid fa-pen text-secondary"></i>
                                        </a>
                                        <a href="delete.php?id=<?= $p['id'] ?>&token=<?= getCSRFToken() ?>" class="btn btn-light border text-danger" title="Delete" onclick="return confirm('Are you sure you want to delete this product?');">
                                            <i class="fa-solid fa-trash-can"></i>
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
