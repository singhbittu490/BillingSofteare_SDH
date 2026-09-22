<?php
/**
 * SmartBill - Printable A4 GST Tax Invoice
 * Compliant with Indian GST Act & Rules
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("
    SELECT i.*, c.mobile as customer_mobile, c.email as customer_email, c.business_name, c.shipping_address
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.id = ?
");
$stmt->execute([$id]);
$invoice = $stmt->fetch();

if (!$invoice) {
    setFlash('danger', 'Invoice not found.');
    header("Location: index.php");
    exit;
}

$company = getCompanySettings($pdo);

// Fetch items
$stmt = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC");
$stmt->execute([$id]);
$items = $stmt->fetchAll();

// Group items by HSN/SAC for GST Tax Summary Table
$hsn_summary = [];
foreach ($items as $it) {
    $hsn = $it['hsn_sac'] ?: 'N/A';
    if (!isset($hsn_summary[$hsn])) {
        $hsn_summary[$hsn] = [
            'taxable_amount' => 0,
            'gst_rate' => $it['gst_rate'],
            'cgst_amount' => 0,
            'sgst_amount' => 0,
            'igst_amount' => 0,
            'total_tax' => 0
        ];
    }
    $hsn_summary[$hsn]['taxable_amount'] += (float)$it['taxable_amount'];
    $hsn_summary[$hsn]['cgst_amount'] += (float)$it['cgst_amount'];
    $hsn_summary[$hsn]['sgst_amount'] += (float)$it['sgst_amount'];
    $hsn_summary[$hsn]['igst_amount'] += (float)$it['igst_amount'];
    $hsn_summary[$hsn]['total_tax'] += ((float)$it['cgst_amount'] + (float)$it['sgst_amount'] + (float)$it['igst_amount']);
}

$auto_print = isset($_GET['auto_print']) && $_GET['auto_print'] == 1;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tax Invoice - <?= htmlspecialchars($invoice['invoice_number']) ?></title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <!-- Custom SmartBill CSS with Print Rules -->
    <link rel="stylesheet" href="../assets/css/style.css">
    <style>
        body {
            background-color: #f1f5f9;
        }
        .invoice-paper {
            background: #ffffff;
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
            padding: 15mm;
            border: 1px solid #cbd5e1;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            font-size: 12px;
            color: #1e293b;
            box-sizing: border-box;
        }
        .tax-table th, .tax-table td {
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
        }
        .tax-table th {
            background-color: #f8fafc;
            font-weight: 700;
        }
        @media print {
            body {
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .invoice-paper {
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
                width: 100% !important;
                min-height: auto !important;
                padding: 0 !important;
            }
            .no-print {
                display: none !important;
            }
            @page {
                size: A4 portrait;
                margin: 10mm 12mm 10mm 12mm;
            }
        }
    </style>
</head>
<body>

<!-- Floating Print Control Bar (Hidden when printing) -->
<div class="no-print bg-white border-bottom py-2 sticky-top shadow-sm">
    <div class="container d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-2">
            <a href="view.php?id=<?= $id ?>" class="btn btn-outline-secondary btn-sm">
                <i class="fa-solid fa-arrow-left me-1"></i> Back to Invoice
            </a>
            <span class="fw-bold small text-dark">Invoice: <?= htmlspecialchars($invoice['invoice_number']) ?></span>
        </div>
        <div class="d-flex gap-2">
            <button onclick="window.print()" class="btn btn-primary btn-sm px-3 shadow-sm">
                <i class="fa-solid fa-print me-1"></i> Print / Save PDF
            </button>
        </div>
    </div>
</div>

<!-- Main Printable A4 Invoice Sheet -->
<div class="invoice-paper">
    <!-- Header Block -->
    <div class="row align-items-start pb-3 border-bottom border-dark border-2">
        <div class="col-8">
            <div class="d-flex align-items-center gap-3">
                <?php if (!empty($company['logo'])): ?>
                    <img src="../<?= htmlspecialchars($company['logo']) ?>" alt="Logo" style="max-height: 60px; max-width: 160px; object-fit: contain;">
                <?php endif; ?>
                <div>
                    <h4 class="fw-bold text-dark mb-0 text-uppercase"><?= htmlspecialchars($company['company_name'] ?? 'SmartBill') ?></h4>
                    <?php if (!empty($company['legal_name'])): ?>
                        <div class="text-muted small fw-semibold"><?= htmlspecialchars($company['legal_name']) ?></div>
                    <?php endif; ?>
                </div>
            </div>
            <div class="mt-2 small text-dark">
                <?= htmlspecialchars($company['address'] ?? '') ?>, <?= htmlspecialchars($company['city'] ?? '') ?>, <?= htmlspecialchars($company['state'] ?? '') ?> - <?= htmlspecialchars($company['pin_code'] ?? '') ?><br>
                <strong>GSTIN:</strong> <?= htmlspecialchars($company['gstin'] ?? '') ?> &bull; 
                <strong>PAN:</strong> <?= htmlspecialchars($company['pan'] ?? '') ?> &bull; 
                <strong>State Code:</strong> <?= htmlspecialchars($company['state_code'] ?? '') ?><br>
                <strong>Email:</strong> <?= htmlspecialchars($company['email'] ?? '') ?> &bull; 
                <strong>Phone:</strong> <?= htmlspecialchars($company['mobile'] ?? '') ?>
            </div>
        </div>
        <div class="col-4 text-end">
            <div class="border border-dark border-2 p-1 px-2 text-center text-uppercase fw-bold fs-6 mb-2 bg-light">
                TAX INVOICE
            </div>
            <div class="small text-muted mb-0">Original for Recipient</div>
        </div>
    </div>

    <!-- Meta Details & Customer Details Grid -->
    <div class="row border border-top-0 border-dark mb-3">
        <!-- Invoice Metadata -->
        <div class="col-6 border-end border-dark p-2">
            <table class="w-100 small">
                <tr>
                    <td class="text-muted fw-semibold" style="width: 42%;">Invoice No:</td>
                    <td class="fw-bold font-monospace"><?= htmlspecialchars($invoice['invoice_number']) ?></td>
                </tr>
                <tr>
                    <td class="text-muted fw-semibold">Invoice Date:</td>
                    <td><?= formatDate($invoice['invoice_date'], 'd-M-Y') ?></td>
                </tr>
                <tr>
                    <td class="text-muted fw-semibold">Due Date:</td>
                    <td><?= formatDate($invoice['due_date'], 'd-M-Y') ?></td>
                </tr>
                <tr>
                    <td class="text-muted fw-semibold">Place of Supply:</td>
                    <td class="fw-bold"><?= htmlspecialchars($invoice['place_of_supply']) ?></td>
                </tr>
                <tr>
                    <td class="text-muted fw-semibold">Reverse Charge:</td>
                    <td><?= htmlspecialchars($invoice['reverse_charge']) ?></td>
                </tr>
            </table>
        </div>

        <!-- Billed To Customer -->
        <div class="col-6 p-2">
            <div class="fw-bold text-uppercase small text-dark border-bottom pb-1 mb-1">Details of Receiver (Billed To):</div>
            <div class="fw-bold text-dark fs-6"><?= htmlspecialchars($invoice['customer_name']) ?></div>
            <?php if (!empty($invoice['business_name'])): ?>
                <div class="small text-muted"><?= htmlspecialchars($invoice['business_name']) ?></div>
            <?php endif; ?>
            <div class="small text-dark"><?= nl2br(htmlspecialchars($invoice['customer_address'] ?? '')) ?></div>
            <div class="small mt-1">
                <strong>GSTIN:</strong> <span class="font-monospace fw-bold"><?= htmlspecialchars($invoice['customer_gstin'] ?: 'Unregistered') ?></span><br>
                <strong>State:</strong> <?= htmlspecialchars($invoice['customer_state'] ?: '-') ?> (Code: <?= htmlspecialchars($invoice['customer_state_code'] ?: '-') ?>) &bull; 
                <strong>Phone:</strong> <?= htmlspecialchars($invoice['customer_mobile'] ?: 'N/A') ?>
            </div>
        </div>
    </div>

    <!-- Items Table -->
    <table class="w-100 tax-table mb-3">
        <thead>
            <tr class="text-center">
                <th style="width: 4%;">#</th>
                <th style="width: 32%;" class="text-start">Description of Goods / Services</th>
                <th style="width: 10%;">HSN/SAC</th>
                <th style="width: 8%;">Qty</th>
                <th style="width: 7%;">Unit</th>
                <th style="width: 11%;" class="text-end">Rate (₹)</th>
                <th style="width: 11%;" class="text-end">Taxable (₹)</th>
                <th style="width: 6%;">GST %</th>
                <th style="width: 11%;" class="text-end">Total (₹)</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($items as $idx => $it): ?>
                <tr>
                    <td class="text-center"><?= $idx + 1 ?></td>
                    <td class="text-start">
                        <div class="fw-bold text-dark"><?= htmlspecialchars($it['product_name']) ?></div>
                    </td>
                    <td class="text-center font-monospace small"><?= htmlspecialchars($it['hsn_sac'] ?: '-') ?></td>
                    <td class="text-center"><?= (float)$it['quantity'] ?></td>
                    <td class="text-center"><?= htmlspecialchars($it['unit']) ?></td>
                    <td class="text-end"><?= number_format((float)$it['rate'], 2) ?></td>
                    <td class="text-end"><?= number_format((float)$it['taxable_amount'], 2) ?></td>
                    <td class="text-center"><?= (float)$it['gst_rate'] ?>%</td>
                    <td class="text-end fw-bold"><?= number_format((float)$it['total'], 2) ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
        <tfoot>
            <tr class="fw-bold bg-light">
                <td colspan="6" class="text-end">Total Taxable Value:</td>
                <td class="text-end"><?= number_format((float)$invoice['taxable_amount'], 2) ?></td>
                <td></td>
                <td class="text-end"><?= number_format((float)$invoice['subtotal'], 2) ?></td>
            </tr>
        </tfoot>
    </table>

    <!-- GST Tax Breakdown Table by HSN/SAC -->
    <div class="fw-bold small text-uppercase mb-1">GST Tax Breakdown (HSN/SAC Summary):</div>
    <table class="w-100 tax-table mb-3 small">
        <thead>
            <tr class="text-center">
                <th rowspan="2" style="width: 15%;">HSN/SAC</th>
                <th rowspan="2" style="width: 17%;" class="text-end">Taxable Value (₹)</th>
                <th colspan="2" style="width: 22%;">Central Tax (CGST)</th>
                <th colspan="2" style="width: 22%;">State Tax (SGST)</th>
                <th colspan="2" style="width: 24%;">Integrated Tax (IGST)</th>
            </tr>
            <tr class="text-center">
                <th style="width: 8%;">Rate</th>
                <th style="width: 14%;" class="text-end">Amount (₹)</th>
                <th style="width: 8%;">Rate</th>
                <th style="width: 14%;" class="text-end">Amount (₹)</th>
                <th style="width: 8%;">Rate</th>
                <th style="width: 16%;" class="text-end">Amount (₹)</th>
            </tr>
        </thead>
        <tbody>
            <?php 
                $sum_taxable = 0;
                $sum_cgst = 0;
                $sum_sgst = 0;
                $sum_igst = 0;
            ?>
            <?php foreach ($hsn_summary as $hsn => $s): ?>
                <?php 
                    $half_rate = (float)$s['gst_rate'] / 2;
                    $sum_taxable += $s['taxable_amount'];
                    $sum_cgst += $s['cgst_amount'];
                    $sum_sgst += $s['sgst_amount'];
                    $sum_igst += $s['igst_amount'];
                ?>
                <tr>
                    <td class="text-center font-monospace"><?= htmlspecialchars($hsn) ?></td>
                    <td class="text-end"><?= number_format($s['taxable_amount'], 2) ?></td>
                    <td class="text-center"><?= $s['cgst_amount'] > 0 ? $half_rate . '%' : '-' ?></td>
                    <td class="text-end"><?= number_format($s['cgst_amount'], 2) ?></td>
                    <td class="text-center"><?= $s['sgst_amount'] > 0 ? $half_rate . '%' : '-' ?></td>
                    <td class="text-end"><?= number_format($s['sgst_amount'], 2) ?></td>
                    <td class="text-center"><?= $s['igst_amount'] > 0 ? (float)$s['gst_rate'] . '%' : '-' ?></td>
                    <td class="text-end"><?= number_format($s['igst_amount'], 2) ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
        <tfoot class="fw-bold bg-light">
            <tr>
                <td class="text-center">Total:</td>
                <td class="text-end"><?= number_format($sum_taxable, 2) ?></td>
                <td></td>
                <td class="text-end"><?= number_format($sum_cgst, 2) ?></td>
                <td></td>
                <td class="text-end"><?= number_format($sum_sgst, 2) ?></td>
                <td></td>
                <td class="text-end"><?= number_format($sum_igst, 2) ?></td>
            </tr>
        </tfoot>
    </table>

    <!-- Totals & Payment Summary Grid -->
    <div class="row border border-dark mb-3">
        <!-- Amount in Words & Bank Details -->
        <div class="col-7 border-end border-dark p-2">
            <div class="mb-2">
                <span class="text-muted small fw-bold">Invoice Value in Words:</span><br>
                <strong class="text-dark"><?= numberToWordsIndian($invoice['grand_total']) ?></strong>
            </div>

            <div class="border-top pt-2 mt-2">
                <span class="text-muted small fw-bold text-uppercase d-block mb-1">Company Bank Details for Payment:</span>
                <table class="small w-100">
                    <tr>
                        <td class="text-muted" style="width: 35%;">Bank Name:</td>
                        <td class="fw-bold"><?= htmlspecialchars($company['bank_name'] ?: 'N/A') ?></td>
                    </tr>
                    <tr>
                        <td class="text-muted">Account Number:</td>
                        <td class="font-monospace fw-bold"><?= htmlspecialchars($company['account_number'] ?: 'N/A') ?></td>
                    </tr>
                    <tr>
                        <td class="text-muted">IFSC Code:</td>
                        <td class="font-monospace fw-bold"><?= htmlspecialchars($company['ifsc'] ?: 'N/A') ?></td>
                    </tr>
                    <tr>
                        <td class="text-muted">UPI ID / VPA:</td>
                        <td class="font-monospace fw-bold text-primary"><?= htmlspecialchars($company['upi_id'] ?: 'N/A') ?></td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Grand Total Calculation Box -->
        <div class="col-5 p-2">
            <table class="w-100 small">
                <tr>
                    <td class="py-1 text-muted">Taxable Value:</td>
                    <td class="py-1 text-end font-monospace"><?= number_format((float)$invoice['taxable_amount'], 2) ?></td>
                </tr>
                <?php if ((float)$invoice['cgst'] > 0): ?>
                    <tr>
                        <td class="py-1 text-muted">Central GST (CGST):</td>
                        <td class="py-1 text-end font-monospace"><?= number_format((float)$invoice['cgst'], 2) ?></td>
                    </tr>
                    <tr>
                        <td class="py-1 text-muted">State GST (SGST):</td>
                        <td class="py-1 text-end font-monospace"><?= number_format((float)$invoice['sgst'], 2) ?></td>
                    </tr>
                <?php endif; ?>
                <?php if ((float)$invoice['igst'] > 0): ?>
                    <tr>
                        <td class="py-1 text-muted">Integrated GST (IGST):</td>
                        <td class="py-1 text-end font-monospace"><?= number_format((float)$invoice['igst'], 2) ?></td>
                    </tr>
                <?php endif; ?>
                <?php if ((float)$invoice['discount'] > 0): ?>
                    <tr>
                        <td class="py-1 text-danger">Discount:</td>
                        <td class="py-1 text-end font-monospace text-danger">-<?= number_format((float)$invoice['discount'], 2) ?></td>
                    </tr>
                <?php endif; ?>
                <?php if ((float)$invoice['round_off'] != 0): ?>
                    <tr>
                        <td class="py-1 text-muted">Round Off:</td>
                        <td class="py-1 text-end font-monospace"><?= ((float)$invoice['round_off'] > 0 ? '+' : '') . number_format((float)$invoice['round_off'], 2) ?></td>
                    </tr>
                <?php endif; ?>
                <tr class="border-top border-dark fw-bold fs-6">
                    <td class="py-2">Grand Total (₹):</td>
                    <td class="py-2 text-end font-monospace"><?= number_format((float)$invoice['grand_total'], 2) ?></td>
                </tr>
            </table>
        </div>
    </div>

    <!-- Terms & Signature Footer -->
    <div class="row pt-2 align-items-end">
        <div class="col-7 small">
            <strong>Terms & Conditions:</strong>
            <p class="mb-0 text-muted" style="font-size: 11px;">
                <?= nl2br(htmlspecialchars($invoice['terms_conditions'] ?: '1. Goods once sold will not be taken back or exchanged. 2. All disputes subject to local jurisdiction.')) ?>
            </p>
        </div>
        <div class="col-5 text-end">
            <div class="small fw-bold text-uppercase mb-5">
                For <?= htmlspecialchars($company['authorized_signatory'] ?: ($company['company_name'] ?? 'SmartBill')) ?>
            </div>
            <div class="border-top border-dark d-inline-block pt-1 px-4 text-center">
                <span class="small text-muted">Authorized Signatory</span>
            </div>
        </div>
    </div>
</div>

<?php if ($auto_print): ?>
<script>
window.addEventListener('load', () => {
    window.print();
});
</script>
<?php endif; ?>

</body>
</html>
