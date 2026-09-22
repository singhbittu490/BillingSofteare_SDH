<?php
/**
 * SmartBill - View Inward Purchase Details
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("
    SELECT p.*, s.name as supplier_name, s.company_name, s.mobile, s.email, s.gstin, s.address
    FROM purchases p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.id = ?
");
$stmt->execute([$id]);
$purchase = $stmt->fetch();

if (!$purchase) {
    setFlash('danger', 'Purchase record not found.');
    header("Location: index.php");
    exit;
}

$page_title = 'Purchase #' . $purchase['purchase_number'];

// Fetch items
$stmt = $pdo->prepare("
    SELECT pi.*, pr.name as product_name, pr.unit, pr.hsn_sac
    FROM purchase_items pi
    LEFT JOIN products pr ON pi.product_id = pr.id
    WHERE pi.purchase_id = ?
    ORDER BY pi.id ASC
");
$stmt->execute([$id]);
$items = $stmt->fetchAll();

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark"><?= htmlspecialchars($purchase['purchase_number']) ?></h4>
        <span class="text-muted small">Vendor Bill: <strong><?= htmlspecialchars($purchase['supplier_bill_number'] ?: 'N/A') ?></strong> &bull; Date: <?= formatDate($purchase['purchase_date'], 'd M Y') ?></span>
    </div>
    <div class="d-flex gap-2">
        <a href="index.php" class="btn btn-outline-secondary btn-sm">Back</a>
    </div>
</div>

<div class="row g-4 mb-4">
    <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white py-3">
                <span class="fw-bold text-dark"><i class="fa-solid fa-truck text-primary me-2"></i>Supplier Details</span>
            </div>
            <div class="card-body">
                <div class="fw-bold fs-6 text-dark"><?= htmlspecialchars($purchase['supplier_name'] ?? 'Vendor') ?></div>
                <?php if (!empty($purchase['company_name'])): ?>
                    <div class="text-muted small"><?= htmlspecialchars($purchase['company_name']) ?></div>
                <?php endif; ?>
                <div class="small text-muted mt-2">
                    <strong>GSTIN:</strong> <?= htmlspecialchars($purchase['gstin'] ?: 'Unregistered') ?><br>
                    <strong>Phone:</strong> <?= htmlspecialchars($purchase['mobile'] ?: 'N/A') ?><br>
                    <strong>Address:</strong> <?= nl2br(htmlspecialchars($purchase['address'] ?: 'N/A')) ?>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white py-3">
                <span class="fw-bold text-dark"><i class="fa-solid fa-file-lines text-primary me-2"></i>Purchase Summary</span>
            </div>
            <div class="card-body">
                <table class="table table-borderless small mb-0">
                    <tr>
                        <td class="text-muted ps-0">Taxable Subtotal:</td>
                        <td class="text-end fw-semibold"><?= formatCurrency($purchase['subtotal']) ?></td>
                    </tr>
                    <tr>
                        <td class="text-muted ps-0">GST Tax Amount:</td>
                        <td class="text-end fw-semibold text-primary"><?= formatCurrency($purchase['tax_amount']) ?></td>
                    </tr>
                    <tr class="border-top">
                        <td class="fw-bold ps-0 fs-6">Grand Total:</td>
                        <td class="text-end fw-bold text-dark fs-5"><?= formatCurrency($purchase['grand_total']) ?></td>
                    </tr>
                    <tr>
                        <td class="text-muted ps-0">Payment Status:</td>
                        <td class="text-end">
                            <span class="badge bg-light text-dark border"><?= htmlspecialchars($purchase['payment_status']) ?></span>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Item Details -->
<div class="card border-0 shadow-sm">
    <div class="card-header bg-white py-3">
        <span class="fw-bold text-dark"><i class="fa-solid fa-boxes-stacked text-primary me-2"></i>Purchased Items Log</span>
    </div>
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 small">
                <thead class="table-light">
                    <tr>
                        <th>#</th>
                        <th>Product Description</th>
                        <th>HSN/SAC</th>
                        <th class="text-end">Qty Inward</th>
                        <th class="text-end">Cost Price</th>
                        <th class="text-center">GST Rate</th>
                        <th class="text-end">Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($items as $idx => $it): ?>
                        <tr>
                            <td><?= $idx + 1 ?></td>
                            <td class="fw-bold text-dark"><?= htmlspecialchars($it['product_name']) ?></td>
                            <td class="font-monospace"><?= htmlspecialchars($it['hsn_sac'] ?: '-') ?></td>
                            <td class="text-end fw-semibold text-success">+<?= (float)$it['quantity'] ?> <?= htmlspecialchars($it['unit']) ?></td>
                            <td class="text-end"><?= formatCurrency($it['purchase_price']) ?></td>
                            <td class="text-center"><?= (float)$it['gst_rate'] ?>%</td>
                            <td class="text-end fw-bold"><?= formatCurrency($it['total']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
