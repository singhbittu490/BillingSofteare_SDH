<?php
/**
 * SmartBill - Payments Ledger & History
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Payments Received - SmartBill';

$search = trim($_GET['search'] ?? '');
$method = trim($_GET['method'] ?? '');

$query = "
    SELECT p.*, i.invoice_number, c.name as customer_name
    FROM payments p
    LEFT JOIN invoices i ON p.invoice_id = i.id
    LEFT JOIN customers c ON p.customer_id = c.id
    WHERE 1=1
";
$params = [];

if ($search !== '') {
    $query .= " AND (p.reference_number LIKE ? OR c.name LIKE ? OR i.invoice_number LIKE ?)";
    $term = "%{$search}%";
    $params = [$term, $term, $term];
}

if ($method !== '') {
    $query .= " AND p.payment_method = ?";
    $params[] = $method;
}

$query .= " ORDER BY p.id DESC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$payments = $stmt->fetchAll();

// Total collections
$total_collected = 0;
foreach ($payments as $pm) {
    $total_collected += (float)$pm['amount'];
}

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Customer Payments</h4>
        <p class="text-muted small mb-0">Collections log, payment vouchers, and transaction receipts.</p>
    </div>
    <div class="d-flex gap-2">
        <a href="create.php" class="btn btn-primary btn-sm shadow-sm">
            <i class="fa-solid fa-plus me-1"></i> Record Payment
        </a>
    </div>
</div>

<!-- Filters & Summary -->
<div class="row g-3 mb-4">
    <div class="col-md-8">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-3">
                <form method="GET" action="index.php" class="row g-2 align-items-center">
                    <div class="col-md-6">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-light"><i class="fa-solid fa-magnifying-glass"></i></span>
                            <input type="text" name="search" class="form-control" placeholder="Search reference, customer, or invoice #..." value="<?= htmlspecialchars($search) ?>">
                        </div>
                    </div>
                    <div class="col-md-4">
                        <select name="method" class="form-select form-select-sm" onchange="this.form.submit()">
                            <option value="">All Payment Modes</option>
                            <option value="Cash" <?= ($method === 'Cash') ? 'selected' : '' ?>>Cash</option>
                            <option value="UPI" <?= ($method === 'UPI') ? 'selected' : '' ?>>UPI</option>
                            <option value="Bank Transfer" <?= ($method === 'Bank Transfer') ? 'selected' : '' ?>>Bank Transfer</option>
                            <option value="Cheque" <?= ($method === 'Cheque') ? 'selected' : '' ?>>Cheque</option>
                            <option value="Credit Card" <?= ($method === 'Credit Card') ? 'selected' : '' ?>>Credit Card</option>
                        </select>
                    </div>
                    <div class="col-md-2 d-flex gap-2">
                        <button type="submit" class="btn btn-primary btn-sm flex-grow-1">Filter</button>
                        <?php if ($search || $method): ?>
                            <a href="index.php" class="btn btn-outline-secondary btn-sm">Reset</a>
                        <?php endif; ?>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100 p-3 bg-white d-flex justify-content-center">
            <span class="text-muted small fw-semibold">TOTAL FILTERED COLLECTIONS</span>
            <div class="fs-4 fw-bold text-success mt-1"><?= formatCurrency($total_collected) ?></div>
        </div>
    </div>
</div>

<!-- Payments Table -->
<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <?php if (empty($payments)): ?>
            <div class="p-5 text-center text-muted">
                <i class="fa-solid fa-hand-holding-dollar fa-3x mb-3 text-secondary"></i>
                <h5>No Payments Found</h5>
                <p class="small">Record customer payments to mark invoices as settled.</p>
                <a href="create.php" class="btn btn-primary btn-sm mt-2"><i class="fa-solid fa-plus me-1"></i> Record Payment</a>
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Receipt / Ref #</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Invoice #</th>
                            <th>Mode</th>
                            <th class="text-end">Amount Received</th>
                            <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($payments as $p): ?>
                            <tr>
                                <td class="fw-bold font-monospace">
                                    <a href="receipt.php?id=<?= $p['id'] ?>" class="text-primary text-decoration-none">
                                        <?= htmlspecialchars($p['reference_number'] ?: 'RCP-' . $p['id']) ?>
                                    </a>
                                </td>
                                <td><?= formatDate($p['payment_date'], 'd M Y') ?></td>
                                <td class="fw-semibold text-dark"><?= htmlspecialchars($p['customer_name'] ?? 'Walk-in') ?></td>
                                <td>
                                    <a href="../invoices/view.php?id=<?= $p['invoice_id'] ?>" class="text-decoration-none small">
                                        <?= htmlspecialchars($p['invoice_number'] ?? '-') ?>
                                    </a>
                                </td>
                                <td>
                                    <span class="badge bg-light text-dark border"><?= htmlspecialchars($p['payment_method']) ?></span>
                                </td>
                                <td class="text-end fw-bold text-success">
                                    <?= formatCurrency($p['amount']) ?>
                                </td>
                                <td class="text-end">
                                    <div class="btn-group btn-group-sm">
                                        <a href="receipt.php?id=<?= $p['id'] ?>" class="btn btn-light border" title="Receipt">
                                            <i class="fa-solid fa-print text-dark"></i>
                                        </a>
                                        <a href="delete.php?id=<?= $p['id'] ?>&token=<?= getCSRFToken() ?>" class="btn btn-light border text-danger" title="Delete Payment" onclick="return confirm('Are you sure you want to delete this payment? It will increase the invoice outstanding balance.');">
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
