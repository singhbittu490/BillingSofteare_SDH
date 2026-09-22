/**
 * SmartBill - Client-side UI & Dynamic GST Billing Calculations
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Sidebar Toggle
    const sidebarToggle = document.getElementById('sbSidebarToggle');
    const sidebar = document.querySelector('.sb-sidebar');
    const overlay = document.querySelector('.sb-sidebar-overlay');

    if (sidebarToggle && sidebar && overlay) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
            overlay.classList.toggle('show');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        });
    }

    // 2. Global Autocomplete Search
    const searchInput = document.getElementById('sbGlobalSearch');
    const searchResults = document.getElementById('sbSearchResults');

    if (searchInput && searchResults) {
        let debounceTimer;
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            clearTimeout(debounceTimer);
            if (query.length < 2) {
                searchResults.innerHTML = '';
                searchResults.classList.remove('show');
                return;
            }

            debounceTimer = setTimeout(() => {
                // Determine API path relative to current page
                const basePath = window.SB_BASE_PATH || '';
                fetch(`${basePath}api/search.php?q=${encodeURIComponent(query)}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.length > 0) {
                            let html = '';
                            data.forEach(item => {
                                let icon = 'fa-file-invoice';
                                let badge = 'Invoice';
                                if (item.type === 'customer') { icon = 'fa-user'; badge = 'Customer'; }
                                else if (item.type === 'product') { icon = 'fa-box'; badge = 'Product'; }
                                else if (item.type === 'supplier') { icon = 'fa-truck'; badge = 'Supplier'; }
                                else if (item.type === 'payment') { icon = 'fa-receipt'; badge = 'Payment'; }

                                html += `
                                    <a href="${basePath}${item.url}" class="sb-search-item">
                                        <i class="fa-solid ${icon} text-primary"></i>
                                        <div class="flex-grow-1">
                                            <div class="fw-semibold">${escapeHtml(item.title)}</div>
                                            <div class="small text-muted">${escapeHtml(item.subtitle)}</div>
                                        </div>
                                        <span class="badge bg-light text-dark border">${badge}</span>
                                    </a>
                                `;
                            });
                            searchResults.innerHTML = html;
                            searchResults.classList.add('show');
                        } else {
                            searchResults.innerHTML = `<div class="p-3 text-muted text-center small">No matches found</div>`;
                            searchResults.classList.add('show');
                        }
                    })
                    .catch(() => {
                        searchResults.classList.remove('show');
                    });
            }, 250);
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.remove('show');
            }
        });
    }

    // 3. Dynamic GST Invoice Creation Module
    const invoiceForm = document.getElementById('invoiceForm');
    if (invoiceForm) {
        initInvoiceCalculator();
    }
});

/**
 * Escape HTML utility
 */
function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Interactive GST Invoice Calculator
 */
function initInvoiceCalculator() {
    const customerSelect = document.getElementById('customer_id');
    const customerGstinInput = document.getElementById('customer_gstin');
    const customerAddressInput = document.getElementById('customer_address');
    const placeOfSupplySelect = document.getElementById('place_of_supply');
    const companyState = document.getElementById('company_state') ? document.getElementById('company_state').value.trim().toLowerCase() : '';
    
    const itemsTableBody = document.querySelector('#invoiceItemsTable tbody');
    const addItemBtn = document.getElementById('addItemBtn');
    const invoiceDiscountInput = document.getElementById('invoice_discount');

    // Customer Selection Change -> Auto-fill details and update supply state
    if (customerSelect) {
        customerSelect.addEventListener('change', function() {
            const selectedOpt = this.options[this.selectedIndex];
            if (selectedOpt && selectedOpt.value) {
                const gstin = selectedOpt.getAttribute('data-gstin') || '';
                const address = selectedOpt.getAttribute('data-address') || '';
                const state = selectedOpt.getAttribute('data-state') || '';
                const stateCode = selectedOpt.getAttribute('data-state-code') || '';

                if (customerGstinInput) customerGstinInput.value = gstin;
                if (customerAddressInput) customerAddressInput.value = address;
                
                if (placeOfSupplySelect && state) {
                    // Try to match place of supply
                    for (let i = 0; i < placeOfSupplySelect.options.length; i++) {
                        if (placeOfSupplySelect.options[i].value.toLowerCase().includes(state.toLowerCase())) {
                            placeOfSupplySelect.selectedIndex = i;
                            break;
                        }
                    }
                }
            }
            recalculateAllInvoiceRows();
        });
    }

    // Place of Supply Change -> Recalculate CGST/SGST vs IGST
    if (placeOfSupplySelect) {
        placeOfSupplySelect.addEventListener('change', () => {
            recalculateAllInvoiceRows();
        });
    }

    // Invoice-level Discount Change
    if (invoiceDiscountInput) {
        invoiceDiscountInput.addEventListener('input', () => {
            calculateInvoiceGrandTotals();
        });
    }

    // Add Item Row Event
    if (addItemBtn && itemsTableBody) {
        addItemBtn.addEventListener('click', () => {
            addInvoiceItemRow();
        });
    }

    // Attach listeners to initial rows
    bindItemRowEvents();
    recalculateAllInvoiceRows();
}

