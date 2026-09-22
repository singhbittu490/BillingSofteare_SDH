<?php
/**
 * SmartBill - Add Product
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Add Product - SmartBill';
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
        $opening_stock = (float)($_POST['opening_stock'] ?? 0);
        $minimum_stock = (float)($_POST['minimum_stock'] ?? 5);
        $description = trim($_POST['description'] ?? '');

        if (empty($name)) {
            $error = 'Product name is required.';
        } else {
            // Auto SKU if empty
            if (empty($sku)) {
                $sku = 'PRD-' . strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $name), 0, 3)) . '-' . rand(100, 999);
            }

            $current_stock = $opening_stock;

            $stmt = $pdo->prepare("
                INSERT INTO products (name, sku, hsn_sac, category_id, unit, purchase_price, selling_price, gst_rate, cess, opening_stock, current_stock, minimum_stock, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $name, $sku, $hsn_sac, $category_id, $unit, $purchase_price, $selling_price, $gst_rate, $cess, $opening_stock, $current_stock, $minimum_stock, $description
            ]);
            $productId = $pdo->lastInsertId();

            // Record in stock movements if opening stock > 0
            if ($opening_stock > 0) {
                recordStockMovement(
                    $pdo,
                    $productId,
                    'adjustment',
                    $opening_stock,
                    'manual',
                    'OPENING-STOCK',
                    'Initial Opening Stock setup'
                );
            }

            setFlash('success', 'Product created successfully!');
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
                    <i class="fa-solid fa-box text-primary fs-5"></i>
                    <h5 class="mb-0 fw-bold">Add Product / Service</h5>
                </div>
                <a href="index.php" class="btn btn-outline-secondary btn-sm">Back</a>
            </div>
            <div class="card-body p-4">
                <?php if ($error): ?>
                    <div class="alert alert-danger py-2 small"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <form action="add.php" method="POST">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

                    <div class="row g-3 mb-3">
                        <div class="col-md-8">
                            <label class="form-label">Product / Service Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" name="name" required placeholder="e.g. Dell Wireless Keyboard, Consulting Service">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">SKU / Item Code</label>
                            <input type="text" class="form-control font-monospace" name="sku" placeholder="Auto-generated if empty">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">HSN / SAC Code</label>
                            <input type="text" class="form-control font-monospace" name="hsn_sac" placeholder="e.g. 8471, 9983">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Category</label>
                            <select class="form-select" name="category_id">
                                <option value="">-- Select Category --</option>
                                <?php foreach ($categories as $cat): ?>
                                    <option value="<?= $cat['id'] ?>"><?= htmlspecialchars($cat['name']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Measurement Unit</label>
                            <select class="form-select" name="unit">
                                <option value="PCS" selected>PCS (Pieces)</option>
                                <option value="KG">KG (Kilograms)</option>
                                <option value="GM">GM (Grams)</option>
                                <option value="LTR">LTR (Litres)</option>
                                <option value="ML">ML (Millilitres)</option>
                                <option value="BOX">BOX (Boxes)</option>
                                <option value="MTR">MTR (Meters)</option>
                                <option value="SET">SET (Sets)</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </div>
                    </div>

                    <h6 class="fw-bold text-dark border-bottom pb-2 my-3">Pricing & GST Tax Rates</h6>
                    <div class="row g-3 mb-3">
                        <div class="col-md-3">
                            <label class="form-label">Purchase Price (₹)</label>
                            <input type="number" step="0.01" class="form-control text-end" name="purchase_price" value="0.00">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Selling Price (₹) <span class="text-danger">*</span></label>
                            <input type="number" step="0.01" class="form-control text-end fw-semibold" name="selling_price" value="0.00" required>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">GST Tax Rate</label>
                            <select class="form-select" name="gst_rate">
                                <option value="0">0% (Nil / Exempted)</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18" selected>18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Cess (%)</label>
                            <input type="number" step="0.01" class="form-control text-end" name="cess" value="0.00">
                        </div>
                    </div>

                    <h6 class="fw-bold text-dark border-bottom pb-2 my-3">Inventory Stock Tracking</h6>
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Opening Stock Quantity</label>
                            <input type="number" step="any" class="form-control text-end" name="opening_stock" value="0">
                            <div class="form-text small">Initial stock on hand at setup</div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Minimum Low Stock Alert</label>
                            <input type="number" step="any" class="form-control text-end" name="minimum_stock" value="5">
                            <div class="form-text small">Triggers dashboard warning when current stock drops to or below this</div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label">Item Description / Technical Specs</label>
                        <textarea class="form-control" name="description" rows="2" placeholder="Item notes"></textarea>
                    </div>

                    <div class="text-end pt-3 border-top">
                        <a href="index.php" class="btn btn-outline-secondary me-2">Cancel</a>
                        <button type="submit" class="btn btn-primary px-4">Save Product</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
