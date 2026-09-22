<?php
/**
 * SmartBill - User Management & RBAC
 */

require_once __DIR__ . '/../includes/auth_check.php';
requireAdmin(); // Only Admin can manage users

$page_title = 'User Management - SmartBill';

$users = $pdo->query("SELECT id, name, email, role, status, created_at FROM users ORDER BY id ASC")->fetchAll();

include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
    <div>
        <h4 class="fw-bold mb-1 text-dark">User Management & Permissions</h4>
        <p class="text-muted small mb-0">Control staff logins, access roles (Admin vs Staff), and account statuses.</p>
    </div>
    <div class="d-flex gap-2">
        <a href="add.php" class="btn btn-primary btn-sm shadow-sm">
            <i class="fa-solid fa-user-plus me-1"></i> Add New User
        </a>
    </div>
</div>

<div class="row">
    <div class="col-lg-8">
        <div class="card border-0 shadow-sm">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Name & Email</th>
                                <th>Role</th>
                                <th class="text-center">Status</th>
                                <th>Created</th>
                                <th class="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($users as $u): ?>
                                <tr>
                                    <td>
                                        <div class="fw-bold text-dark"><?= htmlspecialchars($u['name']) ?></div>
                                        <div class="text-muted small"><?= htmlspecialchars($u['email']) ?></div>
                                    </td>
                                    <td>
                                        <span class="badge <?= ($u['role'] === 'admin') ? 'bg-primary' : 'bg-secondary' ?> text-uppercase">
                                            <?= htmlspecialchars($u['role']) ?>
                                        </span>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge <?= ($u['status'] === 'active') ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger' ?>">
                                            <?= ucfirst($u['status']) ?>
                                        </span>
                                    </td>
                                    <td class="small text-muted"><?= formatDate($u['created_at'], 'd M Y') ?></td>
                                    <td class="text-end">
                                        <div class="btn-group btn-group-sm">
                                            <a href="edit.php?id=<?= $u['id'] ?>" class="btn btn-light border" title="Edit">
                                                <i class="fa-solid fa-pen text-secondary"></i>
                                            </a>
                                            <?php if ($u['id'] != $_SESSION['user_id']): ?>
                                                <a href="delete.php?id=<?= $u['id'] ?>&token=<?= getCSRFToken() ?>" class="btn btn-light border text-danger" title="Delete" onclick="return confirm('Are you sure you want to delete this user account?');">
                                                    <i class="fa-solid fa-trash-can"></i>
                                                </a>
                                            <?php endif; ?>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Role Explanation -->
    <div class="col-lg-4 mt-3 mt-lg-0">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3">
                <span class="fw-bold text-dark"><i class="fa-solid fa-shield-halved text-primary me-2"></i>Role Permissions Matrix</span>
            </div>
            <div class="card-body small">
                <div class="mb-3">
                    <strong class="text-primary d-block">Admin Role:</strong>
                    <span class="text-muted">Unrestricted access. Can manage company profile, bank accounts, GST credentials, delete records, and manage user logins.</span>
                </div>
                <div>
                    <strong class="text-secondary d-block">Staff Role:</strong>
                    <span class="text-muted">Can generate customer invoices, record collections, manage inventory, view reports, and create customers. Restricted from changing master company profile and managing team accounts.</span>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
