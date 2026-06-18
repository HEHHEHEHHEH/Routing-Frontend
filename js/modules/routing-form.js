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

  var isDisabled  = !App.isFormEditable ? 'disabled' : '';
  var displayBtn  = App.isFormEditable  ? 'inline-flex' : 'none';

  tr.innerHTML = `
    <td class="bg-activity-green p-0">
      <select class="activity-select"
              onchange="syncActivityName(this); _updateActivityLabel(this); calculateAll();"
              ${isDisabled}>
      </select>
      <span class="activity-label"></span>
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
    <td class="bg-excel-yellow p-0" style="position:relative;">
      <input type="text"
             class="excel-input time-input"
             value="${time}"
             readonly
             onclick="openTimeFormulaModal(this)"
             style="cursor:pointer;"
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

  // Populate activity dropdown for this row
  const select = tr.querySelector('.activity-select');
  if (select) {
    _populateActivitySelect(select, activityName);
    _updateActivityLabel(select);
  }

  updateDelColumnVisibility();
  calculateAll();
}

/**
 * Populate an activity <select> with options from the current production line.
 * Always includes the current value as an option even if not in the line list.
 * @param {HTMLSelectElement} selectEl
 * @param {string} currentValue - Pre-selected activity name
 */
function _populateActivitySelect(selectEl, currentValue) {
  const prodLine   = document.getElementById('prodLine')?.value || '';
  const activities = getLineActivities(prodLine);

  selectEl.innerHTML = '';

  // Blank option
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '-- Select Activity --';
  selectEl.appendChild(blank);

  // Add activities from line
  activities.forEach(act => {
    const opt = document.createElement('option');
    opt.value = act;
    opt.textContent = act;
    if (act === currentValue) opt.selected = true;
    selectEl.appendChild(opt);
  });

  // If currentValue is set but not in the list, add it as a custom option
  if (currentValue && !activities.includes(currentValue)) {
    const customOpt = document.createElement('option');
    customOpt.value       = currentValue;
    customOpt.textContent = currentValue;
    customOpt.selected    = true;
    selectEl.appendChild(customOpt);
  }

  // If nothing matched, select blank
  if (!currentValue) selectEl.value = '';
}

/**
 * Refresh all activity dropdowns in the table (called when production line changes).
 */
function refreshAllActivityDropdowns() {
  document.querySelectorAll('#tableBody .activity-select').forEach(select => {
    const currentVal = select.value;
    _populateActivitySelect(select, currentVal);
    _updateActivityLabel(select);
  });
}

/**
 * Sync the plain-text label span beside the <select> with its current value.
 * The label is shown in LOOKUP (read-only) mode via CSS; hidden in edit modes.
 * @param {HTMLSelectElement} selectEl
 */
function _updateActivityLabel(selectEl) {
  const label = selectEl.parentElement?.querySelector('.activity-label');
  if (!label) return;
  const selectedOption = selectEl.options[selectEl.selectedIndex];
  label.textContent = (selectedOption && selectedOption.value) ? selectedOption.textContent : '';
}

/**
 * Toggle visibility of the DEL column based on form editable state.
 */
function updateDelColumnVisibility() {
  const table = document.getElementById('routingTable');
  if (!table) return;
  if (App.isFormEditable) {
    table.classList.remove('hide-del');
  } else {
    table.classList.add('hide-del');
  }
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
 * Save the current routing document.
 * Collects form data, calls the API, saves locally, then clears tab state.
 */
async function saveRoutingDocument() {
  var itemCode = document.getElementById('itemCode')?.value.trim();
  var skuDesc  = document.getElementById('skuDesc')?.value.trim();
  var prodLine = document.getElementById('prodLine')?.value;
  var qty      = document.getElementById('qtyInput')?.value;

  // Validation
  if (!itemCode) {
    await showModal({ icon: 'danger', title: 'Missing Field', message: 'Please enter an Item Code.', type: 'confirm', confirmLabel: 'OK' });
    return;
  }
  if (!skuDesc) {
    await showModal({ icon: 'danger', title: 'Missing Field', message: 'Please enter an SKU Description.', type: 'confirm', confirmLabel: 'OK' });
    return;
  }
  if (!prodLine) {
    await showModal({ icon: 'danger', title: 'Missing Field', message: 'Please select a Production Line.', type: 'confirm', confirmLabel: 'OK' });
    return;
  }

  // Collect activities from table
  var activities = [];
  document.querySelectorAll('#tableBody tr').forEach(function(row) {
    var activityName = row.querySelector('.activity-select')?.value.trim();
    var pax          = parseFloat(row.querySelector('.pax-input')?.value)     || 0;
    var machine      = parseFloat(row.querySelector('.machine-input')?.value) || 0;
    var time         = parseFloat(row.querySelector('.time-input')?.value)    || 0;

    if (activityName) {
      activities.push({
        activities:    activityName,  // internal name kept for local cache
        activity_name: activityName,  // API field name
        pax:           pax,
        machine:       machine,
        time_min:      time
      });
    }
  });

  // Build record (internal format)
  var isBM = App.currentMode === 'BM';
  var record = {
    inventory_id:         itemCode,
    revision_descr:       skuDesc,
    qty:                  parseFloat(qty) || 1,
    production_line_code: prodLine,
    production_line:      LINE_DESCRIPTIONS[prodLine] || prodLine,
    product_type:         isBM ? 'Base Material (BM)' : 'Finished Good (FG)',
    activities:           activities
  };

  var action = App.currentState === AppState.UPDATE ? 'updated' : 'saved';

  // --- Try API first (apiCreateItem / apiUpdateItem handle field mapping internally) ---
  try {
    let res;
    if (App.currentState === AppState.UPDATE) {
      res = await apiUpdateItem(itemCode, record);
    } else {
      res = await apiCreateItem(record);
    }
    if (!res.ok) {
      console.warn('[API] Save failed (status ' + res.status + '), saving locally.');
    }
  } catch (_) {
    console.warn('[API] Unreachable — saving to local mock-db only.');
  }

  // Always keep local cache in sync
  saveRoutingRecord(itemCode, record);

  // --- Clear saved tab state for this tab after a successful save ---
  clearTabFormState(App.currentState);

  await showModal({
    icon:         'info',
    title:        'Routing Document ' + (action.charAt(0).toUpperCase() + action.slice(1)),
    message:      'Routing document ' + action + ' successfully!\n\nItem Code: ' + itemCode + '\nSKU: ' + skuDesc + '\nLine: ' + prodLine,
    type:         'confirm',
    confirmLabel: 'OK',
  });
}

/**
 * Load routing data into the form
 * @param {Object} data - The routing record data
 */
function loadDataIntoForm(data) {
  // Determine FG or BM mode
  var isBM = isBulkMaterial(data.product_type);
  setMode(isBM ? 'BM' : 'FG');

  var itemCodeEl = document.getElementById('itemCode');
  var skuDescEl  = document.getElementById('skuDesc');
  var qtyInputEl = document.getElementById('qtyInput');
  var prodLineEl = document.getElementById('prodLine');

  if (itemCodeEl) itemCodeEl.value = data.inventory_id || '';
  if (skuDescEl)  skuDescEl.value  = data.revision_descr || '';
  if (qtyInputEl) qtyInputEl.value = data.qty || data.quantity || 1;
  if (prodLineEl) {
    // Support both internal and raw API field names
    prodLineEl.value = data.production_line_code
                    || data.fg_production_line_code
                    || data.bm_production_line_code
                    || '';
    updateLineDescription();
  }

  // Clear and repopulate table rows
  var tableBody = document.getElementById('tableBody');
  if (tableBody) tableBody.innerHTML = '';

  if (data.activities && data.activities.length > 0) {
    data.activities.forEach(function(act) {
      // Support both "activities" (internal) and "activity_name" (API) field names
      var name    = act.activities || act.activity_name || act.name || '';
      var pax     = act.pax     || 0;
      var machine = act.machine || 0;
      var time    = act.time_min || act.time || 0;
      addRow(name, pax, machine, time);
    });
  } else {
    addRow('', '', '', '');
  }

  calculateAll();
}


/* ============================================
   TIME FORMULA MODAL
   ============================================ */

/**
 * Open the Time Formula modal for a given time-input cell.
 * @param {HTMLInputElement} inputEl - The clicked time-input cell
 */
function openTimeFormulaModal(inputEl) {
  if (inputEl.disabled) return;

  const modal        = document.getElementById('timeFormulaModal');
  const formulaInput = document.getElementById('timeFormulaInput');
  const resultEl     = document.getElementById('timeFormulaResult');
  const applyBtn     = document.getElementById('timeFormulaApplyBtn');
  const cancelBtn    = document.getElementById('timeFormulaCancelBtn');
  const closeBtn     = document.getElementById('timeFormulaCloseBtn');

  if (!modal) return;

  // Pre-fill with existing raw formula or value
  const existing = inputEl.dataset.rawFormula || inputEl.value || '';
  formulaInput.value = existing;
  resultEl.textContent = '0.00000';

  // Evaluate on every keystroke
  function onFormulaInput() {
    const val = formulaInput.value.trim();
    if (!val) { resultEl.textContent = '0.00000'; return; }
    try {
      const expr   = val.replace(/^=/, '');
      const result = Function('"use strict"; return (' + expr + ')')();
      if (typeof result === 'number' && isFinite(result)) {
        resultEl.textContent = result.toFixed(5);
        resultEl.style.color = '#2563eb';
      } else {
        resultEl.textContent = 'Invalid';
        resultEl.style.color = '#dc2626';
      }
    } catch (e) {
      resultEl.textContent = 'Invalid';
      resultEl.style.color = '#dc2626';
    }
  }

  formulaInput.addEventListener('input', onFormulaInput);
  onFormulaInput();

  modal.style.display = 'flex';
  setTimeout(() => formulaInput.focus(), 50);

  function cleanup() {
    modal.style.display = 'none';
    formulaInput.removeEventListener('input', onFormulaInput);
    applyBtn.onclick  = null;
    cancelBtn.onclick = null;
    if (closeBtn) closeBtn.onclick = null;
  }

  function handleApply() {
    const raw = formulaInput.value.trim();
    if (!raw) { cleanup(); return; }
    try {
      const expr   = raw.replace(/^=/, '');
      const result = Function('"use strict"; return (' + expr + ')')();
      if (typeof result === 'number' && isFinite(result)) {
        inputEl.dataset.rawFormula = raw;
        inputEl.value = result.toFixed(5);
        calculateAll();
      }
    } catch (e) { /* Invalid formula — do nothing */ }
    cleanup();
  }

  function handleCancel() { cleanup(); }

  applyBtn.onclick  = handleApply;
  cancelBtn.onclick = handleCancel;
  if (closeBtn) closeBtn.onclick = handleCancel;

  function onKey(e) {
    if (e.key === 'Escape') { handleCancel(); document.removeEventListener('keydown', onKey); }
    if (e.key === 'Enter')  { handleApply();  document.removeEventListener('keydown', onKey); }
  }
  document.addEventListener('keydown', onKey);
}

// Expose globally
window.addRow                       = addRow;
window.removeRow                    = removeRow;
window.saveRoutingDocument          = saveRoutingDocument;
window.loadDataIntoForm             = loadDataIntoForm;
window.openTimeFormulaModal         = openTimeFormulaModal;
window.updateDelColumnVisibility    = updateDelColumnVisibility;
window.refreshAllActivityDropdowns  = refreshAllActivityDropdowns;
window._populateActivitySelect      = _populateActivitySelect;
window._updateActivityLabel         = _updateActivityLabel;