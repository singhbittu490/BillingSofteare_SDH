<?php
/**
 * SmartBill - Supplier Profile & Purchase History
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT * FROM suppliers WHERE id = ?");
$stmt->execute([$id]);
$supplier = $stmt->fetch();

if (!$supplier) {
    setFlash('danger', 'Supplier not found.');
    header("Location: index.php");
    exit;
}

$page_title = 'Supplier - ' . $supplier['name'];

// Purchases from this supplier
$stmt = $pdo->prepare("SELECT * FROM purchases WHERE supplier_id = ? ORDER BY id DESC");
$stmt->execute([$id]);
$purchases = $stmt->fetchAll();

$total_purchased = 0;
foreach ($purchases as $p) {
    $total_purchased += (float)$p['grand_total'];
}

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark"><?= htmlspecialchars($supplier['name']) ?></h4>
        <span class="text-muted"><?= htmlspecialchars($supplier['company_name'] ?? 'Vendor') ?></span>
    </div>
    <div class="d-flex gap-2">
        <a href="../purchases/create.php?supplier_id=<?= $id ?>" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-cart-plus me-1"></i> Record Purchase
        </a>
        <a href="edit.php?id=<?= $id ?>" class="btn btn-outline-secondary btn-sm">
            <i class="fa-solid fa-pen me-1"></i> Edit
        </a>
        <a href="index.php" class="btn btn-light btn-sm border">Back</a>
    </div>
</div>

<div class="row g-4 mb-4">
    <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white py-3">
                <span class="fw-bold text-dark"><i class="fa-solid fa-address-book text-primary me-2"></i>Contact Details</span>
            </div>
            <div class="card-body">
                <table class="table table-borderless small mb-0">
                    <tr>
                        <th class="text-muted ps-0" style="width: 140px;">Phone:</th>
                        <td><?= htmlspecialchars($supplier['mobile'] ?: 'N/A') ?></td>
                    </tr>
                    <tr>
                        <th class="text-muted ps-0">Email:</th>
                        <td><?= htmlspecialchars($supplier['email'] ?: 'N/A') ?></td>
                    </tr>
                    <tr>
                        <th class="text-muted ps-0">GSTIN:</th>
                        <td class="font-monospace fw-bold text-primary"><?= htmlspecialchars($supplier['gstin'] ?: 'Unregistered') ?></td>
                    </tr>
                    <tr>
                        <th class="text-muted ps-0">PAN:</th>
                        <td class="font-monospace"><?= htmlspecialchars($supplier['pan'] ?: 'N/A') ?></td>
                    </tr>
                    <tr>
                        <th class="text-muted ps-0">State:</th>
                        <td><?= htmlspecialchars($supplier['state'] ?: '-') ?> (<?= htmlspecialchars($supplier['state_code'] ?: '-') ?>)</td>
                    </tr>
                    <tr>
                        <th class="text-muted ps-0">Address:</th>
                        <td><?= nl2br(htmlspecialchars($supplier['address'] ?: 'No address specified')) ?></td>
                    </tr>
                </table>
            </div>
        </div>
    </div>

    <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white py-3">
                <span class="fw-bold text-dark"><i class="fa-solid fa-chart-pie text-primary me-2"></i>Vendor Summary</span>
            </div>
            <div class="card-body d-flex flex-column justify-content-center">
                <div class="p-3 bg-light rounded mb-3 text-center">
                    <span class="text-muted small fw-semibold">LIFETIME PURCHASES</span>
                    <div class="fs-3 fw-bold text-dark mt-1"><?= formatCurrency($total_purchased) ?></div>
                </div>
                <div class="text-center text-muted small">
                    <i class="fa-solid fa-file-lines me-1"></i> Total <?= count($purchases) ?> purchase invoices logged with this supplier.
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Purchase History Table -->
<div class="card border-0 shadow-sm">
    <div class="card-header bg-white py-3">
        <span class="fw-bold text-dark"><i class="fa-solid fa-cart-shopping text-primary me-2"></i>Purchase Bills</span>
    </div>
    <div class="card-body p-0">
        <?php if (empty($purchases)): ?>
            <div class="p-4 text-center text-muted small">No purchases recorded for this supplier.</div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 small">
                    <thead class="table-light">
                        <tr>
                            <th>Purchase #</th>
                            <th>Bill #</th>
                            <th>Date</th>
                            <th class="text-end">Amount</th>
                            <th class="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($purchases as $p): ?>
                            <tr>
                                <td class="fw-semibold">
                                    <a href="../purchases/view.php?id=<?= $p['id'] ?>" class="text-decoration-none text-primary">
                                        <?= htmlspecialchars($p['purchase_number']) ?>
                                    </a>
                                </td>
                                <td><?= htmlspecialchars($p['supplier_bill_number'] ?: '-') ?></td>
                                <td><?= formatDate($p['purchase_date']) ?></td>
                                <td class="text-end fw-bold text-dark"><?= formatCurrency($p['grand_total']) ?></td>
                                <td class="text-center">
                                    <span class="badge bg-light text-dark border"><?= htmlspecialchars($p['payment_status']) ?></span>
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
