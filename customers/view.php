<?php
/**
 * SmartBill - Customer Details & History
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
$stmt->execute([$id]);
$customer = $stmt->fetch();

if (!$customer) {
    setFlash('danger', 'Customer not found.');
    header("Location: index.php");
    exit;
}

$page_title = 'Customer - ' . $customer['name'];

// Invoices for this customer
$stmt = $pdo->prepare("SELECT * FROM invoices WHERE customer_id = ? ORDER BY id DESC");
$stmt->execute([$id]);
$invoices = $stmt->fetchAll();

// Payments from this customer
$stmt = $pdo->prepare("SELECT * FROM payments WHERE customer_id = ? ORDER BY id DESC");
$stmt->execute([$id]);
$payments = $stmt->fetchAll();

$total_billed = 0;
$total_paid = 0;
$total_due = 0;
foreach ($invoices as $inv) {
    $total_billed += (float)$inv['grand_total'];
    $total_paid += (float)$inv['paid_amount'];
    $total_due += (float)$inv['outstanding_amount'];
}

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark"><?= htmlspecialchars($customer['name']) ?></h4>
        <span class="badge bg-primary"><?= htmlspecialchars($customer['customer_type']) ?></span>
        <?php if (!empty($customer['business_name'])): ?>
            <span class="text-muted ms-2"><?= htmlspecialchars($customer['business_name']) ?></span>
        <?php endif; ?>
    </div>
    <div class="d-flex gap-2">
        <a href="statement.php?id=<?= $id ?>" class="btn btn-outline-info btn-sm">
            <i class="fa-solid fa-file-invoice me-1"></i> Account Statement
        </a>
        <a href="../invoices/create.php?customer_id=<?= $id ?>" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-plus me-1"></i> Create Invoice
        </a>
        <a href="edit.php?id=<?= $id ?>" class="btn btn-outline-secondary btn-sm">
            <i class="fa-solid fa-pen me-1"></i> Edit
        </a>
        <a href="index.php" class="btn btn-light btn-sm border">Back</a>
    </div>
</div>

<!-- Customer Metrics -->
<div class="row g-3 mb-4">
    <div class="col-md-4">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">TOTAL BILLED</span>
            <div class="fs-4 fw-bold text-dark mt-1"><?= formatCurrency($total_billed) ?></div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">TOTAL PAID</span>
            <div class="fs-4 fw-bold text-success mt-1"><?= formatCurrency($total_paid) ?></div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">OUTSTANDING BALANCE</span>
            <div class="fs-4 fw-bold text-danger mt-1"><?= formatCurrency($total_due) ?></div>
        </div>
    </div>
</div>

<!-- Customer Info & Addresses -->
<div class="row g-4 mb-4">
    <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white py-3">
                <span class="fw-bold text-dark"><i class="fa-solid fa-address-card text-primary me-2"></i>Contact & Tax Details</span>
            </div>
            <div class="card-body">
                <table class="table table-borderless small mb-0">
                    <tr>
                        <th class="text-muted ps-0" style="width: 140px;">Phone:</th>
                        <td><?= htmlspecialchars($customer['mobile'] ?: 'N/A') ?></td>
                    </tr>
                    <tr>
                        <th class="text-muted ps-0">Email:</th>
                        <td><?= htmlspecialchars($customer['email'] ?: 'N/A') ?></td>
                    </tr>
                    <tr>
                        <th class="text-muted ps-0">GSTIN:</th>
                        <td class="font-monospace fw-bold text-primary"><?= htmlspecialchars($customer['gstin'] ?: 'Unregistered') ?></td>
                    </tr>
                    <tr>
                        <th class="text-muted ps-0">PAN:</th>
                        <td class="font-monospace"><?= htmlspecialchars($customer['pan'] ?: 'N/A') ?></td>
                    </tr>
                    <tr>
                        <th class="text-muted ps-0">State:</th>
                        <td><?= htmlspecialchars($customer['state'] ?: 'N/A') ?> (<?= htmlspecialchars($customer['state_code'] ?: '-') ?>)</td>
                    </tr>
                </table>
            </div>
        </div>
    </div>

    <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white py-3">
                <span class="fw-bold text-dark"><i class="fa-solid fa-location-dot text-primary me-2"></i>Addresses</span>
            </div>
            <div class="card-body">
                <h6 class="text-muted small fw-bold text-uppercase">Billing Address</h6>
                <p class="small text-dark mb-3"><?= nl2br(htmlspecialchars($customer['billing_address'] ?: 'No address specified')) ?></p>

                <h6 class="text-muted small fw-bold text-uppercase">Shipping Address</h6>
                <p class="small text-dark mb-0"><?= nl2br(htmlspecialchars($customer['shipping_address'] ?: 'Same as billing')) ?></p>
            </div>
        </div>
    </div>
</div>

<!-- Customer Invoices History -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <span class="fw-bold text-dark"><i class="fa-solid fa-file-invoice text-primary me-2"></i>Invoices (<?= count($invoices) ?>)</span>
    </div>
    <div class="card-body p-0">
        <?php if (empty($invoices)): ?>
            <div class="p-4 text-center text-muted small">No invoices generated for this customer yet.</div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 small">
                    <thead class="table-light">
                        <tr>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th>Due Date</th>
                            <th class="text-end">Amount</th>
                            <th class="text-end">Paid</th>
                            <th class="text-end">Due</th>
                            <th class="text-center">Status</th>
                            <th class="text-end">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($invoices as $inv): ?>
                            <tr>
                                <td class="fw-semibold">
                                    <a href="../invoices/view.php?id=<?= $inv['id'] ?>" class="text-decoration-none text-primary">
                                        <?= htmlspecialchars($inv['invoice_number']) ?>
                                    </a>
                                </td>
                                <td><?= formatDate($inv['invoice_date']) ?></td>
                                <td><?= formatDate($inv['due_date']) ?></td>
                                <td class="text-end fw-bold"><?= formatCurrency($inv['grand_total']) ?></td>
                                <td class="text-end text-success"><?= formatCurrency($inv['paid_amount']) ?></td>
                                <td class="text-end text-danger fw-bold"><?= formatCurrency($inv['outstanding_amount']) ?></td>
                                <td class="text-center">
                                    <?php 
                                        $b = 'badge-status-unpaid';
                                        if ($inv['status'] === 'Paid') $b = 'badge-status-paid';
                                        elseif ($inv['status'] === 'Partially Paid') $b = 'badge-status-partially';
                                    ?>
                                    <span class="<?= $b ?>"><?= $inv['status'] ?></span>
                                </td>
                                <td class="text-end">
                                    <a href="../invoices/view.php?id=<?= $inv['id'] ?>" class="btn btn-light btn-sm border">
                                        <i class="fa-solid fa-eye"></i>
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
