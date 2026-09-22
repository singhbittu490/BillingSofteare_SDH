<?php
/**
 * SmartBill - Common Utility Functions
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Clean and sanitize string inputs
 */
function clean($data) {
    if (is_array($data)) {
        return array_map('clean', $data);
    }
    return htmlspecialchars(trim((string)$data), ENT_QUOTES, 'UTF-8');
}

/**
 * Format currency in Indian Rupees format (₹)
 */
function formatCurrency($number) {
    $num = (float)$number;
    return '₹' . number_format($num, 2);
}

/**
 * Format date to standard display
 */
function formatDate($date, $format = 'd M Y') {
    if (empty($date) || $date === '0000-00-00') {
        return '-';
    }
    return date($format, strtotime($date));
}

/**
 * Convert number into Indian currency words (Lakhs & Crores)
 */
function numberToWordsIndian($number) {
    $decimal = round($number - ($no = floor($number)), 2) * 100;
    $hundred = null;
    $digits_length = strlen($no);
    $i = 0;
    $str = [];
    $words = [
        0 => '', 1 => 'One', 2 => 'Two', 3 => 'Three', 4 => 'Four', 5 => 'Five',
        6 => 'Six', 7 => 'Seven', 8 => 'Eight', 9 => 'Nine', 10 => 'Ten',
        11 => 'Eleven', 12 => 'Twelve', 13 => 'Thirteen', 14 => 'Fourteen',
        15 => 'Fifteen', 16 => 'Sixteen', 17 => 'Seventeen', 18 => 'Eighteen',
        19 => 'Nineteen', 20 => 'Twenty', 30 => 'Thirty', 40 => 'Forty',
        50 => 'Fifty', 60 => 'Sixty', 70 => 'Seventy', 80 => 'Eighty',
        90 => 'Ninety'
    ];
    $digits = ['', 'Hundred', 'Thousand', 'Lakh', 'Crore'];

    while ($i < $digits_length) {
        $divider = ($i == 2) ? 10 : 100;
        $number = floor($no % $divider);
        $no = floor($no / $divider);
        $i += ($divider == 10) ? 1 : 2;
        if ($number) {
            $plural = (($counter = count($str)) && $number > 9) ? '' : '';
            $hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
            $str[] = ($number < 21) ? $words[$number] . ' ' . $digits[$counter] . $plural . ' ' . $hundred
                : $words[floor($number / 10) * 10] . ' ' . $words[$number % 10] . ' ' . $digits[$counter] . $plural . ' ' . $hundred;
        } else {
            $str[] = null;
        }
    }

    $Rupees = implode('', array_reverse($str));
    $paise = ($decimal > 0) ? " and " . ($words[$decimal / 10 * 10] ?? '') . " " . ($words[$decimal % 10] ?? '') . ' Paise' : '';
    return trim(($Rupees ? $Rupees . 'Rupees ' : '') . $paise) . ' Only';
}

/**
 * Fetch Company Settings from database
 */
function getCompanySettings($pdo) {
    static $company = null;
    if ($company === null) {
        $stmt = $pdo->query("SELECT * FROM company_settings WHERE id = 1 LIMIT 1");
        $company = $stmt->fetch();
        if (!$company) {
            // Default fallback
            $company = [
                'company_name' => 'SmartBill Enterprises',
                'legal_name' => 'SmartBill Solutions Pvt Ltd',
                'address' => 'Plot 42, Cyber Square',
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'pin_code' => '400001',
                'mobile' => '+91 9876543210',
                'email' => 'contact@smartbill.com',
                'gstin' => '27AABCS1429B1Z5',
                'pan' => 'AABCS1429B',
                'state_code' => '27',
                'invoice_prefix' => 'INV-2026',
                'starting_invoice_number' => 1001,
                'bank_name' => 'HDFC Bank',
                'account_number' => '50200012345678',
                'ifsc' => 'HDFC0001234',
                'upi_id' => 'smartbill@hdfcbank',
                'terms_conditions' => '1. Goods once sold will not be accepted back.\n2. Subject to local jurisdiction.',
                'authorized_signatory' => 'Authorized Signatory',
                'logo' => null
            ];
        }
    }
    return $company;
}

