<?php
/**
 * SmartBill - Edit Product
 */

require_once __DIR__ . '/../includes/auth_check.php';

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
$stmt->execute([$id]);
$product = $stmt->fetch();

if (!$product) {
    setFlash('danger', 'Product not found.');
    header("Location: index.php");
    exit;
}

$page_title = 'Edit Product - ' . $product['name'];
$categories = $pdo->query("SELECT id, name FROM categories ORDER BY name ASC")->fetchAll();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCSRFToken($token)) {
        $error = 'Invalid security token.';
    } else {
        $name = trim($_POST['name'] ?? '');
        $sku = trim($_POST['sku'] ?? '');
        $hsn_sac = trim($_POST['hsn_sac'] ?? '');
        $category_id = !empty($_POST['category_id']) ? (int)$_POST['category_id'] : null;
        $unit = trim($_POST['unit'] ?? 'PCS');
        $purchase_price = (float)($_POST['purchase_price'] ?? 0);
        $selling_price = (float)($_POST['selling_price'] ?? 0);
        $gst_rate = (float)($_POST['gst_rate'] ?? 18);
        $cess = (float)($_POST['cess'] ?? 0);
        $minimum_stock = (float)($_POST['minimum_stock'] ?? 5);
        $description = trim($_POST['description'] ?? '');

        if (empty($name)) {
            $error = 'Product name is required.';
        } else {
            $stmt = $pdo->prepare("
                UPDATE products SET
                    name = ?, sku = ?, hsn_sac = ?, category_id = ?, unit = ?,
                    purchase_price = ?, selling_price = ?, gst_rate = ?, cess = ?,
                    minimum_stock = ?, description = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $name, $sku, $hsn_sac, $category_id, $unit,
                $purchase_price, $selling_price, $gst_rate, $cess,
                $minimum_stock, $description, $id
            ]);

            setFlash('success', 'Product updated successfully!');
            header("Location: index.php");
            exit;
        }
    }
}

$csrf_token = getCSRFToken();
include __DIR__ . '/../includes/header.php';
?>

<div class="row justify-content-center">
    <div class="col-lg-9">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                    <i class="fa-solid fa-pen-to-square text-primary fs-5"></i>
                    <h5 class="mb-0 fw-bold">Edit Product</h5>
                </div>
                <div class="d-flex gap-2">
                    <a href="stock_adjustment.php?product_id=<?= $id ?>" class="btn btn-outline-primary btn-sm">Stock Adjustment</a>
                    <a href="index.php" class="btn btn-outline-secondary btn-sm">Back</a>
                </div>
            </div>
            <div class="card-body p-4">
                <?php if ($error): ?>
                    <div class="alert alert-danger py-2 small"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <form action="edit.php?id=<?= $id ?>" method="POST">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

                    <div class="row g-3 mb-3">
                        <div class="col-md-8">
                            <label class="form-label">Product / Service Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" name="name" value="<?= htmlspecialchars($product['name']) ?>" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">SKU / Item Code</label>
                            <input type="text" class="form-control font-monospace" name="sku" value="<?= htmlspecialchars($product['sku'] ?? '') ?>">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">HSN / SAC Code</label>
                            <input type="text" class="form-control font-monospace" name="hsn_sac" value="<?= htmlspecialchars($product['hsn_sac'] ?? '') ?>">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Category</label>
                            <select class="form-select" name="category_id">
                                <option value="">-- Select Category --</option>
                                <?php foreach ($categories as $cat): ?>
                                    <option value="<?= $cat['id'] ?>" <?= ((int)$product['category_id'] === (int)$cat['id']) ? 'selected' : '' ?>>
                                        <?= htmlspecialchars($cat['name']) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Measurement Unit</label>
                            <select class="form-select" name="unit">
                                <?php foreach (['PCS', 'KG', 'GM', 'LTR', 'ML', 'BOX', 'MTR', 'SET', 'OTHER'] as $u): ?>
                                    <option value="<?= $u ?>" <?= ($product['unit'] === $u) ? 'selected' : '' ?>><?= $u ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <h6 class="fw-bold text-dark border-bottom pb-2 my-3">Pricing & GST Tax Rates</h6>
                    <div class="row g-3 mb-3">
                        <div class="col-md-3">
                            <label class="form-label">Purchase Price (₹)</label>
                            <input type="number" step="0.01" class="form-control text-end" name="purchase_price" value="<?= htmlspecialchars($product['purchase_price']) ?>">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Selling Price (₹) <span class="text-danger">*</span></label>
                            <input type="number" step="0.01" class="form-control text-end fw-semibold" name="selling_price" value="<?= htmlspecialchars($product['selling_price']) ?>" required>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">GST Tax Rate</label>
                            <select class="form-select" name="gst_rate">
                                <?php foreach ([0, 5, 12, 18, 28] as $rate): ?>
                                    <option value="<?= $rate ?>" <?= ((float)$product['gst_rate'] === (float)$rate) ? 'selected' : '' ?>><?= $rate ?>%</option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Cess (%)</label>
                            <input type="number" step="0.01" class="form-control text-end" name="cess" value="<?= htmlspecialchars($product['cess']) ?>">
                        </div>
                    </div>

                    <h6 class="fw-bold text-dark border-bottom pb-2 my-3">Inventory Settings</h6>
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Current Physical Stock</label>
                            <div class="input-group">
                                <input type="text" class="form-control bg-light fw-bold" value="<?= (float)$product['current_stock'] ?> <?= htmlspecialchars($product['unit']) ?>" readonly>
                                <a href="stock_adjustment.php?product_id=<?= $id ?>" class="btn btn-outline-primary">Adjust Stock</a>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Minimum Low Stock Alert</label>
                            <input type="number" step="any" class="form-control text-end" name="minimum_stock" value="<?= htmlspecialchars($product['minimum_stock']) ?>">
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label">Item Description</label>
                        <textarea class="form-control" name="description" rows="2"><?= htmlspecialchars($product['description'] ?? '') ?></textarea>
                    </div>

                    <div class="text-end pt-3 border-top">
                        <a href="index.php" class="btn btn-outline-secondary me-2">Cancel</a>
                        <button type="submit" class="btn btn-primary px-4">Update Product</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
