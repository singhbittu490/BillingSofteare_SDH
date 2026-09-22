<?php
/**
 * SmartBill - Main Dashboard
 * High-performance analytics with real MySQL queries
 */

require_once __DIR__ . '/includes/auth_check.php';

$page_title = 'Dashboard - SmartBill GST Billing';

// 1. Fetch Key Metrics from MySQL
$today = date('Y-m-d');
$first_day_month = date('Y-m-01');

// Today's Sales
$stmt = $pdo->prepare("SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE invoice_date = ?");
$stmt->execute([$today]);
$today_sales = (float)$stmt->fetchColumn();

// This Month's Sales
$stmt = $pdo->prepare("SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE invoice_date >= ?");
$stmt->execute([$first_day_month]);
$month_sales = (float)$stmt->fetchColumn();

// Total Sales
$stmt = $pdo->query("SELECT COALESCE(SUM(grand_total), 0) FROM invoices");
$total_sales = (float)$stmt->fetchColumn();

// Total Purchases
$stmt = $pdo->query("SELECT COALESCE(SUM(grand_total), 0) FROM purchases");
$total_purchases = (float)$stmt->fetchColumn();

// Total Receivable (Outstanding balance on unpaid/partially paid invoices)
$stmt = $pdo->query("SELECT COALESCE(SUM(outstanding_amount), 0) FROM invoices WHERE status != 'Paid'");
$total_receivable = (float)$stmt->fetchColumn();

// Total Payments Received
$stmt = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM payments");
$total_payments = (float)$stmt->fetchColumn();

// Total Customers
$stmt = $pdo->query("SELECT COUNT(*) FROM customers");
$total_customers = (int)$stmt->fetchColumn();

// Total Products
$stmt = $pdo->query("SELECT COUNT(*) FROM products");
$total_products = (int)$stmt->fetchColumn();

// Low Stock Products Count
$stmt = $pdo->query("SELECT COUNT(*) FROM products WHERE current_stock <= minimum_stock");
$low_stock_count = (int)$stmt->fetchColumn();

// Total Invoices
$stmt = $pdo->query("SELECT COUNT(*) FROM invoices");
$total_invoices = (int)$stmt->fetchColumn();

// 2. Monthly Sales Graph Data (Last 6 Months)
$sales_chart_labels = [];
$sales_chart_data = [];