/**
 * Generate Next Sequential Invoice Number
 */
function generateNextInvoiceNumber($pdo) {
    $company = getCompanySettings($pdo);
    $prefix = !empty($company['invoice_prefix']) ? trim($company['invoice_prefix']) : 'INV';
    $startNo = !empty($company['starting_invoice_number']) ? (int)$company['starting_invoice_number'] : 1001;

    // Check highest invoice number currently
    $stmt = $pdo->query("SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1");
    $lastInv = $stmt->fetchColumn();

    if ($lastInv) {
        // Extract numeric suffix
        if (preg_match('/(\d+)$/', $lastInv, $matches)) {
            $nextNum = (int)$matches[1] + 1;
            $padded = str_pad((string)$nextNum, strlen($matches[1]), '0', STR_PAD_LEFT);
            return $prefix . '-' . $padded;
        }
    }

    return $prefix . '-' . $startNo;
}

/**
 * Record stock movement and update product stock
 */
function recordStockMovement($pdo, $productId, $type, $quantity, $reference = '', $userId = null, $notes = '') {
    $qty = (float)$quantity;
    if ($qty == 0) return;

    // 1. Insert into stock_movements
    $stmt = $pdo->prepare("
        INSERT INTO stock_movements (product_id, type, quantity, reference, user_id, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$productId, $type, $qty, $reference, $userId, $notes]);

    // 2. Adjust current_stock on products table
    if (in_array($type, ['Stock In', 'Purchase', 'Stock Adjustment'])) {
        $updateStmt = $pdo->prepare("UPDATE products SET current_stock = current_stock + ? WHERE id = ?");
        $updateStmt->execute([$qty, $productId]);
    } elseif (in_array($type, ['Stock Out', 'Sale'])) {
        $updateStmt = $pdo->prepare("UPDATE products SET current_stock = current_stock - ? WHERE id = ?");
        $updateStmt->execute([$qty, $productId]);
    }
}

/**
 * Session Flash Messages
 */
function setFlash($type, $message) {
    $_SESSION['flash_message'] = [
        'type' => $type, // success, danger, warning, info
        'text' => $message
    ];
}

function displayFlash() {
    if (isset($_SESSION['flash_message'])) {
        $flash = $_SESSION['flash_message'];
        unset($_SESSION['flash_message']);
        $alertClass = 'alert-' . ($flash['type'] === 'error' ? 'danger' : $flash['type']);
        echo '<div class="alert ' . $alertClass . ' alert-dismissible fade show" role="alert">
            <i class="fa-solid fa-circle-info me-2"></i> ' . htmlspecialchars($flash['text']) . '
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>';
    }
}

/**
 * CSRF Protection Helpers
 */
function getCSRFToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * States list in India with official GST State Codes
 */
function getIndianStates() {
    return [
        '01' => 'Jammu and Kashmir',
        '02' => 'Himachal Pradesh',
        '03' => 'Punjab',
        '04' => 'Chandigarh',
        '05' => 'Uttarakhand',
        '06' => 'Haryana',
        '07' => 'Delhi',
        '08' => 'Rajasthan',
        '09' => 'Uttar Pradesh',
        '10' => 'Bihar',
        '11' => 'Sikkim',
        '12' => 'Arunachal Pradesh',
        '13' => 'Nagaland',
        '14' => 'Manipur',
        '15' => 'Mizoram',
        '16' => 'Tripura',
        '17' => 'Meghalaya',
        '18' => 'Assam',
        '19' => 'West Bengal',
        '20' => 'Jharkhand',
        '21' => 'Odisha',
        '22' => 'Chhattisgarh',
        '23' => 'Madhya Pradesh',
        '24' => 'Gujarat',
        '26' => 'Dadra and Nagar Haveli and Daman and Diu',
        '27' => 'Maharashtra',
        '29' => 'Karnataka',
        '30' => 'Goa',
        '31' => 'Lakshadweep',
        '32' => 'Kerala',
        '33' => 'Tamil Nadu',
        '34' => 'Puducherry',
        '35' => 'Andaman and Nicobar Islands',
        '36' => 'Telangana',
        '37' => 'Andhra Pradesh',
        '38' => 'Ladakh'
    ];
}
