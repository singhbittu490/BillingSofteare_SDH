<?php
/**
 * SmartBill - Profit & Loss Financial Statement
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Profit & Loss Statement - SmartBill';

$from_date = trim($_GET['from'] ?? date('Y-01-01'));
$to_date = trim($_GET['to'] ?? date('Y-m-d'));

// 1. Total Invoiced Revenue (Excluding Tax)
$stmt = $pdo->prepare("
    SELECT SUM(taxable_amount) as total_sales, COUNT(*) as invoice_count
    FROM invoices
    WHERE invoice_date >= ? AND invoice_date <= ?
");
$stmt->execute([$from_date, $to_date]);
$sales_row = $stmt->fetch();
$total_sales = (float)($sales_row['total_sales'] ?? 0);
$invoice_count = (int)($sales_row['invoice_count'] ?? 0);

// 2. Cost of Goods Sold (COGS) - Product Cost * Quantity sold
$stmt = $pdo->prepare("
    SELECT SUM(ii.quantity * p.purchase_price) as total_cogs
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    JOIN products p ON ii.product_id = p.id
    WHERE i.invoice_date >= ? AND i.invoice_date <= ?
");
$stmt->execute([$from_date, $to_date]);
$cogs_row = $stmt->fetch();
$total_cogs = (float)($cogs_row['total_cogs'] ?? 0);

// 3. Gross Profit
$gross_profit = $total_sales - $total_cogs;
$gross_margin_pct = ($total_sales > 0) ? ($gross_profit / $total_sales) * 100 : 0;

// 4. Operating Expenses breakdown by category
$stmt = $pdo->prepare("
    SELECT category, SUM(amount) as cat_total, COUNT(*) as count
    FROM expenses
    WHERE expense_date >= ? AND expense_date <= ?
    GROUP BY category
    ORDER BY cat_total DESC
");
$stmt->execute([$from_date, $to_date]);
$expense_breakdown = $stmt->fetchAll();

$total_expenses = 0;
foreach ($expense_breakdown as $eb) {
    $total_expenses += (float)$eb['cat_total'];
}

// 5. Net Profit
$net_profit = $gross_profit - $total_expenses;
$net_margin_pct = ($total_sales > 0) ? ($net_profit / $total_sales) * 100 : 0;

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Profit & Loss Statement</h4>
        <p class="text-muted small mb-0">Income statement measuring trading revenue, Cost of Goods Sold, operational overheads, and net margins.</p>
    </div>
    <div class="d-flex gap-2">
        <button onclick="window.print()" class="btn btn-outline-secondary btn-sm shadow-sm">
            <i class="fa-solid fa-print me-1"></i> Print P&L Statement
        </button>
    </div>
</div>

<!-- Date Filter -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-body p-3">
        <form method="GET" action="profit_loss.php" class="row g-2 align-items-center">
            <div class="col-md-5">
                <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light">Start Date</span>
                    <input type="date" name="from" class="form-control" value="<?= htmlspecialchars($from_date) ?>" required>
                </div>
            </div>
            <div class="col-md-5">
                <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light">End Date</span>
                    <input type="date" name="to" class="form-control" value="<?= htmlspecialchars($to_date) ?>" required>
                </div>
            </div>
            <div class="col-md-2 d-flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm flex-grow-1">Compute P&L</button>
            </div>
        </form>
    </div>
</div>

<!-- High Level Metrics -->
<div class="row g-3 mb-4">
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">SALES REVENUE (EXCL. TAX)</span>
            <div class="fs-4 fw-bold text-dark mt-1"><?= formatCurrency($total_sales) ?></div>
            <div class="small text-muted"><?= $invoice_count ?> Invoices In Period</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">COST OF GOODS SOLD (COGS)</span>
            <div class="fs-4 fw-bold text-secondary mt-1"><?= formatCurrency($total_cogs) ?></div>
            <div class="small text-muted">Direct inventory procurement cost</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white">
            <span class="text-muted small fw-semibold">OPERATING EXPENSES</span>
            <div class="fs-4 fw-bold text-danger mt-1"><?= formatCurrency($total_expenses) ?></div>
            <div class="small text-muted"><?= count($expense_breakdown) ?> Expense Categories</div>
        </div>
    </div>
    <div class="col-sm-6 col-lg-3">
        <div class="card p-3 border-0 shadow-sm bg-white border-start border-4 <?= ($net_profit >= 0) ? 'border-success' : 'border-danger' ?>">
            <span class="text-muted small fw-semibold">NET INCOME / PROFIT</span>
            <div class="fs-4 fw-bold <?= ($net_profit >= 0) ? 'text-success' : 'text-danger' ?> mt-1">
                <?= formatCurrency($net_profit) ?>
            </div>
            <div class="small fw-semibold <?= ($net_profit >= 0) ? 'text-success' : 'text-danger' ?>">
                <?= number_format($net_margin_pct, 1) ?>% Net Margin
            </div>
        </div>
    </div>
</div>

<!-- Formal P&L Statement Card -->
<div class="card border-0 shadow-sm">
    <div class="card-header bg-white py-3">
        <span class="fw-bold text-dark"><i class="fa-solid fa-scale-balanced text-primary me-2"></i>Statement of Financial Performance (<?= formatDate($from_date, 'd M Y') ?> to <?= formatDate($to_date, 'd M Y') ?>)</span>
    </div>
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light small">
                    <tr>
                        <th style="width: 70%;">Particulars</th>
                        <th class="text-end" style="width: 30%;">Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Operating Revenue -->
                    <tr class="table-light">
                        <td colspan="2" class="fw-bold text-dark text-uppercase small">A. Operating Revenue</td>
                    </tr>
                    <tr>
                        <td class="ps-4">Gross Revenue from Sales (Taxable Value)</td>
                        <td class="text-end fw-semibold font-monospace"><?= formatCurrency($total_sales) ?></td>
                    </tr>
                    <tr>
                        <td class="ps-4 text-danger">Less: Cost of Goods Sold (Direct Product Cost)</td>
                        <td class="text-end text-danger font-monospace">-<?= formatCurrency($total_cogs) ?></td>
                    </tr>
                    <tr class="fw-bold bg-light">
                        <td class="ps-4 text-dark">Gross Trading Profit</td>
                        <td class="text-end text-dark font-monospace"><?= formatCurrency($gross_profit) ?></td>
                    </tr>

                    <!-- Operating Expenses -->
                    <tr class="table-light">
                        <td colspan="2" class="fw-bold text-dark text-uppercase small">B. Operating & Administrative Expenses</td>
                    </tr>
                    <?php if (empty($expense_breakdown)): ?>
                        <tr>
                            <td class="ps-4 text-muted small">No operational expenses recorded during this period.</td>
                            <td class="text-end font-monospace">₹0.00</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($expense_breakdown as $eb): ?>
                            <tr>
                                <td class="ps-4"><?= htmlspecialchars($eb['category']) ?> Expenses (<?= $eb['count'] ?> entries)</td>
                                <td class="text-end text-muted font-monospace"><?= formatCurrency($eb['cat_total']) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                    <tr class="fw-bold bg-light">
                        <td class="ps-4 text-dark">Total Operating Expenses</td>
                        <td class="text-end text-danger font-monospace">-<?= formatCurrency($total_expenses) ?></td>
                    </tr>

                    <!-- Net Income -->
                    <tr class="fw-bold fs-6 <?= ($net_profit >= 0) ? 'table-success' : 'table-danger' ?>">
                        <td class="py-3">
                            <i class="fa-solid <?= ($net_profit >= 0) ? 'fa-arrow-trend-up text-success' : 'fa-arrow-trend-down text-danger' ?> me-2"></i>
                            NET PROFIT / (LOSS) FOR PERIOD
                        </td>
                        <td class="text-end py-3 fs-5 font-monospace <?= ($net_profit >= 0) ? 'text-success' : 'text-danger' ?>">
                            <?= formatCurrency($net_profit) ?>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
