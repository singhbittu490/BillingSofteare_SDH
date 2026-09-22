<?php
/**
 * SmartBill - Customers List & Search
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Customers - SmartBill';
$search = trim($_GET['search'] ?? '');
$type_filter = trim($_GET['type'] ?? '');

$query = "SELECT c.*, 
    COALESCE(SUM(i.outstanding_amount), 0) as total_outstanding,
    COUNT(i.id) as invoice_count
    FROM customers c
    LEFT JOIN invoices i ON c.id = i.customer_id
    WHERE 1=1";
$params = [];

if ($search !== '') {
    $query .= " AND (c.name LIKE ? OR c.business_name LIKE ? OR c.mobile LIKE ? OR c.gstin LIKE ?)";
    $term = "%{$search}%";
    $params = array_merge($params, [$term, $term, $term, $term]);
}

if ($type_filter !== '') {
    $query .= " AND c.customer_type = ?";
    $params[] = $type_filter;
}

$query .= " GROUP BY c.id ORDER BY c.id DESC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$customers = $stmt->fetchAll();

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Customer Directory</h4>
        <p class="text-muted small mb-0">Manage registered buyers, GSTINs, billing addresses, and track outstanding balances.</p>
    </div>
    <div class="d-flex gap-2">
        <a href="add.php" class="btn btn-primary btn-sm shadow-sm">
            <i class="fa-solid fa-user-plus me-1"></i> Add New Customer
        </a>
    </div>
</div>

<!-- Search & Filter Card -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-body p-3">
        <form method="GET" action="index.php" class="row g-2 align-items-center">
            <div class="col-md-5">
                <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light"><i class="fa-solid fa-magnifying-glass"></i></span>
                    <input type="text" name="search" class="form-control" placeholder="Search by name, business, phone, or GSTIN..." value="<?= htmlspecialchars($search) ?>">
                </div>
            </div>
            <div class="col-md-4">
                <select name="type" class="form-select form-select-sm" onchange="this.form.submit()">
                    <option value="">All Customer Types</option>
                    <option value="Registered" <?= ($type_filter === 'Registered') ? 'selected' : '' ?>>Registered (GST)</option>
                    <option value="Unregistered" <?= ($type_filter === 'Unregistered') ? 'selected' : '' ?>>Unregistered</option>
                    <option value="Composition" <?= ($type_filter === 'Composition') ? 'selected' : '' ?>>Composition</option>
                    <option value="Consumer" <?= ($type_filter === 'Consumer') ? 'selected' : '' ?>>Consumer</option>
                </select>
            </div>
            <div class="col-md-3 d-flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm px-3 flex-grow-1">Filter</button>
                <?php if ($search || $type_filter): ?>
                    <a href="index.php" class="btn btn-outline-secondary btn-sm">Reset</a>
                <?php endif; ?>
            </div>
        </form>
    </div>
</div>

<!-- Customer Table -->
<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <?php if (empty($customers)): ?>
            <div class="p-5 text-center text-muted">
                <i class="fa-solid fa-users-slash fa-3x mb-3 text-secondary"></i>
                <h5>No Customers Found</h5>
                <p class="small">Create your first customer to start invoicing.</p>
                <a href="add.php" class="btn btn-primary btn-sm mt-2"><i class="fa-solid fa-plus me-1"></i> Add Customer</a>
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Customer & Business</th>
                            <th>Contact</th>
                            <th>GSTIN & State</th>
                            <th>Type</th>
                            <th class="text-end">Invoices</th>
                            <th class="text-end">Outstanding</th>
                            <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($customers as $c): ?>
                            <tr>
                                <td>
                                    <a href="view.php?id=<?= $c['id'] ?>" class="fw-bold text-dark text-decoration-none d-block">
                                        <?= htmlspecialchars($c['name']) ?>
                                    </a>
                                    <?php if (!empty($c['business_name'])): ?>
                                        <span class="text-muted small"><?= htmlspecialchars($c['business_name']) ?></span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php if (!empty($c['mobile'])): ?>
                                        <div><i class="fa-solid fa-phone text-muted me-1 small"></i> <?= htmlspecialchars($c['mobile']) ?></div>
                                    <?php endif; ?>
                                    <?php if (!empty($c['email'])): ?>
                                        <div class="text-muted small"><i class="fa-solid fa-envelope text-muted me-1"></i> <?= htmlspecialchars($c['email']) ?></div>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php if (!empty($c['gstin'])): ?>
                                        <div class="font-monospace small fw-bold text-primary"><?= htmlspecialchars($c['gstin']) ?></div>
                                    <?php else: ?>
                                        <span class="text-muted small">-</span>
                                    <?php endif; ?>
                                    <div class="text-muted small"><?= htmlspecialchars($c['state'] ?? 'State') ?> (<?= htmlspecialchars($c['state_code'] ?? '-') ?>)</div>
                                </td>
                                <td>
                                    <span class="badge bg-light text-dark border"><?= htmlspecialchars($c['customer_type']) ?></span>
                                </td>
                                <td class="text-end fw-semibold">
                                    <?= $c['invoice_count'] ?>
                                </td>
                                <td class="text-end fw-bold <?= ((float)$c['total_outstanding'] > 0) ? 'text-danger' : 'text-success' ?>">
                                    <?= formatCurrency($c['total_outstanding']) ?>
                                </td>
                                <td class="text-end">
                                    <div class="btn-group btn-group-sm">
                                        <a href="statement.php?id=<?= $c['id'] ?>" class="btn btn-light border" title="Statement">
                                            <i class="fa-solid fa-file-lines text-info"></i>
                                        </a>
                                        <a href="view.php?id=<?= $c['id'] ?>" class="btn btn-light border" title="View">
                                            <i class="fa-solid fa-eye text-primary"></i>
                                        </a>
                                        <a href="edit.php?id=<?= $c['id'] ?>" class="btn btn-light border" title="Edit">
                                            <i class="fa-solid fa-pen text-secondary"></i>
                                        </a>
                                        <a href="delete.php?id=<?= $c['id'] ?>&token=<?= getCSRFToken() ?>" class="btn btn-light border text-danger" title="Delete" onclick="return confirm('Are you sure you want to delete this customer?');">
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
