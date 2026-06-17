/* ============================================
   ROUTING-FORM.JS - Form Handling & Row Management
   Pioneer Adhesives Routing Template System
   
   Manages the routing table rows, adding/removing
   rows, and saving routing documents.
   ============================================ */

/**
 * Add a new activity row to the routing table
 * @param {string} activityName - Activity name
 * @param {number|string} pax - Number of workers
 * @param {number|string} machine - Number of machines
 * @param {number|string} time - Time in minutes
 */
function addRow(activityName = '', pax = '', machine = '', time = '') {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;

  const tr = document.createElement('tr');

  const isDisabled = !App.isFormEditable ? 'disabled' : '';
  const displayBtn = App.isFormEditable ? 'inline-flex' : 'none';

  tr.innerHTML = `
    <td class="bg-excel-yellow p-0">
      <input type="text"
             class="excel-input text-left"
             value="${sanitizeInput(activityName)}"
             oninput="syncActivityName(this); calculateAll();"
             ${isDisabled}>
    </td>
    <td class="bg-excel-yellow p-0">
      <input type="number"
             class="excel-input pax-input"
             value="${pax}"
             min="0"
             oninput="calculateAll()"
             ${isDisabled}>
    </td>
    <td class="bg-excel-yellow p-0">
      <input type="number"
             class="excel-input machine-input"
             value="${machine}"
             min="0"
             oninput="calculateAll()"
             ${isDisabled}>
    </td>
    <td class="bg-excel-yellow p-0">
      <input type="number"
             step="0.0001"
             class="excel-input time-input"
             value="${time}"
             min="0"
             oninput="calculateAll()"
             ${isDisabled}>
    </td>

    <!-- Computed cells -->
    <td class="cell-computed run-time-cell">0.00000</td>
    <td class="cell-computed">UNIT</td>
    <td class="cell-computed labor-min-cell">0.00</td>
    <td class="cell-computed mc-min-cell">0.00</td>

    <!-- BOM cells -->
    <td class="cell-bom w-bom-activity sync-activity-cell">${sanitizeInput(activityName)}</td>
    <td class="cell-bom dl-units-cell">0</td>
    <td class="cell-bom dl-cell">0.00000</td>
    <td class="cell-bom voh-cell">0.00000</td>
    <td class="cell-bom foh-cell">0.00000</td>

    <!-- Action -->
    <td class="action-column">
      <button onclick="removeRow(this)"
              class="btn btn--danger btn-remove-row"
              style="display:${displayBtn}"
              title="Remove Row">
        &times;
      </button>
    </td>
  `;

  tbody.appendChild(tr);
  calculateAll();
}

/**
 * Remove a row from the routing table
 * @param {HTMLButtonElement} btn - The remove button clicked
 */
function removeRow(btn) {
  const row = btn.closest('tr');
  if (row) {
    row.remove();
    calculateAll();
  }
}

/**
 * Save the current routing document
 * Collects form data and stores it in the mock database
 */
function saveRoutingDocument() {
  const itemCode = document.getElementById('itemCode')?.value.trim();
  const skuDesc = document.getElementById('skuDesc')?.value.trim();
  const prodLine = document.getElementById('prodLine')?.value;
  const qty = document.getElementById('qtyInput')?.value;

  // Validation
  if (!itemCode) {
    alert('Please enter an Item Code.');
    return;
  }
  if (!skuDesc) {
    alert('Please enter an SKU Description.');
    return;
  }
  if (!prodLine) {
    alert('Please select a Production Line.');
    return;
  }

  // Collect activities from table
  const activities = [];
  const rows = document.querySelectorAll('#tableBody tr');

  rows.forEach(row => {
    const activityName = row.querySelector('input[type="text"]')?.value.trim();
    const pax = parseFloat(row.querySelector('.pax-input')?.value) || 0;
    const machine = parseFloat(row.querySelector('.machine-input')?.value) || 0;
    const time = parseFloat(row.querySelector('.time-input')?.value) || 0;

    if (activityName) {
      activities.push({
        activities: activityName,
        pax,
        machine,
        time_min: time
      });
    }
  });

  // Build record
  const record = {
    inventory_id: itemCode,
    revision_descr: skuDesc,
    qty: parseFloat(qty) || 1,
    production_line_code: prodLine,
    production_line: LINE_DESCRIPTIONS[prodLine] || prodLine,
    product_type: App.currentMode === 'BM' ? 'Base Material (BM)' : 'Finished Good (FG)',
    activities
  };

  // Save to mock database
  saveRoutingRecord(itemCode, record);

  // Show success message
  const action = App.currentState === AppState.UPDATE ? 'updated' : 'saved';
  alert(`Routing document ${action} successfully!\n\nItem Code: ${itemCode}\nSKU: ${skuDesc}\nLine: ${prodLine}`);
}

/**
 * Load routing data into the form
 * @param {Object} data - The routing record data
 */
function loadDataIntoForm(data) {
  // Determine FG or BM mode
  const isBM = isBulkMaterial(data.product_type);
  setMode(isBM ? 'BM' : 'FG');

  // Fill form fields
  const itemCodeEl = document.getElementById('itemCode');
  const skuDescEl = document.getElementById('skuDesc');
  const qtyInputEl = document.getElementById('qtyInput');
  const prodLineEl = document.getElementById('prodLine');

  if (itemCodeEl) itemCodeEl.value = data.inventory_id || '';
  if (skuDescEl) skuDescEl.value = data.revision_descr || '';
  if (qtyInputEl) qtyInputEl.value = data.qty || 1;
  if (prodLineEl) {
    prodLineEl.value = data.production_line_code || '';
    updateLineDescription();
  }

  // Clear and repopulate table rows
  const tableBody = document.getElementById('tableBody');
  if (tableBody) {
    tableBody.innerHTML = '';
  }

  if (data.activities && data.activities.length > 0) {
    data.activities.forEach(act => {
      const name = act.activities || act.name || '';
      const pax = act.pax || 0;
      const machine = act.machine || 0;
      const time = act.time_min || act.time || 0;
      addRow(name, pax, machine, time);
    });
  } else {
    addRow('', '', '', '');
  }

  calculateAll();
}

// Expose globally
window.addRow = addRow;
window.removeRow = removeRow;
window.saveRoutingDocument = saveRoutingDocument;
window.loadDataIntoForm = loadDataIntoForm;
