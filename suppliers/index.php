<?php
/**
 * SmartBill - Suppliers Directory
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Suppliers - SmartBill';
$search = trim($_GET['search'] ?? '');

$query = "SELECT s.*, 
    COUNT(p.id) as purchase_count,
    COALESCE(SUM(p.grand_total), 0) as total_purchased
    FROM suppliers s
    LEFT JOIN purchases p ON s.id = p.supplier_id
    WHERE 1=1";
$params = [];

if ($search !== '') {
    $query .= " AND (s.name LIKE ? OR s.company_name LIKE ? OR s.mobile LIKE ? OR s.gstin LIKE ?)";
    $term = "%{$search}%";
    $params = [$term, $term, $term, $term];
}

$query .= " GROUP BY s.id ORDER BY s.id DESC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$suppliers = $stmt->fetchAll();

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Supplier Directory</h4>
        <p class="text-muted small mb-0">Manage vendor profiles, GST numbers, purchase bills, and payables.</p>
    </div>
    <div class="d-flex gap-2">
        <a href="add.php" class="btn btn-primary btn-sm shadow-sm">
            <i class="fa-solid fa-truck-field me-1"></i> Add Supplier
        </a>
    </div>
</div>

<!-- Search Card -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-body p-3">
        <form method="GET" action="index.php" class="row g-2 align-items-center">
            <div class="col-md-9">
                <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light"><i class="fa-solid fa-magnifying-glass"></i></span>
                    <input type="text" name="search" class="form-control" placeholder="Search by name, company, phone, or GSTIN..." value="<?= htmlspecialchars($search) ?>">
                </div>
            </div>
            <div class="col-md-3 d-flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm px-3 flex-grow-1">Search</button>
                <?php if ($search): ?>
                    <a href="index.php" class="btn btn-outline-secondary btn-sm">Reset</a>
                <?php endif; ?>
            </div>
        </form>
    </div>
</div>

<!-- Suppliers Table -->
<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <?php if (empty($suppliers)): ?>
            <div class="p-5 text-center text-muted">
                <i class="fa-solid fa-truck-ramp-box fa-3x mb-3 text-secondary"></i>
                <h5>No Suppliers Found</h5>
                <p class="small">Add your primary product and raw material vendors.</p>
                <a href="add.php" class="btn btn-primary btn-sm mt-2"><i class="fa-solid fa-plus me-1"></i> Add Supplier</a>
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Supplier & Company</th>
                            <th>Contact</th>
                            <th>GSTIN & State</th>
                            <th class="text-end">Purchases</th>
                            <th class="text-end">Total Purchased</th>
                            <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($suppliers as $s): ?>
                            <tr>
                                <td>
                                    <a href="view.php?id=<?= $s['id'] ?>" class="fw-bold text-dark text-decoration-none d-block">
                                        <?= htmlspecialchars($s['name']) ?>
                                    </a>
                                    <?php if (!empty($s['company_name'])): ?>
                                        <span class="text-muted small"><?= htmlspecialchars($s['company_name']) ?></span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php if (!empty($s['mobile'])): ?>
                                        <div><i class="fa-solid fa-phone text-muted me-1 small"></i> <?= htmlspecialchars($s['mobile']) ?></div>
                                    <?php endif; ?>
                                    <?php if (!empty($s['email'])): ?>
                                        <div class="text-muted small"><i class="fa-solid fa-envelope text-muted me-1"></i> <?= htmlspecialchars($s['email']) ?></div>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php if (!empty($s['gstin'])): ?>
                                        <div class="font-monospace small fw-bold text-primary"><?= htmlspecialchars($s['gstin']) ?></div>
                                    <?php else: ?>
                                        <span class="text-muted small">Unregistered</span>
                                    <?php endif; ?>
                                    <div class="text-muted small"><?= htmlspecialchars($s['state'] ?? '-') ?> (<?= htmlspecialchars($s['state_code'] ?? '-') ?>)</div>
                                </td>
                                <td class="text-end fw-semibold">
                                    <?= $s['purchase_count'] ?> bills
                                </td>
                                <td class="text-end fw-bold text-dark">
                                    <?= formatCurrency($s['total_purchased']) ?>
                                </td>
                                <td class="text-end">
                                    <div class="btn-group btn-group-sm">
                                        <a href="view.php?id=<?= $s['id'] ?>" class="btn btn-light border" title="View Details">
                                            <i class="fa-solid fa-eye text-primary"></i>
                                        </a>
                                        <a href="edit.php?id=<?= $s['id'] ?>" class="btn btn-light border" title="Edit">
                                            <i class="fa-solid fa-pen text-secondary"></i>
                                        </a>
                                        <a href="delete.php?id=<?= $s['id'] ?>&token=<?= getCSRFToken() ?>" class="btn btn-light border text-danger" title="Delete" onclick="return confirm('Are you sure you want to delete this supplier?');">
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