/**
 * Add a new item row to invoice creation table
 */
function addInvoiceItemRow() {
    const itemsTableBody = document.querySelector('#invoiceItemsTable tbody');
    if (!itemsTableBody) return;

    const rowCount = itemsTableBody.children.length;
    const newRow = document.createElement('tr');
    newRow.className = 'item-row';
    
    // Copy options from the first row's product select if available
    const firstSelect = itemsTableBody.querySelector('.product-select');
    const productOptions = firstSelect ? firstSelect.innerHTML : '<option value="">-- Select Product --</option>';

    newRow.innerHTML = `
        <td class="text-center row-number align-middle">${rowCount + 1}</td>
        <td>
            <select name="items[${rowCount}][product_id]" class="form-select form-select-sm product-select" required>
                ${productOptions}
            </select>
            <input type="hidden" name="items[${rowCount}][product_name]" class="product-name-input">
        </td>
        <td>
            <input type="text" name="items[${rowCount}][hsn_sac]" class="form-control form-control-sm hsn-input" placeholder="HSN/SAC">
        </td>
        <td>
            <input type="number" name="items[${rowCount}][quantity]" class="form-control form-control-sm text-end qty-input" value="1" min="0.01" step="any" required>
        </td>
        <td>
            <select name="items[${rowCount}][unit]" class="form-select form-select-sm unit-select">
                <option value="PCS">PCS</option>
                <option value="KG">KG</option>
                <option value="GM">GM</option>
                <option value="LTR">LTR</option>
                <option value="ML">ML</option>
                <option value="BOX">BOX</option>
                <option value="MTR">MTR</option>
                <option value="SET">SET</option>
                <option value="OTHER">OTHER</option>
            </select>
        </td>
        <td>
            <input type="number" name="items[${rowCount}][rate]" class="form-control form-control-sm text-end rate-input" value="0.00" min="0" step="0.01" required>
        </td>
        <td>
            <input type="number" name="items[${rowCount}][discount]" class="form-control form-control-sm text-end discount-input" value="0.00" min="0" step="0.01">
        </td>
        <td>
            <input type="number" name="items[${rowCount}][taxable_amount]" class="form-control form-control-sm text-end taxable-input" value="0.00" readonly>
        </td>
        <td>
            <select name="items[${rowCount}][gst_rate]" class="form-select form-select-sm gst-rate-select">
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18" selected>18%</option>
                <option value="28">28%</option>
            </select>
            <input type="hidden" name="items[${rowCount}][cgst]" class="cgst-input" value="0.00">
            <input type="hidden" name="items[${rowCount}][sgst]" class="sgst-input" value="0.00">
            <input type="hidden" name="items[${rowCount}][igst]" class="igst-input" value="0.00">
        </td>
        <td>
            <input type="number" name="items[${rowCount}][total]" class="form-control form-control-sm text-end total-input fw-semibold" value="0.00" readonly>
        </td>
        <td class="text-center align-middle">
            <button type="button" class="btn btn-outline-danger btn-sm remove-row-btn" title="Remove Item">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </td>
    `;

    itemsTableBody.appendChild(newRow);
    bindRowEvents(newRow);
    recalculateRow(newRow);
    renumberRows();
}

/**
 * Bind events to all item rows
 */
function bindItemRowEvents() {
    const rows = document.querySelectorAll('#invoiceItemsTable tbody tr.item-row');
    rows.forEach(row => bindRowEvents(row));
}

/**
 * Bind events to an individual row
 */
