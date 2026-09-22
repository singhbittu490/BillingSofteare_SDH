<?php
/**
 * SmartBill - Product Categories
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Product Categories - SmartBill';
$error = '';

// Handle Category Creation or Update
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCSRFToken($token)) {
        $error = 'Invalid security token.';
    } else {
        $action = $_POST['action'] ?? 'create';
        $name = trim($_POST['name'] ?? '');
        $description = trim($_POST['description'] ?? '');

        if (empty($name)) {
            $error = 'Category name is required.';
        } else {
            if ($action === 'create') {
                $stmt = $pdo->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
                $stmt->execute([$name, $description]);
                setFlash('success', 'Category created successfully!');
            } elseif ($action === 'update') {
                $id = (int)$_POST['category_id'];
                $stmt = $pdo->prepare("UPDATE categories SET name = ?, description = ? WHERE id = ?");
                $stmt->execute([$name, $description, $id]);
                setFlash('success', 'Category updated successfully!');
            }
            header("Location: index.php");
            exit;
        }
    }
}

// Handle Delete via GET
if (isset($_GET['delete'])) {
    $del_id = (int)$_GET['delete'];
    $del_token = $_GET['token'] ?? '';
    if (verifyCSRFToken($del_token)) {
        // Check if products exist in category
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE category_id = ?");
        $stmt->execute([$del_id]);
        if ($stmt->fetchColumn() > 0) {
            setFlash('danger', 'Cannot delete this category because products are assigned to it.');
        } else {
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$del_id]);
            setFlash('success', 'Category deleted successfully.');
        }
    }
    header("Location: index.php");
    exit;
}

// Fetch all categories with product count
$stmt = $pdo->query("
    SELECT c.*, COUNT(p.id) as product_count 
    FROM categories c 
    LEFT JOIN products p ON c.id = p.category_id 
    GROUP BY c.id 
    ORDER BY c.name ASC
");
$categories = $stmt->fetchAll();

$csrf_token = getCSRFToken();
include __DIR__ . '/../includes/header.php';
?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <h4 class="fw-bold mb-1 text-dark">Product Categories</h4>
        <p class="text-muted small mb-0">Organize goods and services for streamlined billing, cataloging, and reports.</p>
    </div>
    <button class="btn btn-primary btn-sm shadow-sm" data-bs-toggle="modal" data-bs-target="#addCategoryModal">
        <i class="fa-solid fa-plus me-1"></i> Add Category
    </button>
</div>

<div class="row">
    <div class="col-lg-8">
        <div class="card border-0 shadow-sm">
            <div class="card-body p-0">
                <?php if (empty($categories)): ?>
                    <div class="p-4 text-center text-muted small">No categories defined yet.</div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Category Name</th>
                                    <th>Description</th>
                                    <th class="text-center">Products</th>
                                    <th class="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($categories as $cat): ?>
                                    <tr>
                                        <td class="fw-bold text-dark"><?= htmlspecialchars($cat['name']) ?></td>
                                        <td class="text-muted small"><?= htmlspecialchars($cat['description'] ?: '-') ?></td>
                                        <td class="text-center">
                                            <a href="../products/index.php?category=<?= $cat['id'] ?>" class="badge bg-light text-primary border text-decoration-none">
                                                <?= $cat['product_count'] ?> products
                                            </a>
                                        </td>
                                        <td class="text-end">
                                            <button type="button" class="btn btn-light btn-sm border edit-cat-btn"
                                                data-id="<?= $cat['id'] ?>"
                                                data-name="<?= htmlspecialchars($cat['name']) ?>"
                                                data-description="<?= htmlspecialchars($cat['description'] ?? '') ?>">
                                                <i class="fa-solid fa-pen text-secondary"></i>
                                            </button>
                                            <a href="index.php?delete=<?= $cat['id'] ?>&token=<?= $csrf_token ?>"
                                               class="btn btn-light btn-sm border text-danger"
                                               onclick="return confirm('Are you sure you want to delete this category?');">
                                                <i class="fa-solid fa-trash-can"></i>
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

    <div class="col-lg-4 mt-3 mt-lg-0">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3">
                <span class="fw-bold text-dark"><i class="fa-solid fa-lightbulb text-warning me-2"></i>GST Categorization Tip</span>
            </div>
            <div class="card-body small text-muted">
                <p>Categorizing your inventory enables quick filtering on the invoice generator and allows breakdown of revenue by product segment.</p>
                <p class="mb-0">You can also assign HSN codes directly to individual products under each category.</p>
            </div>
        </div>
    </div>
</div>

<!-- Add Category Modal -->
<div class="modal fade" id="addCategoryModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <form action="index.php" method="POST">
                <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
                <input type="hidden" name="action" value="create">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold">Add Category</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Category Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" name="name" required placeholder="e.g. Mobile Accessories, Raw Materials">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" name="description" rows="2" placeholder="Optional notes"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Category</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Edit Category Modal -->
<div class="modal fade" id="editCategoryModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <form action="index.php" method="POST">
                <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
                <input type="hidden" name="action" value="update">
                <input type="hidden" name="category_id" id="editCatId">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold">Edit Category</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Category Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" name="name" id="editCatName" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" name="description" id="editCatDesc" rows="2"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Category</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
document.querySelectorAll('.edit-cat-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.getElementById('editCatId').value = this.getAttribute('data-id');
        document.getElementById('editCatName').value = this.getAttribute('data-name');
        document.getElementById('editCatDesc').value = this.getAttribute('data-description');
        new bootstrap.Modal(document.getElementById('editCategoryModal')).show();
    });
});
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
