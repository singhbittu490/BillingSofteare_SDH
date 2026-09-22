<?php
/**
 * SmartBill - Inward Purchases Directory
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Purchase Bills - SmartBill';

$search = trim($_GET['search'] ?? '');
$supplier_id = (int)($_GET['supplier_id'] ?? 0);

$query = "
    SELECT p.*, s.name as supplier_name, s.company_name as supplier_company
    FROM purchases p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE 1=1
";
$params = [];

if ($search !== '') {
    $query .= " AND (p.purchase_number LIKE ? OR p.supplier_bill_number LIKE ? OR s.name LIKE ?)";
    $term = "%{$search}%";
    $params = [$term, $term, $term];
}

if ($supplier_id > 0) {
    $query .= " AND p.supplier_id = ?";
    $params[] = $supplier_id;
}

$query .= " ORDER BY p.id DESC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$purchases = $stmt->fetchAll();

$suppliers = $pdo->query("SELECT id, name FROM suppliers ORDER BY name ASC")->fetchAll();

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Purchases & Inward Bills</h4>
        <p class="text-muted small mb-0">Record vendor procurement, stock additions, and supply tax records.</p>
    </div>
    <div class="d-flex gap-2">
        <a href="create.php" class="btn btn-primary btn-sm shadow-sm">
            <i class="fa-solid fa-plus me-1"></i> Record Purchase
        </a>
    </div>
</div>

<!-- Filters -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-body p-3">
        <form method="GET" action="index.php" class="row g-2 align-items-center">
            <div class="col-md-5">
                <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light"><i class="fa-solid fa-magnifying-glass"></i></span>
                    <input type="text" name="search" class="form-control" placeholder="Search purchase #, vendor bill #, supplier..." value="<?= htmlspecialchars($search) ?>">
                </div>
            </div>
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
            <div class="col-md-3 d-flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm flex-grow-1">Filter</button>
                <?php if ($search || $supplier_id): ?>
                    <a href="index.php" class="btn btn-outline-secondary btn-sm">Reset</a>
                <?php endif; ?>
            </div>
        </form>
    </div>
</div>

<!-- Purchases Table -->
<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <?php if (empty($purchases)): ?>
            <div class="p-5 text-center text-muted">
                <i class="fa-solid fa-cart-flatbed fa-3x mb-3 text-secondary"></i>
                <h5>No Purchases Logged</h5>
                <p class="small">Add inward bills from vendors to restock products and maintain purchase records.</p>
                <a href="create.php" class="btn btn-primary btn-sm mt-2"><i class="fa-solid fa-plus me-1"></i> Record Purchase</a>
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Purchase #</th>
                            <th>Vendor Bill #</th>
                            <th>Date</th>
                            <th>Supplier</th>
                            <th class="text-end">Tax Amount</th>
                            <th class="text-end">Total (₹)</th>
                            <th class="text-center">Status</th>
                            <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($purchases as $p): ?>
                            <tr>
                                <td class="fw-bold font-monospace">
                                    <a href="view.php?id=<?= $p['id'] ?>" class="text-primary text-decoration-none">
                                        <?= htmlspecialchars($p['purchase_number']) ?>
                                    </a>
                                </td>
                                <td class="font-monospace small"><?= htmlspecialchars($p['supplier_bill_number'] ?: '-') ?></td>
                                <td><?= formatDate($p['purchase_date'], 'd M Y') ?></td>
                                <td class="fw-semibold text-dark">
                                    <?= htmlspecialchars($p['supplier_name'] ?? 'Vendor') ?>
                                </td>
                                <td class="text-end small text-muted"><?= formatCurrency($p['tax_amount']) ?></td>
                                <td class="text-end fw-bold text-dark"><?= formatCurrency($p['grand_total']) ?></td>
                                <td class="text-center">
                                    <span class="badge <?= ($p['payment_status'] === 'Paid') ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning' ?>">
                                        <?= htmlspecialchars($p['payment_status']) ?>
                                    </span>
                                </td>
                                <td class="text-end">
                                    <div class="btn-group btn-group-sm">
                                        <a href="view.php?id=<?= $p['id'] ?>" class="btn btn-light border" title="View Details">
                                            <i class="fa-solid fa-eye text-primary"></i>
                                        </a>
                                        <a href="delete.php?id=<?= $p['id'] ?>&token=<?= getCSRFToken() ?>" class="btn btn-light border text-danger" title="Delete Purchase" onclick="return confirm('Are you sure you want to delete this purchase? Stock will be reversed.');">
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
