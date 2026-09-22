# SmartBill - Production-Ready Web-Based Billing & GST Invoice Software

SmartBill is a complete, enterprise-grade, web-based Billing, Inventory, and GST Invoicing software engineered specifically for seamless deployment on **Hostinger Shared Hosting** (cPanel / hPanel) with **PHP 8+** and **MySQL**.

---

## 🚀 Key Features

1. **Secure Multi-User Authentication & RBAC**:
   - Role-Based Access Control (`admin` with full system control, `staff` for everyday billing operations).
   - Password hashing with `password_hash()` and `password_verify()`.
   - Session authentication, timeout handling, and CSRF token protection on every state-changing form.

2. **GST Compliant Invoicing**:
   - Automated detection of **Intra-state** (CGST + SGST) vs. **Inter-state** (IGST) taxation based on Place of Supply.
   - Support for 0%, 5%, 12%, 18%, and 28% GST tax slabs.
   - HSN/SAC code tracking for GSTR-1 Table 12 compliance.
   - Clean professional **A4 printable invoice** layout with bank details, terms, authorized signature, and GST breakdown.
   - Instant WhatsApp invoice sharing link with pre-formatted greeting message.

3. **Inventory & Real-Time Stock Management**:
   - Automated stock deduction on invoice generation.
   - Automated stock restoration on invoice cancellation/deletion.
   - Inward purchase bill logging with automatic inventory replenishment.
   - Stock movement ledger tracking every movement (`sale`, `purchase`, `adjustment`, `invoice_delete`).
   - Manual stock adjustments (Add/Reduce) with reason notes.
   - Low stock warning badges and zero-stock alerts.

4. **Payments & Receivables Ledger**:
   - Partial payment collection against invoices.
   - Outstanding balance recalculation and status tracking (`Paid`, `Partially Paid`, `Unpaid`).
   - Thermal/A4 Payment Receipt vouchers with print support.
   - WhatsApp payment reminders with dynamic customer balances and due dates.

5. **Vendor & Purchase Management**:
   - Complete supplier directory with GSTIN and payment terms.
   - Inward vendor purchase bills recording with Input Tax Credit (ITC) tracking.

6. **Operational Expense Management**:
   - Categorized overhead tracking (Rent, Electricity, Salaries, Supplies, Maintenance, Travel, etc.).
   - Monthly and date-filtered expense summaries.

7. **Financial & GST Returns Reports**:
   - **Sales Report**: Filter by customer and date range with 1-click CSV export.
   - **GST Tax Report**: Output tax liabilities (CGST, SGST, IGST) and HSN chapter summary table.
   - **Purchase Report**: Vendor procurement ledger and ITC totals.
   - **Outstanding Receivables & Aging**: 0-30 days, 31-60 days, and 60+ days overdue buckets.
   - **Stock Valuation**: Total asset value at cost price vs retail potential value.
   - **Profit & Loss Statement**: Real-time Gross Trading Profit and Net Profit statement.

8. **Unified Global Search**:
   - Instant multi-entity search across Invoices, Customers, Products, SKUs, HSNs, and Suppliers.

---

## 🛠 Technology Stack

- **Backend**: PHP 8.0 / 8.1 / 8.2 / 8.3
- **Database**: MySQL 5.7+ / MariaDB 10.3+ with PDO Prepared Statements
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5.3, Font Awesome 6.4, Chart.js 4.4
- **No external server runtime required** — completely native PHP without Node.js, Python, or Composer dependencies.

---

## 📦 Hostinger Deployment Guide (Quick Start)

### Step 1: Create MySQL Database in Hostinger
1. Log into your **Hostinger hPanel** (or cPanel).
2. Go to **Databases** &rarr; **Management**.
3. Create a new MySQL database:
   - Database Name: `u123456789_smartbill`
   - Username: `u123456789_billuser`
   - Password: `YourSecurePassword123!`
4. Click **Create**.

