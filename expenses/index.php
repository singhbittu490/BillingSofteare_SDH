<?php
/**
 * SmartBill - Expenses & Operational Costs
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Expense Management - SmartBill';

$search = trim($_GET['search'] ?? '');
$category = trim($_GET['category'] ?? '');
$from_date = trim($_GET['from'] ?? '');
$to_date = trim($_GET['to'] ?? '');

$query = "SELECT * FROM expenses WHERE 1=1";
$params = [];

if ($search !== '') {
    $query .= " AND (description LIKE ? OR reference_number LIKE ?)";
    $term = "%{$search}%";
    $params = [$term, $term];
}

if ($category !== '') {
    $query .= " AND category = ?";
    $params[] = $category;
}

if ($from_date !== '') {
    $query .= " AND expense_date >= ?";
    $params[] = $from_date;
}

if ($to_date !== '') {
    $query .= " AND expense_date <= ?";
    $params[] = $to_date;
}

$query .= " ORDER BY expense_date DESC, id DESC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$expenses = $stmt->fetchAll();

$total_expenses = 0;
foreach ($expenses as $e) {
    $total_expenses += (float)$e['amount'];
}

$categories = ['Rent', 'Electricity', 'Salary', 'Office Supplies', 'Tea & Snacks', 'Maintenance', 'Travel', 'Internet & Phone', 'Marketing', 'Other'];

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Business Expenses</h4>
        <p class="text-muted small mb-0">Record and classify operating overheads, utilities, salaries, and office costs.</p>
    </div>
    <div class="d-flex gap-2">
        <a href="create.php" class="btn btn-primary btn-sm shadow-sm">
            <i class="fa-solid fa-plus me-1"></i> Add Expense
        </a>
    </div>
</div>

<!-- Total & Filter Row -->
<div class="row g-3 mb-4">
    <div class="col-md-8">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-3">
                <form method="GET" action="index.php" class="row g-2 align-items-center">
                    <div class="col-md-4">
                        <select name="category" class="form-select form-select-sm" onchange="this.form.submit()">
                            <option value="">All Categories</option>
                            <?php foreach ($categories as $cat): ?>
                                <option value="<?= $cat ?>" <?= ($category === $cat) ? 'selected' : '' ?>><?= $cat ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <input type="date" name="from" class="form-control form-control-sm" value="<?= htmlspecialchars($from_date) ?>" title="From Date">
                    </div>
                    <div class="col-md-3">
                        <input type="date" name="to" class="form-control form-control-sm" value="<?= htmlspecialchars($to_date) ?>" title="To Date">
                    </div>
                    <div class="col-md-2 d-flex gap-2">
                        <button type="submit" class="btn btn-primary btn-sm flex-grow-1">Filter</button>
                        <?php if ($category || $from_date || $to_date || $search): ?>
                            <a href="index.php" class="btn btn-outline-secondary btn-sm">Reset</a>
                        <?php endif; ?>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100 p-3 bg-white d-flex justify-content-center">
            <span class="text-muted small fw-semibold text-uppercase">Total Period Expenses</span>
            <div class="fs-4 fw-bold text-danger mt-1"><?= formatCurrency($total_expenses) ?></div>
        </div>
    </div>
</div>

<!-- Expenses Table -->
<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <?php if (empty($expenses)): ?>
            <div class="p-5 text-center text-muted">
                <i class="fa-solid fa-wallet fa-3x mb-3 text-secondary"></i>
                <h5>No Expenses Recorded</h5>
                <p class="small">Add operational business costs to compute accurate net profit margins in reports.</p>
                <a href="create.php" class="btn btn-primary btn-sm mt-2"><i class="fa-solid fa-plus me-1"></i> Add First Expense</a>
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Payment Mode</th>
                            <th>Receipt / Ref #</th>
                            <th class="text-end">Amount (₹)</th>
                            <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($expenses as $e): ?>
                            <tr>
                                <td><?= formatDate($e['expense_date'], 'd M Y') ?></td>
                                <td>
                                    <span class="badge bg-light text-dark border"><?= htmlspecialchars($e['category']) ?></span>
                                </td>
                                <td class="fw-semibold text-dark"><?= htmlspecialchars($e['description']) ?></td>
                                <td>
                                    <span class="small text-muted"><?= htmlspecialchars($e['payment_method']) ?></span>
                                </td>
                                <td class="font-monospace small"><?= htmlspecialchars($e['reference_number'] ?: '-') ?></td>
                                <td class="text-end fw-bold text-danger">
                                    <?= formatCurrency($e['amount']) ?>
                                </td>
                                <td class="text-end">
                                    <div class="btn-group btn-group-sm">
                                        <a href="edit.php?id=<?= $e['id'] ?>" class="btn btn-light border" title="Edit">
                                            <i class="fa-solid fa-pen text-secondary"></i>
                                        </a>
                                        <a href="delete.php?id=<?= $e['id'] ?>&token=<?= getCSRFToken() ?>" class="btn btn-light border text-danger" title="Delete" onclick="return confirm('Are you sure you want to delete this expense entry?');">
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
