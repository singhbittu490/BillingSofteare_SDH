<?php
/**
 * SmartBill - Database Configuration & PDO Connection
 * Optimized for Hostinger Shared Hosting (cPanel / hPanel)
 */

// Prevent direct access
defined('SMARTBILL_ACCESS') or define('SMARTBILL_ACCESS', true);

// =========================================================================
// HOSTINGER DATABASE CONFIGURATION
// Replace the values below with your Hostinger MySQL database details:
// =========================================================================
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'smartbill';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
$db_port = getenv('DB_PORT') ?: '3306';
$charset = 'utf8mb4';

// Database options
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE utf8mb4_unicode_ci"
];

$dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset={$charset}";

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
} catch (PDOException $e) {
    // If connection failed, show clean user-friendly diagnostic
    $error_msg = $e->getMessage();
    die('
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Database Connection Error - SmartBill</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    </head>
    <body class="bg-light py-5">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-7">
                    <div class="card shadow-sm border-danger border-top border-4">
                        <div class="card-body p-4 text-center">
                            <i class="fa-solid fa-triangle-exclamation text-danger fa-3x mb-3"></i>
                            <h4 class="card-title text-danger fw-bold">Database Connection Failed</h4>
                            <p class="text-muted">SmartBill could not connect to your MySQL database on Hostinger.</p>
                            
                            <div class="alert alert-secondary text-start font-monospace small">
                                ' . htmlspecialchars($error_msg) . '
                            </div>

                            <div class="card bg-light border-0 text-start p-3 mb-3">
                                <h6 class="fw-bold"><i class="fa-solid fa-circle-info text-primary me-2"></i>Quick Hostinger Fix Checklist:</h6>
                                <ol class="small mb-0 ps-3">
                                    <li>Ensure you created a MySQL database in <strong>Hostinger hPanel &rarr; Databases</strong>.</li>
                                    <li>Check that you assigned a user to that database with <strong>All Privileges</strong>.</li>
                                    <li>Import <code>database.sql</code> using <strong>phpMyAdmin</strong>.</li>
                                    <li>Open <code>config/database.php</code> and verify DB name, user, and password.</li>
                                </ol>
                            </div>

                            <a href="index.php" class="btn btn-primary px-4">
                                <i class="fa-solid fa-rotate-right me-1"></i> Retry Connection
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    ');
}

/**
 * Helper function to retrieve database connection instance
 */
function getDB() {
    global $pdo;
    return $pdo;
}