### Step 2: Import Database Schema
1. In hPanel, click **Enter phpMyAdmin** next to your newly created database.
2. Click the **Import** tab at the top.
3. Choose the `database.sql` file located in the SmartBill root directory.
4. Click **Go** / **Import**. All tables, sample products, categories, and the default admin user will be created.

### Step 3: Upload Files to `public_html`
1. In Hostinger hPanel, open **File Manager**.
2. Navigate to your website's root folder: `public_html/` (or a subdirectory like `public_html/billing/`).
3. Upload all project files and folders:
   - `config/`
   - `includes/`
   - `assets/`
   - `customers/`
   - `suppliers/`
   - `categories/`
   - `products/`
   - `invoices/`
   - `payments/`
   - `purchases/`
   - `expenses/`
   - `reports/`
   - `users/`
   - `uploads/`
   - `index.php`, `login.php`, `logout.php`, `dashboard.php`, `search.php`, `company_profile.php`, `change_password.php`, `.htaccess`

### Step 4: Configure Database Credentials
1. In Hostinger File Manager, open `config/database.php`.
2. Update the credentials with the values you created in Step 1:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'u123456789_billuser');
   define('DB_PASS', 'YourSecurePassword123!');
   define('DB_NAME', 'u123456789_smartbill');
   define('DB_PORT', '3306');
   ```
3. Save the file.

### Step 5: Verify Permissions
Ensure the `uploads/` directory has write permissions (`755` or `775`) so company logos can be uploaded.

---

## 🔑 Default Login Credentials

After importing `database.sql`:

- **URL**: `https://yourdomain.com/login.php`
- **Email**: `admin@smartbill.com`
- **Password**: `admin123`

> **Security Note**: Immediately after logging in for the first time, go to the top-right profile dropdown and select **Change Password** to set your own password.

---

## 📂 Directory Structure

```text
├── .htaccess                   # Apache security rules & Gzip compression
├── database.sql                # Complete database schema & seed data
├── index.php                   # Entry route redirecting to dashboard or login
├── login.php                   # Authentication screen
├── logout.php                  # Session destruction
├── dashboard.php               # KPI cards, revenue charts, and quick actions
├── company_profile.php         # Business settings, GSTIN, bank details, logo
├── change_password.php         # User credential updates
├── search.php                  # Global multi-entity search
├── config/
│   └── database.php            # PDO connection & site settings
├── includes/
│   ├── auth_check.php          # Session validation & RBAC middleware
│   ├── helpers.php             # Currency formatting, CSRF, stock utilities
│   ├── header.php              # Responsive sidebar, navigation, search bar
│   └── footer.php              # Scripts, modal definitions, closing tags
├── assets/
│   └── css/
│       └── style.css           # Custom styles & A4 invoice print CSS
├── customers/                  # Customers CRUD & transaction ledger
├── suppliers/                  # Vendors & supplier ledger
├── categories/                 # Product category taxonomy
├── products/                   # Inventory catalog, adjustments, history
├── invoices/                   # GST Invoicing, A4 print, WhatsApp share
├── payments/                   # Payment recording & receipts
├── purchases/                  # Inward vendor bills & stock replenishment
├── expenses/                   # Operational expense management
├── reports/                    # Sales, GST, P&L, Stock, Outstanding
├── users/                      # User management & staff permissioning
└── uploads/                    # Company logo uploads directory
```

---

## 🛡️ Security Best Practices Included

- **SQL Injection Prevention**: 100% of SQL queries utilize PDO prepared statements with bound parameters.
- **XSS Protection**: All user-supplied output rendered in templates is sanitized via `htmlspecialchars()`.
- **CSRF Token Guard**: Every POST operation validates a session-bound cryptographic CSRF token.
- **Session Security**: Cookies set with `httponly`, `samesite=Lax`, and `use_strict_mode`.
- **Password Hashing**: Industry-standard `PASSWORD_DEFAULT` algorithm via `password_hash()`.