function bindRowEvents(row) {
    const productSelect = row.querySelector('.product-select');
    const qtyInput = row.querySelector('.qty-input');
    const rateInput = row.querySelector('.rate-input');
    const discountInput = row.querySelector('.discount-input');
    const gstRateSelect = row.querySelector('.gst-rate-select');
    const removeBtn = row.querySelector('.remove-row-btn');

    // Product selection auto-populates
    if (productSelect) {
        productSelect.addEventListener('change', () => {
            const opt = productSelect.options[productSelect.selectedIndex];
            if (opt && opt.value) {
                const price = parseFloat(opt.getAttribute('data-price')) || 0;
                const hsn = opt.getAttribute('data-hsn') || '';
                const unit = opt.getAttribute('data-unit') || 'PCS';
                const gst = opt.getAttribute('data-gst') || '18';
                const name = opt.getAttribute('data-name') || opt.text;

                if (row.querySelector('.rate-input')) row.querySelector('.rate-input').value = price.toFixed(2);
                if (row.querySelector('.hsn-input')) row.querySelector('.hsn-input').value = hsn;
                if (row.querySelector('.unit-select')) row.querySelector('.unit-select').value = unit;
                if (row.querySelector('.gst-rate-select')) row.querySelector('.gst-rate-select').value = gst;
                if (row.querySelector('.product-name-input')) row.querySelector('.product-name-input').value = name;
            }
            recalculateRow(row);
        });
    }

    [qtyInput, rateInput, discountInput, gstRateSelect].forEach(input => {
        if (input) {
            input.addEventListener('input', () => recalculateRow(row));
            input.addEventListener('change', () => recalculateRow(row));
        }
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            const tbody = document.querySelector('#invoiceItemsTable tbody');
            if (tbody && tbody.querySelectorAll('tr.item-row').length > 1) {
                row.remove();
                renumberRows();
                calculateInvoiceGrandTotals();
            } else {
                alert('An invoice must contain at least one item.');
            }
        });
    }
}

/**
 * Renumber all row indices
 */
function renumberRows() {
    const rows = document.querySelectorAll('#invoiceItemsTable tbody tr.item-row');
    rows.forEach((row, idx) => {
        const numCell = row.querySelector('.row-number');
        if (numCell) numCell.textContent = idx + 1;
    });
}

/**
 * Determine if transaction is Intra-state (CGST + SGST) or Inter-state (IGST)
 */
function isIntraStateTransaction() {
    const companyStateEl = document.getElementById('company_state');
    const placeOfSupplyEl = document.getElementById('place_of_supply');

    if (!companyStateEl || !placeOfSupplyEl) return true;

    const companyState = companyStateEl.value.trim().toLowerCase();
    const supplyVal = placeOfSupplyEl.value.trim().toLowerCase();

    if (!companyState || !supplyVal) return true;

    return supplyVal.includes(companyState);
}

/**
 * Calculate individual row values
 */
function recalculateRow(row) {
    const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
    const rate = parseFloat(row.querySelector('.rate-input')?.value) || 0;
    const discount = parseFloat(row.querySelector('.discount-input')?.value) || 0;
    const gstRate = parseFloat(row.querySelector('.gst-rate-select')?.value) || 0;

    // Gross = qty * rate
    const gross = qty * rate;
    // Taxable = gross - discount
    const taxable = Math.max(0, gross - discount);

    const taxableInput = row.querySelector('.taxable-input');
    if (taxableInput) taxableInput.value = taxable.toFixed(2);

    // Check tax type
    const isIntraState = isIntraStateTransaction();
    let cgst = 0, sgst = 0, igst = 0;

    if (isIntraState) {
        const halfRate = gstRate / 2;
        cgst = (taxable * halfRate) / 100;
        sgst = (taxable * halfRate) / 100;
        igst = 0;
    } else {
        cgst = 0;
        sgst = 0;
        igst = (taxable * gstRate) / 100;
    }

    const cgstInput = row.querySelector('.cgst-input');
    const sgstInput = row.querySelector('.sgst-input');
    const igstInput = row.querySelector('.igst-input');

    if (cgstInput) cgstInput.value = cgst.toFixed(2);
    if (sgstInput) sgstInput.value = sgst.toFixed(2);
    if (igstInput) igstInput.value = igst.toFixed(2);

    const total = taxable + cgst + sgst + igst;
    const totalInput = row.querySelector('.total-input');
    if (totalInput) totalInput.value = total.toFixed(2);

    calculateInvoiceGrandTotals();
}

