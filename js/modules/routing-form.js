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
function addRow(activityName, pax, machine, time) {
  var tbody = document.getElementById('tableBody');
  if (!tbody) return;

  var tr = document.createElement('tr');

  var isDisabled = !App.isFormEditable ? 'disabled' : '';
  var displayBtn = App.isFormEditable ? 'inline-flex' : 'none';

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
      <input type="text"
             class="excel-input time-input"
             value="${time}"
             onblur="evaluateTimeFormula(this)"
             onfocus="restoreTimeFormula(this)"
             onkeydown="handleTimeKeydown(event, this)"
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
  var row = btn.closest('tr');
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
  var itemCode = document.getElementById('itemCode')?.value.trim();
  var skuDesc = document.getElementById('skuDesc')?.value.trim();
  var prodLine = document.getElementById('prodLine')?.value;
  var qty = document.getElementById('qtyInput')?.value;

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
  var activities = [];
  var rows = document.querySelectorAll('#tableBody tr');

  rows.forEach(function(row) {
    var activityName = row.querySelector('input[type="text"]')?.value.trim();
    var pax = parseFloat(row.querySelector('.pax-input')?.value) || 0;
    var machine = parseFloat(row.querySelector('.machine-input')?.value) || 0;
    var time = parseFloat(row.querySelector('.time-input')?.value) || 0;

    if (activityName) {
      activities.push({
        activities: activityName,
        pax: pax,
        machine: machine,
        time_min: time
      });
    }
  });

  // Build record
  var record = {
    inventory_id: itemCode,
    revision_descr: skuDesc,
    qty: parseFloat(qty) || 1,
    production_line_code: prodLine,
    production_line: LINE_DESCRIPTIONS[prodLine] || prodLine,
    product_type: App.currentMode === 'BM' ? 'Base Material (BM)' : 'Finished Good (FG)',
    activities: activities
  };

  // Save to mock database
  saveRoutingRecord(itemCode, record);

  // Show success message
  var action = App.currentState === AppState.UPDATE ? 'updated' : 'saved';
  alert('Routing document ' + action + ' successfully!\n\nItem Code: ' + itemCode + '\nSKU: ' + skuDesc + '\nLine: ' + prodLine);
}

/**
 * Load routing data into the form
 * @param {Object} data - The routing record data
 */
function loadDataIntoForm(data) {
  // Determine FG or BM mode
  var isBM = isBulkMaterial(data.product_type);
  setMode(isBM ? 'BM' : 'FG');

  // Fill form fields
  var itemCodeEl = document.getElementById('itemCode');
  var skuDescEl = document.getElementById('skuDesc');
  var qtyInputEl = document.getElementById('qtyInput');
  var prodLineEl = document.getElementById('prodLine');

  if (itemCodeEl) itemCodeEl.value = data.inventory_id || '';
  if (skuDescEl) skuDescEl.value = data.revision_descr || '';
  if (qtyInputEl) qtyInputEl.value = data.qty || 1;
  if (prodLineEl) {
    prodLineEl.value = data.production_line_code || '';
    updateLineDescription();
  }

  // Clear and repopulate table rows
  var tableBody = document.getElementById('tableBody');
  if (tableBody) {
    tableBody.innerHTML = '';
  }

  if (data.activities && data.activities.length > 0) {
    data.activities.forEach(function(act) {
      var name = act.activities || act.name || '';
      var pax = act.pax || 0;
      var machine = act.machine || 0;
      var time = act.time_min || act.time || 0;
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