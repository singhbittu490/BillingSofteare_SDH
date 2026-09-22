<?php
/**
 * SmartBill - Reports & Analytics Center
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Financial & GST Reports - SmartBill';

include __DIR__ . '/../includes/header.php';
?>

<div class="mb-4">
    <h4 class="fw-bold mb-1 text-dark">Reports & Business Intelligence</h4>
    <p class="text-muted small mb-0">Generate GST returns summaries, profit & loss, receivables aging, and stock valuations.</p>
</div>

<div class="row g-4">
    <!-- Sales Report -->
    <div class="col-md-6 col-lg-4">
        <div class="card border-0 shadow-sm h-100 p-4">
            <div class="d-flex align-items-center gap-3 mb-3">
                <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                    <i class="fa-solid fa-chart-line fs-5"></i>
                </div>
                <div>
                    <h5 class="fw-bold text-dark mb-0">Sales Report</h5>
                    <span class="text-muted small">Revenue by date & customer</span>
                </div>
            </div>
            <p class="small text-muted mb-4">Analyze total billing, collected taxes, invoice discounts, and customer revenue distributions with CSV export.</p>
            <a href="sales.php" class="btn btn-outline-primary btn-sm mt-auto">
                <i class="fa-solid fa-arrow-right me-1"></i> View Sales Report
            </a>
        </div>
    </div>

    <!-- GST Report -->
    <div class="col-md-6 col-lg-4">
        <div class="card border-0 shadow-sm h-100 p-4">
            <div class="d-flex align-items-center gap-3 mb-3">
                <div class="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                    <i class="fa-solid fa-file-invoice-dollar fs-5"></i>
                </div>
                <div>
                    <h5 class="fw-bold text-dark mb-0">GST Tax Report</h5>
                    <span class="text-muted small">GSTR-1 & GSTR-3B Summary</span>
                </div>
            </div>
            <p class="small text-muted mb-4">Taxable values, CGST, SGST, IGST totals, and HSN/SAC summary tables formatted for easy GST filing.</p>
            <a href="gst.php" class="btn btn-outline-success btn-sm mt-auto">
                <i class="fa-solid fa-arrow-right me-1"></i> View GST Report
            </a>
        </div>
    </div>

    <!-- Profit & Loss Statement -->
    <div class="col-md-6 col-lg-4">
        <div class="card border-0 shadow-sm h-100 p-4">
            <div class="d-flex align-items-center gap-3 mb-3">
                <div class="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                    <i class="fa-solid fa-scale-balanced fs-5"></i>
                </div>
                <div>
                    <h5 class="fw-bold text-dark mb-0">Profit & Loss</h5>
                    <span class="text-muted small">Gross & Net Margins</span>
                </div>
            </div>
            <p class="small text-muted mb-4">Real-time P&L statement calculating Gross Revenue, Cost of Goods Sold (COGS), Operating Overheads, and Net Income.</p>
            <a href="profit_loss.php" class="btn btn-outline-warning btn-sm mt-auto">
                <i class="fa-solid fa-arrow-right me-1"></i> View P&L Statement
            </a>
        </div>
    </div>

    <!-- Outstanding & Aging -->
    <div class="col-md-6 col-lg-4">
        <div class="card border-0 shadow-sm h-100 p-4">
            <div class="d-flex align-items-center gap-3 mb-3">
                <div class="rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                    <i class="fa-solid fa-clock-rotate-left fs-5"></i>
                </div>
                <div>
                    <h5 class="fw-bold text-dark mb-0">Outstanding Receivables</h5>
                    <span class="text-muted small">Aging analysis & reminders</span>
                </div>
            </div>
            <p class="small text-muted mb-4">Pending balances grouped by 0-30, 31-60, and 60+ days overdue with 1-click WhatsApp payment reminders.</p>
            <a href="outstanding.php" class="btn btn-outline-danger btn-sm mt-auto">
                <i class="fa-solid fa-arrow-right me-1"></i> View Outstanding
            </a>
        </div>
    </div>

    <!-- Stock Valuation Report -->
    <div class="col-md-6 col-lg-4">
        <div class="card border-0 shadow-sm h-100 p-4">
            <div class="d-flex align-items-center gap-3 mb-3">
                <div class="rounded-circle bg-info-subtle text-info d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                    <i class="fa-solid fa-warehouse fs-5"></i>
                </div>
                <div>
                    <h5 class="fw-bold text-dark mb-0">Stock Valuation</h5>
                    <span class="text-muted small">Inventory asset value</span>
                </div>
            </div>
            <p class="small text-muted mb-4">Item-wise asset valuation based on cost price vs selling price, low-stock warnings, and out-of-stock items.</p>
            <a href="stock.php" class="btn btn-outline-info btn-sm mt-auto">
                <i class="fa-solid fa-arrow-right me-1"></i> View Stock Valuation
            </a>
        </div>
    </div>

    <!-- Purchase Report -->
    <div class="col-md-6 col-lg-4">
        <div class="card border-0 shadow-sm h-100 p-4">
            <div class="d-flex align-items-center gap-3 mb-3">
                <div class="rounded-circle bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                    <i class="fa-solid fa-cart-shopping fs-5"></i>
                </div>
                <div>
                    <h5 class="fw-bold text-dark mb-0">Purchase Report</h5>
                    <span class="text-muted small">Supplier procurement log</span>
                </div>
            </div>
            <p class="small text-muted mb-4">Procurement volume, vendor invoice breakdown, input tax credit (ITC) amounts, and vendor totals.</p>
            <a href="purchases.php" class="btn btn-outline-secondary btn-sm mt-auto">
                <i class="fa-solid fa-arrow-right me-1"></i> View Purchase Report
            </a>
        </div>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