$chartQuery = $pdo->query("
    SELECT 
        DATE_FORMAT(invoice_date, '%b %Y') as month_label,
        DATE_FORMAT(invoice_date, '%Y-%m') as sort_key,
        COALESCE(SUM(grand_total), 0) as total_amount
    FROM invoices
    WHERE invoice_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY sort_key, month_label
    ORDER BY sort_key ASC
");
$chartRows = $chartQuery->fetchAll();

if (empty($chartRows)) {
    // Current month placeholder
    $sales_chart_labels[] = date('M Y');
    $sales_chart_data[] = $month_sales;
} else {
    foreach ($chartRows as $row) {
        $sales_chart_labels[] = $row['month_label'];
        $sales_chart_data[] = (float)$row['total_amount'];
    }
}

// 3. Recent Invoices
$stmt = $pdo->query("
    SELECT id, invoice_number, invoice_date, customer_name, grand_total, paid_amount, outstanding_amount, status
    FROM invoices 
    ORDER BY id DESC 
    LIMIT 6
");
$recent_invoices = $stmt->fetchAll();

// 4. Recent Payments
$stmt = $pdo->query("
    SELECT p.id, p.payment_date, p.amount, p.payment_method, p.reference_number, c.name as customer_name, i.invoice_number
    FROM payments p
    LEFT JOIN customers c ON p.customer_id = c.id
    LEFT JOIN invoices i ON p.invoice_id = i.id
    ORDER BY p.id DESC
    LIMIT 5
");
$recent_payments = $stmt->fetchAll();

// 5. Low Stock Products
$stmt = $pdo->query("
    SELECT id, name, sku, current_stock, minimum_stock, unit, selling_price
    FROM products
    WHERE current_stock <= minimum_stock
    ORDER BY current_stock ASC
    LIMIT 5
");
$low_stock_products = $stmt->fetchAll();

include __DIR__ . '/includes/header.php';
?>

<!-- Dashboard Header -->
<div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Business Dashboard</h4>
        <p class="text-muted small mb-0">Overview of sales, receivables, inventory, and GST invoicing performance.</p>
    </div>
    <div class="d-flex gap-2">
        <a href="invoices/create.php" class="btn btn-primary btn-sm shadow-sm">
            <i class="fa-solid fa-plus me-1"></i> New Invoice
        </a>
        <a href="payments/index.php" class="btn btn-outline-secondary btn-sm bg-white shadow-sm">
            <i class="fa-solid fa-receipt me-1"></i> Record Payment
        </a>
    </div>
</div>

<!-- Primary Metric Cards Grid -->
<div class="row g-3 mb-4">
    <!-- Today's Sales -->
    <div class="col-sm-6 col-xl-3">
        <div class="sb-stat-card">
            <div>
                <div class="sb-stat-title">Today's Sales</div>
                <div class="sb-stat-value text-primary"><?= formatCurrency($today_sales) ?></div>
                <div class="small text-muted mt-1"><i class="fa-regular fa-calendar me-1"></i> <?= date('d M Y') ?></div>
            </div>
            <div class="sb-stat-icon bg-primary-subtle text-primary">
                <i class="fa-solid fa-chart-line"></i>
            </div>
        </div>
    </div>

    <!-- This Month's Sales -->
    <div class="col-sm-6 col-xl-3">
        <div class="sb-stat-card">
            <div>
                <div class="sb-stat-title">This Month's Sales</div>
                <div class="sb-stat-value text-success"><?= formatCurrency($month_sales) ?></div>
                <div class="small text-muted mt-1"><i class="fa-solid fa-calendar-days me-1"></i> <?= date('F Y') ?></div>
            </div>
            <div class="sb-stat-icon bg-success-subtle text-success">
                <i class="fa-solid fa-sack-dollar"></i>
            </div>
        </div>
    </div>

    <!-- Total Receivable -->
    <div class="col-sm-6 col-xl-3">
        <div class="sb-stat-card">
            <div>
                <div class="sb-stat-title">Total Receivable</div>
                <div class="sb-stat-value text-danger"><?= formatCurrency($total_receivable) ?></div>
                <div class="small text-muted mt-1">Pending payments due</div>
            </div>
            <div class="sb-stat-icon bg-danger-subtle text-danger">
                <i class="fa-solid fa-hand-holding-dollar"></i>
            </div>
        </div>
    </div>

    <!-- Total Payments Received -->
    <div class="col-sm-6 col-xl-3">
        <div class="sb-stat-card">
            <div>
                <div class="sb-stat-title">Total Payments</div>
                <div class="sb-stat-value text-dark"><?= formatCurrency($total_payments) ?></div>
                <div class="small text-muted mt-1">Lifetime collections</div>
            </div>
            <div class="sb-stat-icon bg-info-subtle text-info">
                <i class="fa-solid fa-wallet"></i>
            </div>
        </div>
    </div>
</div>

<!-- Secondary Statistics Grid -->
<div class="row g-3 mb-4">
    <div class="col-6 col-md-4 col-lg-2">
        <div class="card p-3 text-center border-0 shadow-sm bg-white">
            <div class="text-muted small fw-semibold">TOTAL SALES</div>
            <div class="fs-5 fw-bold text-dark mt-1"><?= formatCurrency($total_sales) ?></div>
        </div>
    </div>
    <div class="col-6 col-md-4 col-lg-2">
        <div class="card p-3 text-center border-0 shadow-sm bg-white">
            <div class="text-muted small fw-semibold">TOTAL PURCHASES</div>
            <div class="fs-5 fw-bold text-secondary mt-1"><?= formatCurrency($total_purchases) ?></div>
        </div>
    </div>
    <div class="col-6 col-md-4 col-lg-2">
        <div class="card p-3 text-center border-0 shadow-sm bg-white">
            <div class="text-muted small fw-semibold">TOTAL INVOICES</div>
            <div class="fs-5 fw-bold text-primary mt-1"><?= $total_invoices ?></div>
        </div>
    </div>
    <div class="col-6 col-md-4 col-lg-2">
        <div class="card p-3 text-center border-0 shadow-sm bg-white">
            <div class="text-muted small fw-semibold">CUSTOMERS</div>
            <div class="fs-5 fw-bold text-dark mt-1"><?= $total_customers ?></div>
        </div>
    </div>
    <div class="col-6 col-md-4 col-lg-2">
        <div class="card p-3 text-center border-0 shadow-sm bg-white">
            <div class="text-muted small fw-semibold">TOTAL PRODUCTS</div>
            <div class="fs-5 fw-bold text-dark mt-1"><?= $total_products ?></div>
        </div>
    </div>
    <div class="col-6 col-md-4 col-lg-2">
        <div class="card p-3 text-center border-0 shadow-sm bg-white">
            <div class="text-muted small fw-semibold">LOW STOCK</div>
            <div class="fs-5 fw-bold <?= $low_stock_count > 0 ? 'text-danger' : 'text-success' ?> mt-1">
                <?= $low_stock_count ?>
            </div>
        </div>
    </div>
</div>

<!-- Sales Trend Chart & Quick Summary -->
<div class="row g-4 mb-4">
    <div class="col-lg-8">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <span class="fw-bold text-dark"><i class="fa-solid fa-chart-simple text-primary me-2"></i>Sales Performance Trend</span>
                <span class="badge bg-light text-muted border">Last 6 Months</span>
            </div>
            <div class="card-body p-3 p-md-4">
                <canvas id="salesChart" style="max-height: 280px;"></canvas>
            </div>
        </div>
    </div>

    <div class="col-lg-4">
        <!-- Low Stock Alert Card -->
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <span class="fw-bold text-danger"><i class="fa-solid fa-triangle-exclamation me-2"></i>Low Stock Products</span>
                <a href="products/index.php?filter=low_stock" class="small text-decoration-none">View All</a>
            </div>
            <div class="card-body p-0">
                <?php if (empty($low_stock_products)): ?>
                    <div class="p-4 text-center text-muted">
                        <i class="fa-solid fa-circle-check text-success fa-2x mb-2"></i>
                        <p class="mb-0 small">All products have sufficient stock levels.</p>
                    </div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0 small">
                            <thead class="table-light">
                                <tr>
                                    <th>Product</th>
                                    <th class="text-end">Current</th>
                                    <th class="text-end">Min</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($low_stock_products as $p): ?>
                                    <tr>
                                        <td>
                                            <div class="fw-semibold text-dark"><?= htmlspecialchars($p['name']) ?></div>
                                            <div class="text-muted" style="font-size: 0.75rem;">SKU: <?= htmlspecialchars($p['sku'] ?? '-') ?></div>
                                        </td>
                                        <td class="text-end fw-bold text-danger">
                                            <?= (float)$p['current_stock'] ?> <?= htmlspecialchars($p['unit']) ?>
                                        </td>
                                        <td class="text-end text-muted">
                                            <?= (float)$p['minimum_stock'] ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<!-- Recent Invoices & Recent Payments Grid -->
<div class="row g-4">
    <!-- Recent Invoices Table -->
    <div class="col-lg-7">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <span class="fw-bold text-dark"><i class="fa-solid fa-file-invoice text-primary me-2"></i>Recent Invoices</span>
                <a href="invoices/index.php" class="btn btn-outline-primary btn-sm">View All Invoices</a>
            </div>
            <div class="card-body p-0">
                <?php if (empty($recent_invoices)): ?>
                    <div class="p-4 text-center text-muted small">No invoices recorded yet.</div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0 small">
                            <thead class="table-light">
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th class="text-end">Total</th>
                                    <th class="text-center">Status</th>
                                    <th class="text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recent_invoices as $inv): ?>
                                    <tr>
                                        <td class="fw-semibold">
                                            <a href="invoices/view.php?id=<?= $inv['id'] ?>" class="text-decoration-none text-primary">
                                                <?= htmlspecialchars($inv['invoice_number']) ?>
                                            </a>
                                        </td>
                                        <td><?= formatDate($inv['invoice_date'], 'd M') ?></td>
                                        <td><?= htmlspecialchars($inv['customer_name']) ?></td>
                                        <td class="text-end fw-bold text-dark"><?= formatCurrency($inv['grand_total']) ?></td>
                                        <td class="text-center">
                                            <?php 
                                                $badge = 'badge-status-unpaid';
                                                if ($inv['status'] === 'Paid') $badge = 'badge-status-paid';
                                                elseif ($inv['status'] === 'Partially Paid') $badge = 'badge-status-partially';
                                            ?>
                                            <span class="<?= $badge ?>"><?= $inv['status'] ?></span>
                                        </td>
                                        <td class="text-end">
                                            <a href="invoices/view.php?id=<?= $inv['id'] ?>" class="btn btn-light btn-sm p-1 px-2 border" title="View Details">
                                                <i class="fa-regular fa-eye"></i>
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
    </div>

    <!-- Recent Payments Table -->
    <div class="col-lg-5">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <span class="fw-bold text-dark"><i class="fa-solid fa-receipt text-success me-2"></i>Recent Payments</span>
                <a href="payments/index.php" class="btn btn-outline-success btn-sm">All Payments</a>
            </div>
            <div class="card-body p-0">
                <?php if (empty($recent_payments)): ?>
                    <div class="p-4 text-center text-muted small">No payments recorded yet.</div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0 small">
                            <thead class="table-light">
                                <tr>
                                    <th>Date</th>
                                    <th>Customer / Ref</th>
                                    <th>Method</th>
                                    <th class="text-end">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recent_payments as $pmt): ?>
                                    <tr>
                                        <td><?= formatDate($pmt['payment_date'], 'd M') ?></td>
                                        <td>
                                            <div class="fw-semibold text-dark"><?= htmlspecialchars($pmt['customer_name'] ?? 'Customer') ?></div>
                                            <div class="text-muted" style="font-size: 0.75rem;">
                                                <?= htmlspecialchars($pmt['invoice_number'] ?? 'On Account') ?>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="badge bg-light text-dark border"><?= htmlspecialchars($pmt['payment_method']) ?></span>
                                        </td>
                                        <td class="text-end fw-bold text-success">
                                            <?= formatCurrency($pmt['amount']) ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<!-- Chart Initialization Script -->
<script>
document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('salesChart');
    if (ctx && typeof Chart !== 'undefined') {
        const labels = <?= json_encode($sales_chart_labels) ?>;
        const data = <?= json_encode($sales_chart_data) ?>;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sales (₹)',
                    data: data,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#2563eb',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ' Sales: ₹' + Number(context.parsed.y).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + (value >= 1000 ? (value / 1000) + 'k' : value);
                            }
                        },
                        grid: { color: '#f1f5f9' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }
});
</script>

<?php include __DIR__ . '/includes/footer.php'; ?>
