<?php
/**
 * SmartBill - Invoices Directory & Filter
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Invoices - SmartBill';
$company = getCompanySettings($pdo);

$search = trim($_GET['search'] ?? '');
$customer_filter = (int)($_GET['customer_id'] ?? 0);
$status_filter = trim($_GET['status'] ?? '');
$from_date = trim($_GET['from'] ?? '');
$to_date = trim($_GET['to'] ?? '');

$query = "SELECT i.*, c.mobile as customer_mobile
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE 1=1";
$params = [];

if ($search !== '') {
    $query .= " AND (i.invoice_number LIKE ? OR i.customer_name LIKE ? OR i.customer_gstin LIKE ?)";
    $term = "%{$search}%";
    $params = array_merge($params, [$term, $term, $term]);
}

if ($customer_filter > 0) {
    $query .= " AND i.customer_id = ?";
    $params[] = $customer_filter;
}

if ($status_filter !== '') {
    if ($status_filter === 'Overdue') {
        $query .= " AND i.status != 'Paid' AND i.due_date < CURDATE()";
    } else {
        $query .= " AND i.status = ?";
        $params[] = $status_filter;
    }
}

if ($from_date !== '') {
    $query .= " AND i.invoice_date >= ?";
    $params[] = $from_date;
}

if ($to_date !== '') {
    $query .= " AND i.invoice_date <= ?";
    $params[] = $to_date;
}

$query .= " ORDER BY i.id DESC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$invoices = $stmt->fetchAll();

// Customers for filter dropdown
$customers = $pdo->query("SELECT id, name FROM customers ORDER BY name ASC")->fetchAll();

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Tax Invoices</h4>
        <p class="text-muted small mb-0">Manage customer billing records, print A4 GST bills, collect payments, and share via WhatsApp.</p>
    </div>
    <div class="d-flex gap-2">
        <a href="create.php" class="btn btn-primary btn-sm shadow-sm">
            <i class="fa-solid fa-plus me-1"></i> Create Invoice
        </a>
    </div>
</div>

<!-- Filters Card -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-body p-3">
        <form method="GET" action="index.php" class="row g-2 align-items-center">
            <div class="col-md-3">
                <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light"><i class="fa-solid fa-magnifying-glass"></i></span>
                    <input type="text" name="search" class="form-control" placeholder="Invoice # or customer..." value="<?= htmlspecialchars($search) ?>">
                </div>
            </div>
            <div class="col-md-3">
                <select name="customer_id" class="form-select form-select-sm" onchange="this.form.submit()">
                    <option value="0">All Customers</option>
                    <?php foreach ($customers as $c): ?>
                        <option value="<?= $c['id'] ?>" <?= ($customer_filter === (int)$c['id']) ? 'selected' : '' ?>>
                            <?= htmlspecialchars($c['name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="col-md-2">
                <select name="status" class="form-select form-select-sm" onchange="this.form.submit()">
                    <option value="">All Statuses</option>
                    <option value="Paid" <?= ($status_filter === 'Paid') ? 'selected' : '' ?>>Paid</option>
                    <option value="Partially Paid" <?= ($status_filter === 'Partially Paid') ? 'selected' : '' ?>>Partially Paid</option>
                    <option value="Unpaid" <?= ($status_filter === 'Unpaid') ? 'selected' : '' ?>>Unpaid</option>
                    <option value="Overdue" <?= ($status_filter === 'Overdue') ? 'selected' : '' ?>>Overdue</option>
                </select>
            </div>
            <div class="col-md-2">
                <input type="date" name="from" class="form-control form-control-sm" value="<?= htmlspecialchars($from_date) ?>" title="From Date">
            </div>
            <div class="col-md-2 d-flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm flex-grow-1">Filter</button>
                <?php if ($search || $customer_filter || $status_filter || $from_date || $to_date): ?>
                    <a href="index.php" class="btn btn-outline-secondary btn-sm">Reset</a>
                <?php endif; ?>
            </div>
        </form>
    </div>
</div>

<!-- Invoices Table -->
<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <?php if (empty($invoices)): ?>
            <div class="p-5 text-center text-muted">
                <i class="fa-solid fa-file-invoice-dollar fa-3x mb-3 text-secondary"></i>
                <h5>No Invoices Found</h5>
                <p class="small">No billing records match your search criteria.</p>
                <a href="create.php" class="btn btn-primary btn-sm mt-2"><i class="fa-solid fa-plus me-1"></i> Create First Invoice</a>
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th>Customer & GSTIN</th>
                            <th>Due Date</th>
                            <th class="text-end">Total (₹)</th>
                            <th class="text-end">Balance Due</th>
                            <th class="text-center">Status</th>
                            <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($invoices as $inv): ?>
                            <?php 
                                $is_overdue = ($inv['status'] !== 'Paid' && !empty($inv['due_date']) && strtotime($inv['due_date']) < strtotime(date('Y-m-d')));
                                $badge_class = 'badge-status-unpaid';
                                if ($inv['status'] === 'Paid') $badge_class = 'badge-status-paid';
                                elseif ($inv['status'] === 'Partially Paid') $badge_class = 'badge-status-partially';
                            ?>
                            <tr>
                                <td class="fw-bold font-monospace">
                                    <a href="view.php?id=<?= $inv['id'] ?>" class="text-primary text-decoration-none">
                                        <?= htmlspecialchars($inv['invoice_number']) ?>
                                    </a>
                                </td>
                                <td><?= formatDate($inv['invoice_date'], 'd M Y') ?></td>
                                <td>
                                    <div class="fw-semibold text-dark"><?= htmlspecialchars($inv['customer_name']) ?></div>
                                    <div class="text-muted small font-monospace"><?= htmlspecialchars($inv['customer_gstin'] ?: 'Unregistered') ?></div>
                                </td>
                                <td>
                                    <span class="<?= $is_overdue ? 'text-danger fw-bold' : 'text-muted small' ?>">
                                        <?= formatDate($inv['due_date'], 'd M Y') ?>
                                    </span>
                                </td>
                                <td class="text-end fw-bold text-dark">
                                    <?= formatCurrency($inv['grand_total']) ?>
                                </td>
                                <td class="text-end fw-bold <?= ((float)$inv['outstanding_amount'] > 0) ? 'text-danger' : 'text-success' ?>">
                                    <?= formatCurrency($inv['outstanding_amount']) ?>
                                </td>
                                <td class="text-center">
                                    <span class="<?= $badge_class ?>"><?= $inv['status'] ?></span>
                                    <?php if ($is_overdue): ?>
                                        <div class="badge bg-danger text-white mt-1 d-block" style="font-size: 0.65rem;">OVERDUE</div>
                                    <?php endif; ?>
                                </td>
                                <td class="text-end">
                                    <div class="btn-group btn-group-sm">
                                        <!-- WhatsApp Share -->
                                        <?php 
                                            $wa_phone = preg_replace('/[^0-9]/', '', $inv['customer_mobile'] ?? '');
                                            if (strlen($wa_phone) === 10) $wa_phone = '91' . $wa_phone;
                                            $wa_msg = urlencode("Dear " . $inv['customer_name'] . ", invoice " . $inv['invoice_number'] . " for amount " . formatCurrency($inv['grand_total']) . " has been generated by " . ($company['company_name'] ?? 'SmartBill') . ". Outstanding balance: " . formatCurrency($inv['outstanding_amount']) . ". Thank you.");
                                            $wa_url = "https://api.whatsapp.com/send?phone={$wa_phone}&text={$wa_msg}";
                                        ?>
                                        <a href="<?= $wa_url ?>" target="_blank" class="btn btn-light border text-success" title="Share via WhatsApp">
                                            <i class="fa-brands fa-whatsapp"></i>
                                        </a>

                                        <a href="print.php?id=<?= $inv['id'] ?>" target="_blank" class="btn btn-light border" title="Print / PDF">
                                            <i class="fa-solid fa-print text-dark"></i>
                                        </a>

                                        <a href="view.php?id=<?= $inv['id'] ?>" class="btn btn-light border" title="View Details">
                                            <i class="fa-solid fa-eye text-primary"></i>
                                        </a>

                                        <?php if ((float)$inv['outstanding_amount'] > 0): ?>
                                            <a href="../payments/create.php?invoice_id=<?= $inv['id'] ?>" class="btn btn-light border text-success" title="Record Payment">
                                                <i class="fa-solid fa-hand-holding-dollar"></i>
                                            </a>
                                        <?php endif; ?>

                                        <a href="edit.php?id=<?= $inv['id'] ?>" class="btn btn-light border" title="Edit">
                                            <i class="fa-solid fa-pen text-secondary"></i>
                                        </a>

                                        <a href="delete.php?id=<?= $inv['id'] ?>&token=<?= getCSRFToken() ?>" class="btn btn-light border text-danger" title="Delete" onclick="return confirm('Are you sure you want to delete this invoice? Restoring products to stock.');">
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
