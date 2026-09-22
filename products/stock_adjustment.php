<?php
/**
 * SmartBill - Inventory Stock Adjustment
 */

require_once __DIR__ . '/../includes/auth_check.php';

$page_title = 'Stock Adjustment - SmartBill';
$product_id = (int)($_GET['product_id'] ?? 0);

$products = $pdo->query("SELECT id, name, sku, current_stock, unit FROM products ORDER BY name ASC")->fetchAll();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCSRFToken($token)) {
        $error = 'Invalid security token.';
    } else {
        $p_id = (int)($_POST['product_id'] ?? 0);
        $action_type = $_POST['action_type'] ?? 'add'; // 'add', 'subtract', 'set'
        $qty = (float)($_POST['quantity'] ?? 0);
        $reason = trim($_POST['reason'] ?? '');
        $note = trim($_POST['note'] ?? '');

        // Fetch selected product
        $stmt = $pdo->prepare("SELECT id, name, current_stock, unit FROM products WHERE id = ?");
        $stmt->execute([$p_id]);
        $prod = $stmt->fetch();

        if (!$prod) {
            $error = 'Selected product was not found.';
        } elseif ($qty <= 0 && $action_type !== 'set') {
            $error = 'Please specify a valid quantity greater than zero.';
        } else {
            $old_stock = (float)$prod['current_stock'];
            $new_stock = $old_stock;
            $movement_qty = 0;

            if ($action_type === 'add') {
                $new_stock = $old_stock + $qty;
                $movement_qty = $qty;
            } elseif ($action_type === 'subtract') {
                $new_stock = max(0, $old_stock - $qty);
                $movement_qty = -$qty;
            } elseif ($action_type === 'set') {
                $new_stock = max(0, $qty);
                $movement_qty = $new_stock - $old_stock;
            }

            // Update product stock
            $upd = $pdo->prepare("UPDATE products SET current_stock = ? WHERE id = ?");
            $upd->execute([$new_stock, $p_id]);

            // Record movement
            $ref_num = 'ADJ-' . date('Ymd-His');
            $full_note = ($reason ? "[{$reason}] " : '') . $note;
            recordStockMovement($pdo, $p_id, 'adjustment', $movement_qty, 'manual', $ref_num, $full_note);

            setFlash('success', 'Stock for "' . $prod['name'] . '" adjusted successfully! New balance: ' . $new_stock . ' ' . $prod['unit']);
            header("Location: view.php?id=" . $p_id);
            exit;
        }
    }
}

$csrf_token = getCSRFToken();
include __DIR__ . '/../includes/header.php';
?>

<div class="row justify-content-center">
    <div class="col-lg-7">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                    <i class="fa-solid fa-boxes-packing text-primary fs-5"></i>
                    <h5 class="mb-0 fw-bold">Stock In / Stock Out / Adjustment</h5>
                </div>
                <a href="index.php" class="btn btn-outline-secondary btn-sm">Back</a>
            </div>
            <div class="card-body p-4">
                <?php if ($error): ?>
                    <div class="alert alert-danger py-2 small"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <form action="stock_adjustment.php" method="POST">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

                    <div class="mb-3">
                        <label class="form-label">Select Product <span class="text-danger">*</span></label>
                        <select class="form-select" name="product_id" id="adjProductSelect" required>
                            <option value="">-- Choose Product --</option>
                            <?php foreach ($products as $p): ?>
                                <option value="<?= $p['id'] ?>" 
                                    data-stock="<?= (float)$p['current_stock'] ?>"
                                    data-unit="<?= htmlspecialchars($p['unit']) ?>"
                                    <?= ($product_id === (int)$p['id']) ? 'selected' : '' ?>>
                                    <?= htmlspecialchars($p['name']) ?> (Current: <?= (float)$p['current_stock'] ?> <?= htmlspecialchars($p['unit']) ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="mb-3 p-3 bg-light rounded border d-flex justify-content-between align-items-center">
                        <span class="text-muted small fw-semibold">Current System Stock:</span>
                        <span class="fs-5 fw-bold text-primary" id="currentStockDisplay">--</span>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Adjustment Type <span class="text-danger">*</span></label>
                        <div class="row g-2">
                            <div class="col-4">
                                <input type="radio" class="btn-check" name="action_type" id="type_add" value="add" checked>
                                <label class="btn btn-outline-success w-100 py-2" for="type_add">
                                    <i class="fa-solid fa-plus me-1"></i> Stock In (+)
                                </label>
                            </div>
                            <div class="col-4">
                                <input type="radio" class="btn-check" name="action_type" id="type_sub" value="subtract">
                                <label class="btn btn-outline-danger w-100 py-2" for="type_sub">
                                    <i class="fa-solid fa-minus me-1"></i> Stock Out (-)
                                </label>
                            </div>
                            <div class="col-4">
                                <input type="radio" class="btn-check" name="action_type" id="type_set" value="set">
                                <label class="btn btn-outline-primary w-100 py-2" for="type_set">
                                    <i class="fa-solid fa-equals me-1"></i> Set Exact (=)
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label" id="qtyLabel">Quantity to Add <span class="text-danger">*</span></label>
                        <input type="number" step="any" min="0.01" class="form-control" name="quantity" id="adjQty" required placeholder="Enter adjustment quantity">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Reason for Adjustment</label>
                        <select class="form-select" name="reason">
                            <option value="Physical Audit / Stock Count">Physical Audit / Stock Count Correction</option>
                            <option value="Damaged / Broken Goods">Damaged / Broken Goods</option>
                            <option value="Expired Inventory">Expired Inventory</option>
                            <option value="Internal Company Consumption">Internal Company Consumption</option>
                            <option value="Opening Balance Correction">Opening Balance Correction</option>
                            <option value="Customer Return (Unbilled)">Customer Return (Unbilled)</option>
                            <option value="Other">Other Reason</option>
                        </select>
                    </div>

                    <div class="mb-4">
                        <label class="form-label">Internal Remarks / Notes</label>
                        <textarea class="form-control" name="note" rows="2" placeholder="Optional details or batch notes"></textarea>
                    </div>

                    <div class="text-end pt-3 border-top">
                        <a href="index.php" class="btn btn-outline-secondary me-2">Cancel</a>
                        <button type="submit" class="btn btn-primary px-4">Save Adjustment</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
function updateStockDisplay() {
    const sel = document.getElementById('adjProductSelect');
    const opt = sel.options[sel.selectedIndex];
    const display = document.getElementById('currentStockDisplay');
    if (opt && opt.value) {
        const stock = opt.getAttribute('data-stock');
        const unit = opt.getAttribute('data-unit');
        display.textContent = stock + ' ' + unit;
    } else {
        display.textContent = '--';
    }
}

document.getElementById('adjProductSelect')?.addEventListener('change', updateStockDisplay);
updateStockDisplay();

document.querySelectorAll('input[name="action_type"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const label = document.getElementById('qtyLabel');
        const qtyInput = document.getElementById('adjQty');
        if (this.value === 'add') {
            label.innerHTML = 'Quantity to Add <span class="text-danger">*</span>';
            qtyInput.min = '0.01';
        } else if (this.value === 'subtract') {
            label.innerHTML = 'Quantity to Remove <span class="text-danger">*</span>';
            qtyInput.min = '0.01';
        } else if (this.value === 'set') {
            label.innerHTML = 'Set Exact New Physical Quantity <span class="text-danger">*</span>';
            qtyInput.min = '0';
        }
    });
});
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