/**
 * Recalculate every row in the table
 */
function recalculateAllInvoiceRows() {
    const rows = document.querySelectorAll('#invoiceItemsTable tbody tr.item-row');
    rows.forEach(row => recalculateRow(row));
}

/**
 * Sum totals across all rows and apply invoice discount
 */
function calculateInvoiceGrandTotals() {
    const rows = document.querySelectorAll('#invoiceItemsTable tbody tr.item-row');
    let subtotal = 0;
    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
        const rate = parseFloat(row.querySelector('.rate-input')?.value) || 0;
        subtotal += (qty * rate);

        totalTaxable += parseFloat(row.querySelector('.taxable-input')?.value) || 0;
        totalCGST += parseFloat(row.querySelector('.cgst-input')?.value) || 0;
        totalSGST += parseFloat(row.querySelector('.sgst-input')?.value) || 0;
        totalIGST += parseFloat(row.querySelector('.igst-input')?.value) || 0;
    });

    const invoiceDiscount = parseFloat(document.getElementById('invoice_discount')?.value) || 0;
    const adjustedTaxable = Math.max(0, totalTaxable - invoiceDiscount);
    
    // Scale GST if invoice discount is applied
    let grandCGST = totalCGST;
    let grandSGST = totalSGST;
    let grandIGST = totalIGST;

    if (totalTaxable > 0 && invoiceDiscount > 0) {
        const ratio = adjustedTaxable / totalTaxable;
        grandCGST = totalCGST * ratio;
        grandSGST = totalSGST * ratio;
        grandIGST = totalIGST * ratio;
    }

    const totalGST = grandCGST + grandSGST + grandIGST;
    const grandTotalExact = adjustedTaxable + totalGST;
    const grandTotalRounded = Math.round(grandTotalExact);
    const roundOff = grandTotalRounded - grandTotalExact;

    // Update Display Elements
    const elSubtotal = document.getElementById('display_subtotal');
    const elTaxable = document.getElementById('display_taxable');
    const elCGST = document.getElementById('display_cgst');
    const elSGST = document.getElementById('display_sgst');
    const elIGST = document.getElementById('display_igst');
    const elRoundOff = document.getElementById('display_round_off');
    const elGrandTotal = document.getElementById('display_grand_total');

    // Update Form Inputs
    const inputSubtotal = document.getElementById('input_subtotal');
    const inputTaxable = document.getElementById('input_taxable');
    const inputCGST = document.getElementById('input_cgst');
    const inputSGST = document.getElementById('input_sgst');
    const inputIGST = document.getElementById('input_igst');
    const inputGrandTotal = document.getElementById('input_grand_total');

    if (elSubtotal) elSubtotal.textContent = '₹' + subtotal.toFixed(2);
    if (elTaxable) elTaxable.textContent = '₹' + adjustedTaxable.toFixed(2);
    if (elCGST) elCGST.textContent = '₹' + grandCGST.toFixed(2);
    if (elSGST) elSGST.textContent = '₹' + grandSGST.toFixed(2);
    if (elIGST) elIGST.textContent = '₹' + grandIGST.toFixed(2);
    if (elRoundOff) elRoundOff.textContent = (roundOff >= 0 ? '+' : '') + roundOff.toFixed(2);
    if (elGrandTotal) elGrandTotal.textContent = '₹' + grandTotalRounded.toFixed(2);

    if (inputSubtotal) inputSubtotal.value = subtotal.toFixed(2);
    if (inputTaxable) inputTaxable.value = adjustedTaxable.toFixed(2);
    if (inputCGST) inputCGST.value = grandCGST.toFixed(2);
    if (inputSGST) inputSGST.value = grandSGST.toFixed(2);
    if (inputIGST) inputIGST.value = grandIGST.toFixed(2);
    if (inputGrandTotal) inputGrandTotal.value = grandTotalRounded.toFixed(2);

    // Show/hide CGST/SGST vs IGST rows based on transaction type
    const isIntraState = isIntraStateTransaction();
    const cgstRow = document.getElementById('row_cgst');
    const sgstRow = document.getElementById('row_sgst');
    const igstRow = document.getElementById('row_igst');

    if (cgstRow) cgstRow.style.display = isIntraState ? 'flex' : 'none';
    if (sgstRow) sgstRow.style.display = isIntraState ? 'flex' : 'none';
    if (igstRow) igstRow.style.display = isIntraState ? 'none' : 'flex';
}
