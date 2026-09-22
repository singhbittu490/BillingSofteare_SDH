        </main>

        <!-- Main Footer -->
        <footer class="bg-white border-top py-3 px-4 text-center text-md-between d-flex flex-column flex-md-row align-items-center justify-content-between text-muted small mt-auto">
            <div>
                &copy; <?= date('Y') ?> <strong><?= htmlspecialchars($company_info['company_name'] ?? 'SmartBill') ?></strong>. All rights reserved.
            </div>
            <div class="mt-1 mt-md-0">
                <span class="badge bg-light text-secondary border">Hostinger Ready</span>
                <span class="ms-2">GST Invoice & Inventory Engine v1.0</span>
            </div>
        </footer>
    </div>
</div>

<!-- Bootstrap 5.3.3 Bundle JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<!-- Chart.js for Dashboard Analytics -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
<!-- SmartBill Application JS -->
<script src="<?= $to_root ?>assets/js/app.js"></script>

</body>
</html>
