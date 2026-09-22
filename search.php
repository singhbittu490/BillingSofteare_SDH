<?php
/**
 * SmartBill - Global Unified Search
 * Searches Invoices, Customers, Products, and Suppliers
 */

require_once __DIR__ . '/includes/auth_check.php';

$query = trim($_GET['q'] ?? '');
$page_title = 'Search Results for "' . htmlspecialchars($query) . '" - SmartBill';

$invoices = [];
$customers = [];
$products = [];
$suppliers = [];

if ($query !== '') {
    $term = "%{$query}%";

    // 1. Search Invoices
    $stmt = $pdo->prepare("
        SELECT id, invoice_number, customer_name, invoice_date, grand_total, status, outstanding_amount 
        FROM invoices 
        WHERE invoice_number LIKE ? OR customer_name LIKE ? OR customer_gstin LIKE ?
        ORDER BY id DESC LIMIT 10
    ");
    $stmt->execute([$term, $term, $term]);
    $invoices = $stmt->fetchAll();

    // 2. Search Customers
    $stmt = $pdo->prepare("
        SELECT id, name, business_name, mobile, email, gstin 
        FROM customers 
        WHERE name LIKE ? OR business_name LIKE ? OR mobile LIKE ? OR gstin LIKE ? OR email LIKE ?
        ORDER BY id DESC LIMIT 10
    ");
    $stmt->execute([$term, $term, $term, $term, $term]);
    $customers = $stmt->fetchAll();

    // 3. Search Products
    $stmt = $pdo->prepare("
        SELECT id, name, sku, hsn_sac, selling_price, current_stock, unit 
        FROM products 
        WHERE name LIKE ? OR sku LIKE ? OR hsn_sac LIKE ?
        ORDER BY id DESC LIMIT 10
    ");
    $stmt->execute([$term, $term, $term]);
    $products = $stmt->fetchAll();

    // 4. Search Suppliers
    $stmt = $pdo->prepare("
        SELECT id, name, company_name, mobile, gstin 
        FROM suppliers 
        WHERE name LIKE ? OR company_name LIKE ? OR mobile LIKE ? OR gstin LIKE ?
        ORDER BY id DESC LIMIT 10
    ");
    $stmt->execute([$term, $term, $term, $term]);
    $suppliers = $stmt->fetchAll();
}

$total_results = count($invoices) + count($customers) + count($products) + count($suppliers);

include __DIR__ . '/includes/header.php';
?>

<div class="mb-4">
    <h4 class="fw-bold mb-1 text-dark">Search Results</h4>
    <p class="text-muted small mb-0">
        Found <strong><?= $total_results ?></strong> results matching <span class="badge bg-light text-dark border font-monospace"><?= htmlspecialchars($query) ?></span>
    </p>
</div>

<!-- Search Input -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-body p-3">
        <form method="GET" action="search.php" class="d-flex gap-2">
            <div class="input-group">
                <span class="input-group-text bg-light"><i class="fa-solid fa-magnifying-glass"></i></span>
                <input type="text" name="q" class="form-control" placeholder="Search invoices, customers, products, or suppliers..." value="<?= htmlspecialchars($query) ?>" autofocus required>
            </div>
            <button type="submit" class="btn btn-primary px-4">Search</button>
        </form>
    </div>
</div>

<?php if ($query === ''): ?>
    <div class="p-5 text-center text-muted">
        <i class="fa-solid fa-magnifying-glass fa-3x mb-3 text-secondary"></i>
        <h5>Enter a keyword to search</h5>
        <p class="small">Search across invoices, customers, products, SKU, HSN, and suppliers.</p>
    </div>
<?php elseif ($total_results === 0): ?>
    <div class="p-5 text-center text-muted card border-0 shadow-sm">
        <i class="fa-solid fa-circle-question fa-3x mb-3 text-secondary"></i>
        <h5>No results found for "<?= htmlspecialchars($query) ?>"</h5>
        <p class="small">Check your spelling or try searching with a different term.</p>
    </div>
<?php else: ?>
    <div class="row g-4">
        <!-- Invoices Results -->
        <?php if (!empty($invoices)): ?>
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                        <span class="fw-bold text-dark"><i class="fa-solid fa-file-invoice-dollar text-primary me-2"></i>Invoices (<?= count($invoices) ?>)</span>
                        <a href="invoices/index.php?search=<?= urlencode($query) ?>" class="small text-decoration-none">View all invoices &rarr;</a>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0 small">
                                <thead class="table-light">
                                    <tr>
                                        <th>Invoice #</th>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th class="text-end">Total Amount</th>
                                        <th class="text-center">Status</th>
                                        <th class="text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($invoices as $inv): ?>
                                        <tr>
                                            <td class="fw-bold font-monospace">
                                                <a href="invoices/view.php?id=<?= $inv['id'] ?>" class="text-primary text-decoration-none">
                                                    <?= htmlspecialchars($inv['invoice_number']) ?>
                                                </a>
                                            </td>
                                            <td><?= formatDate($inv['invoice_date'], 'd M Y') ?></td>
                                            <td class="fw-semibold text-dark"><?= htmlspecialchars($inv['customer_name']) ?></td>
                                            <td class="text-end fw-bold text-dark"><?= formatCurrency($inv['grand_total']) ?></td>
                                            <td class="text-center">
                                                <span class="badge bg-light text-dark border"><?= htmlspecialchars($inv['status']) ?></span>
                                            </td>
                                            <td class="text-end">
                                                <a href="invoices/view.php?id=<?= $inv['id'] ?>" class="btn btn-light btn-sm border">View</a>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        <?php endif; ?>

        <!-- Customer Results -->
        <?php if (!empty($customers)): ?>
            <div class="col-md-6">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                        <span class="fw-bold text-dark"><i class="fa-solid fa-users text-success me-2"></i>Customers (<?= count($customers) ?>)</span>
                        <a href="customers/index.php?search=<?= urlencode($query) ?>" class="small text-decoration-none">All &rarr;</a>
                    </div>
                    <div class="card-body p-0">
                        <div class="list-group list-group-flush small">
                            <?php foreach ($customers as $c): ?>
                                <a href="customers/view.php?id=<?= $c['id'] ?>" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
                                    <div>
                                        <div class="fw-bold text-dark"><?= htmlspecialchars($c['name']) ?></div>
                                        <div class="text-muted" style="font-size: 0.75rem;">
                                            Phone: <?= htmlspecialchars($c['mobile'] ?: 'N/A') ?> &bull; GSTIN: <?= htmlspecialchars($c['gstin'] ?: 'Unregistered') ?>
                                        </div>
                                    </div>
                                    <i class="fa-solid fa-chevron-right text-muted"></i>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
        <?php endif; ?>

        <!-- Product Results -->
        <?php if (!empty($products)): ?>
            <div class="col-md-6">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                        <span class="fw-bold text-dark"><i class="fa-solid fa-boxes-stacked text-warning me-2"></i>Products & Stock (<?= count($products) ?>)</span>
                        <a href="products/index.php?search=<?= urlencode($query) ?>" class="small text-decoration-none">All &rarr;</a>
                    </div>
                    <div class="card-body p-0">
                        <div class="list-group list-group-flush small">
                            <?php foreach ($products as $p): ?>
                                <a href="products/view.php?id=<?= $p['id'] ?>" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
                                    <div>
                                        <div class="fw-bold text-dark"><?= htmlspecialchars($p['name']) ?></div>
                                        <div class="text-muted" style="font-size: 0.75rem;">
                                            Price: <?= formatCurrency($p['selling_price']) ?> &bull; Stock: <?= (float)$p['current_stock'] ?> <?= htmlspecialchars($p['unit']) ?>
                                        </div>
                                    </div>
                                    <i class="fa-solid fa-chevron-right text-muted"></i>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
        <?php endif; ?>

        <!-- Supplier Results -->
        <?php if (!empty($suppliers)): ?>
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                        <span class="fw-bold text-dark"><i class="fa-solid fa-truck text-info me-2"></i>Suppliers (<?= count($suppliers) ?>)</span>
                        <a href="suppliers/index.php?search=<?= urlencode($query) ?>" class="small text-decoration-none">All &rarr;</a>
                    </div>
                    <div class="card-body p-0">
                        <div class="list-group list-group-flush small">
                            <?php foreach ($suppliers as $s): ?>
                                <a href="suppliers/view.php?id=<?= $s['id'] ?>" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
                                    <div>
                                        <div class="fw-bold text-dark"><?= htmlspecialchars($s['name']) ?></div>
                                        <div class="text-muted" style="font-size: 0.75rem;">
                                            Company: <?= htmlspecialchars($s['company_name'] ?: 'N/A') ?> &bull; Phone: <?= htmlspecialchars($s['mobile'] ?: 'N/A') ?>
                                        </div>
                                    </div>
                                    <i class="fa-solid fa-chevron-right text-muted"></i>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>
<?php endif; ?>

<?php include __DIR__ . '/includes/footer.php'; ?>
