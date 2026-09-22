<?php
/**
 * SmartBill - Login Processor
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: ../login.php");
    exit;
}

// 1. Verify CSRF Token
$token = $_POST['csrf_token'] ?? '';
if (!verifyCSRFToken($token)) {
    setFlash('danger', 'Security validation failed (Invalid CSRF token). Please try logging in again.');
    header("Location: ../login.php");
    exit;
}

// 2. Validate input credentials
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = trim($_POST['password'] ?? '');

if (!$email || empty($password)) {
    setFlash('danger', 'Please enter a valid email address and password.');
    header("Location: ../login.php");
    exit;
}

// 3. Query user by email
try {
    $stmt = $pdo->prepare("SELECT id, name, email, password, role, status FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        if ($user['status'] !== 'active') {
            setFlash('danger', 'Your account has been deactivated. Please contact your administrator.');
            header("Location: ../login.php");
            exit;
        }

        // Prevent session fixation
        session_regenerate_id(true);

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $user['role'];

        setFlash('success', 'Welcome back, ' . $user['name'] . '!');
        header("Location: ../dashboard.php");
        exit;
    } else {
        setFlash('danger', 'Invalid email or password. Please check your credentials.');
        header("Location: ../login.php");
        exit;
    }
} catch (PDOException $e) {
    setFlash('danger', 'Database error encountered during authentication.');
    header("Location: ../login.php");
    exit;
}
