-- =======================================================
-- SmartBill - Complete MySQL Database Schema
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10+
-- Direct import for Hostinger phpMyAdmin
-- =======================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table: users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'manager', 'staff') DEFAULT 'admin',
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: company_settings
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `company_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `company_name` VARCHAR(200) NOT NULL DEFAULT 'SmartBill Enterprises',
  `legal_name` VARCHAR(200) DEFAULT 'SmartBill Solutions Private Limited',
  `address` TEXT DEFAULT 'Plot No. 42, Tech City Road, Cyber Square',
  `city` VARCHAR(100) DEFAULT 'Mumbai',
  `state` VARCHAR(100) DEFAULT 'Maharashtra',
  `pin_code` VARCHAR(20) DEFAULT '400001',
  `mobile` VARCHAR(20) DEFAULT '+91 98765 43210',
  `email` VARCHAR(150) DEFAULT 'contact@smartbill.com',
  `gstin` VARCHAR(30) DEFAULT '27AABCS1429B1Z5',
  `pan` VARCHAR(30) DEFAULT 'AABCS1429B',
  `state_code` VARCHAR(10) DEFAULT '27',
  `logo` VARCHAR(255) DEFAULT NULL,
  `invoice_prefix` VARCHAR(20) DEFAULT 'INV-2026',
  `starting_invoice_number` INT DEFAULT 1001,
  `bank_name` VARCHAR(150) DEFAULT 'HDFC Bank Ltd',
  `account_number` VARCHAR(50) DEFAULT '50200012345678',
  `ifsc` VARCHAR(30) DEFAULT 'HDFC0001234',
  `upi_id` VARCHAR(100) DEFAULT 'smartbill@hdfcbank',
  `terms_conditions` TEXT DEFAULT '1. Goods once sold will not be taken back or exchanged.\n2. All disputes subject to local jurisdiction only.\n3. Interest @ 18% p.a. will be charged if payment is not made within due date.',
  `authorized_signatory` VARCHAR(150) DEFAULT 'For SmartBill Solutions Pvt Ltd',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: categories
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: customers
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `business_name` VARCHAR(200) DEFAULT NULL,
  `mobile` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `billing_address` TEXT DEFAULT NULL,
  `shipping_address` TEXT DEFAULT NULL,
  `gstin` VARCHAR(30) DEFAULT NULL,
  `pan` VARCHAR(30) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT 'Maharashtra',
  `state_code` VARCHAR(10) DEFAULT '27',
  `customer_type` ENUM('Registered', 'Unregistered', 'Composition', 'Consumer') DEFAULT 'Registered',
  `opening_balance` DECIMAL(12,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: suppliers
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `business_name` VARCHAR(200) DEFAULT NULL,
  `mobile` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `gstin` VARCHAR(30) DEFAULT NULL,
  `pan` VARCHAR(30) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT 'Maharashtra',
  `state_code` VARCHAR(10) DEFAULT '27',
  `opening_balance` DECIMAL(12,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: products
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `sku` VARCHAR(100) UNIQUE DEFAULT NULL,
  `barcode` VARCHAR(100) DEFAULT NULL,
  `category_id` INT DEFAULT NULL,
  `hsn_sac` VARCHAR(50) DEFAULT NULL,
  `unit` VARCHAR(20) DEFAULT 'PCS',
  `purchase_price` DECIMAL(12,2) DEFAULT 0.00,
  `selling_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `mrp` DECIMAL(12,2) DEFAULT 0.00,
  `gst_rate` DECIMAL(5,2) DEFAULT 18.00,
  `opening_stock` DECIMAL(12,2) DEFAULT 0.00,
  `current_stock` DECIMAL(12,2) DEFAULT 0.00,
  `minimum_stock` DECIMAL(12,2) DEFAULT 5.00,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category_id`),
  INDEX `idx_sku` (`sku`),
  INDEX `idx_barcode` (`barcode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: invoices
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(50) NOT NULL UNIQUE,
  `invoice_date` DATE NOT NULL,
  `customer_id` INT NOT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_gstin` VARCHAR(30) DEFAULT NULL,
  `customer_address` TEXT DEFAULT NULL,
  `place_of_supply` VARCHAR(100) DEFAULT NULL,
  `subtotal` DECIMAL(12,2) DEFAULT 0.00,
  `discount` DECIMAL(12,2) DEFAULT 0.00,
  `taxable_amount` DECIMAL(12,2) DEFAULT 0.00,
  `cgst` DECIMAL(12,2) DEFAULT 0.00,
  `sgst` DECIMAL(12,2) DEFAULT 0.00,
  `igst` DECIMAL(12,2) DEFAULT 0.00,
  `grand_total` DECIMAL(12,2) DEFAULT 0.00,
  `paid_amount` DECIMAL(12,2) DEFAULT 0.00,
  `outstanding_amount` DECIMAL(12,2) DEFAULT 0.00,
  `status` ENUM('Paid', 'Partially Paid', 'Unpaid') DEFAULT 'Unpaid',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_invoice_date` (`invoice_date`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: invoice_items
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `product_id` INT DEFAULT NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `hsn_sac` VARCHAR(50) DEFAULT NULL,
  `quantity` DECIMAL(12,2) NOT NULL DEFAULT 1.00,
  `unit` VARCHAR(20) DEFAULT 'PCS',
  `rate` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(12,2) DEFAULT 0.00,
  `taxable_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `gst_rate` DECIMAL(5,2) DEFAULT 18.00,
  `cgst` DECIMAL(12,2) DEFAULT 0.00,
  `sgst` DECIMAL(12,2) DEFAULT 0.00,
  `igst` DECIMAL(12,2) DEFAULT 0.00,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  INDEX `idx_invoice` (`invoice_id`),
  INDEX `idx_product` (`product_id`),
  CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: payments
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_date` DATE NOT NULL,
  `customer_id` INT NOT NULL,
  `invoice_id` INT DEFAULT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_method` ENUM('Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other') DEFAULT 'Cash',
  `reference_number` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_payment_customer` (`customer_id`),
  INDEX `idx_payment_invoice` (`invoice_id`),
  INDEX `idx_payment_date` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: purchases
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_number` VARCHAR(50) NOT NULL,
  `supplier_id` INT DEFAULT NULL,
  `supplier_bill_number` VARCHAR(100) DEFAULT NULL,
  `purchase_date` DATE NOT NULL,
  `subtotal` DECIMAL(12,2) DEFAULT 0.00,
  `tax_amount` DECIMAL(12,2) DEFAULT 0.00,
  `grand_total` DECIMAL(12,2) DEFAULT 0.00,
  `payment_status` ENUM('Paid', 'Unpaid') DEFAULT 'Paid',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_supplier` (`supplier_id`),
  INDEX `idx_purchase_date` (`purchase_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: purchase_items
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_id` INT NOT NULL,
  `product_id` INT DEFAULT NULL,
  `quantity` DECIMAL(12,2) NOT NULL DEFAULT 1.00,
  `purchase_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `gst_rate` DECIMAL(5,2) DEFAULT 18.00,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  INDEX `idx_purchase` (`purchase_id`),
  CONSTRAINT `fk_purchase_items_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: expenses
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category` VARCHAR(100) NOT NULL DEFAULT 'Other',
  `expense_date` DATE NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) DEFAULT 'Cash',
  `reference_number` VARCHAR(100) DEFAULT NULL,
  `description` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_expense_cat` (`category`),
  INDEX `idx_expense_date` (`expense_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: stock_movements
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `movement_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `product_id` INT NOT NULL,
  `type` ENUM('Stock In', 'Stock Out', 'Stock Adjustment', 'Opening Stock', 'Sale', 'Purchase') NOT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `reference` VARCHAR(100) DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_stock_product` (`product_id`),
  INDEX `idx_stock_date` (`movement_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- SEED INITIAL DATA
-- --------------------------------------------------------

-- Default Admin Account: admin@smartbill.com / admin123
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `status`) 
VALUES (1, 'Admin User', 'admin@smartbill.com', '$2y$10$46h2nMpjfOdUhKTh021kbuuJYcCObZERTQ0PXsYDHuXRLC15uCFle', 'admin', 'active')
ON DUPLICATE KEY UPDATE `email`=`email`;

-- Default Company Settings
INSERT INTO `company_settings` (`id`, `company_name`, `legal_name`, `address`, `city`, `state`, `pin_code`, `mobile`, `email`, `gstin`, `pan`, `state_code`, `invoice_prefix`, `starting_invoice_number`, `bank_name`, `account_number`, `ifsc`, `upi_id`, `terms_conditions`, `authorized_signatory`)
VALUES (1, 'SmartBill Infotech', 'SmartBill Technologies Private Limited', 'Office No. 504, Business Park, S.V. Road', 'Mumbai', 'Maharashtra', '400053', '+91 98200 12345', 'billing@smartbill.in', '27AABCS1429B1Z5', 'AABCS1429B', '27', 'INV-2026', 1001, 'State Bank of India', '38491029384', 'SBIN0001234', 'smartbill@sbi', '1. Goods once sold will not be taken back or exchanged.\n2. Payments must be cleared within 15 days of invoice generation.\n3. All disputes are subject to Mumbai Jurisdiction.', 'For SmartBill Technologies Pvt Ltd')
ON DUPLICATE KEY UPDATE `company_name`=`company_name`;

-- Default Product Categories
INSERT INTO `categories` (`id`, `name`, `description`) VALUES
(1, 'Electronics & Hardware', 'Computer parts, peripherals, and electronic items'),
(2, 'Office Supplies & Stationery', 'Paper, pens, files, registers, and office stationery'),
(3, 'Services & Consulting', 'GST consulting, IT support, installation charges'),
(4, 'Packaging Materials', 'Corrugated boxes, bubble wraps, tapes, plastic pouches')
ON DUPLICATE KEY UPDATE `name`=`name`;

-- Default Expense Categories
INSERT INTO `expense_categories` (`id`, `name`) VALUES
(1, 'Rent'),
(2, 'Salary'),
(3, 'Electricity'),
(4, 'Transport'),
(5, 'Marketing'),
(6, 'Internet & Telecom'),
(7, 'Office Expense'),
(8, 'Other')
ON DUPLICATE KEY UPDATE `name`=`name`;

-- Default Customers (Registered & Unregistered)
INSERT INTO `customers` (`id`, `name`, `business_name`, `mobile`, `email`, `billing_address`, `shipping_address`, `gstin`, `pan`, `state`, `state_code`, `customer_type`, `opening_balance`) VALUES
(1, 'Rajesh Sharma', 'Apex Traders', '9821098210', 'rajesh@apextraders.com', 'Shop 12, Market Yard, Pune', 'Shop 12, Market Yard, Pune', '27AADCA1234A1Z1', 'AADCA1234A', 'Maharashtra', '27', 'Registered', 0.00),
(2, 'Sunil Patel', 'Gujarat Hardware Mart', '9898012345', 'sunil@gujharware.in', 'Near Ring Road, Surat', 'Near Ring Road, Surat', '24AABCP5678B1Z2', 'AABCP5678B', 'Gujarat', '24', 'Registered', 0.00),
(3, 'Amit Verma', 'Verma Enterprises', '9811234567', 'amit@vermaent.com', 'Sector 18, Noida', 'Sector 18, Noida', '09ABCDE1234F1Z5', 'ABCDE1234F', 'Uttar Pradesh', '09', 'Registered', 0.00),
(4, 'Vikram Malhotra', 'Local Retail Buyer', '9876500001', 'vikram@gmail.com', 'Andheri West, Mumbai', 'Andheri West, Mumbai', '', '', 'Maharashtra', '27', 'Consumer', 0.00)
ON DUPLICATE KEY UPDATE `name`=`name`;

-- Default Suppliers
INSERT INTO `suppliers` (`id`, `name`, `business_name`, `mobile`, `email`, `address`, `gstin`, `pan`, `state`, `state_code`, `opening_balance`) VALUES
(1, 'National Tech Distributors', 'National Tech Dist Ltd', '9833011223', 'sales@nationaltech.com', 'Lamington Road, Mumbai', '27AABCN8899K1Z4', 'AABCN8899K', 'Maharashtra', '27', 0.00),
(2, 'Global Impex Goods', 'Global Impex Corp', '9844055667', 'orders@globalimpex.in', 'Gandhinagar GIDC, Gujarat', '24AABCG3344J1Z8', 'AABCG3344J', 'Gujarat', '24', 0.00)
ON DUPLICATE KEY UPDATE `name`=`name`;

-- Default Products
INSERT INTO `products` (`id`, `name`, `sku`, `barcode`, `category_id`, `hsn_sac`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst_rate`, `opening_stock`, `current_stock`, `minimum_stock`, `description`) VALUES
(1, 'Wireless Optical Mouse', 'ELEC-MOU-01', '8901234567890', 1, '8471', 'PCS', 320.00, 550.00, 699.00, 18.00, 25.00, 25.00, 5.00, '2.4GHz ergonomically designed wireless mouse'),
(2, 'Mechanical USB Keyboard', 'ELEC-KEY-02', '8901234567891', 1, '8471', 'PCS', 1200.00, 1850.00, 2200.00, 18.00, 15.00, 15.00, 4.00, 'RGB Backlit mechanical keyboard with blue switches'),
(3, 'A4 Copy Paper Ream 75 GSM (500 Sheets)', 'STAT-PPR-01', '8901234567892', 2, '4802', 'BOX', 190.00, 280.00, 320.00, 12.00, 50.00, 50.00, 10.00, 'Premium brightness 75 GSM xerox / laser paper'),
(4, 'Fast Charging USB-C Cable (1.5m)', 'ELEC-CAB-01', '8901234567893', 1, '8544', 'PCS', 95.00, 220.00, 299.00, 18.00, 40.00, 40.00, 8.00, 'Braided 65W fast data and charging cord'),
(5, 'Annual GST Billing & ERP Support', 'SERV-GST-01', '', 3, '9983', 'SET', 2500.00, 5000.00, 5000.00, 18.00, 999.00, 999.00, 0.00, 'Comprehensive annual maintenance and GST return support')
ON DUPLICATE KEY UPDATE `name`=`name`;

-- Default Invoices & Items for Instant Working Dashboard Statistics
INSERT INTO `invoices` (`id`, `invoice_number`, `invoice_date`, `customer_id`, `customer_name`, `customer_gstin`, `customer_address`, `place_of_supply`, `subtotal`, `discount`, `taxable_amount`, `cgst`, `sgst`, `igst`, `grand_total`, `paid_amount`, `outstanding_amount`, `status`, `notes`) VALUES
(1, 'INV-2026-1001', CURDATE(), 1, 'Rajesh Sharma (Apex Traders)', '27AADCA1234A1Z1', 'Shop 12, Market Yard, Pune', 'Maharashtra (27)', 3700.00, 100.00, 3600.00, 324.00, 324.00, 0.00, 4248.00, 4248.00, 0.00, 'Paid', 'Delivered via Express Courier'),
(2, 'INV-2026-1002', CURDATE(), 2, 'Sunil Patel (Gujarat Hardware Mart)', '24AABCP5678B1Z2', 'Near Ring Road, Surat', 'Gujarat (24)', 2800.00, 0.00, 2800.00, 0.00, 0.00, 336.00, 3136.00, 1000.00, 2136.00, 'Partially Paid', 'Payment balance due in 7 days')
ON DUPLICATE KEY UPDATE `invoice_number`=`invoice_number`;

INSERT INTO `invoice_items` (`id`, `invoice_id`, `product_id`, `product_name`, `hsn_sac`, `quantity`, `unit`, `rate`, `discount`, `taxable_amount`, `gst_rate`, `cgst`, `sgst`, `igst`, `total`) VALUES
(1, 1, 1, 'Wireless Optical Mouse', '8471', 2.00, 'PCS', 550.00, 0.00, 1100.00, 18.00, 99.00, 99.00, 0.00, 1298.00),
(2, 1, 2, 'Mechanical USB Keyboard', '8471', 1.00, 'PCS', 1850.00, 100.00, 1750.00, 18.00, 157.50, 157.50, 0.00, 2065.00),
(3, 1, 3, 'A4 Copy Paper Ream 75 GSM (500 Sheets)', '4802', 3.00, 'BOX', 280.00, 0.00, 840.00, 12.00, 50.40, 50.40, 0.00, 940.80),
(4, 2, 3, 'A4 Copy Paper Ream 75 GSM (500 Sheets)', '4802', 10.00, 'BOX', 280.00, 0.00, 2800.00, 12.00, 0.00, 0.00, 336.00, 3136.00)
ON DUPLICATE KEY UPDATE `invoice_id`=`invoice_id`;

INSERT INTO `payments` (`id`, `payment_date`, `customer_id`, `invoice_id`, `amount`, `payment_method`, `reference_number`, `notes`) VALUES
(1, CURDATE(), 1, 1, 4248.00, 'UPI', 'UPI/2026/894819028', 'Full payment received via PhonePe'),
(2, CURDATE(), 2, 2, 1000.00, 'Bank Transfer', 'NEFT-SBIN20260901', 'Advance token received')
ON DUPLICATE KEY UPDATE `invoice_id`=`invoice_id`;

INSERT INTO `purchases` (`id`, `purchase_number`, `supplier_id`, `supplier_bill_number`, `purchase_date`, `subtotal`, `tax_amount`, `grand_total`, `payment_status`, `notes`) VALUES
(1, 'PUR-2026-0001', 1, 'NT-2026-88', CURDATE(), 6400.00, 1152.00, 7552.00, 'Paid', 'Initial stock replenishment')
ON DUPLICATE KEY UPDATE `purchase_number`=`purchase_number`;

INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `gst_rate`, `total`) VALUES
(1, 1, 1, 20.00, 320.00, 18.00, 7552.00)
ON DUPLICATE KEY UPDATE `purchase_id`=`purchase_id`;

INSERT INTO `expenses` (`id`, `expense_date`, `category`, `description`, `amount`, `payment_method`, `reference_number`) VALUES
(1, CURDATE(), 'Internet & Phone', 'High-speed Fiber Internet Bill', 1499.00, 'UPI', 'AIRTEL-JAN-26'),
(2, CURDATE(), 'Tea & Snacks', 'Office Refreshments & Staff Pantry', 450.00, 'Cash', 'VOUCH-001')
ON DUPLICATE KEY UPDATE `description`=`description`;

COMMIT;
