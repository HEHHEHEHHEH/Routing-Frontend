/* ============================================
   VIEW-CONTROLLER.JS - View State Manager
   Pioneer Adhesives Routing Template System
   
   Controls form editability, visibility states,
   and UI mode toggles (FG/BM).
   ============================================ */
 
/**
 * Set the template mode (FG or BM)
 * Updates UI labels and triggers recalculation
 * @param {string} mode - 'FG' or 'BM'
 */
function setMode(mode) {
  App.currentMode = mode;
 
  const btnFg = document.getElementById('btn-fg');
  const btnBm = document.getElementById('btn-bm');
  const qtyLabel = document.getElementById('qtyLabel');
 
  if (mode === 'FG') {
    btnFg.className = 'mode-btn mode-btn--active';
    btnBm.className = 'mode-btn';
    if (qtyLabel) qtyLabel.textContent = getQtyLabel('FG');
  } else {
    btnBm.className = 'mode-btn mode-btn--active';
    btnFg.className = 'mode-btn';
    if (qtyLabel) qtyLabel.textContent = getQtyLabel('BM');
  }
 
  calculateAll();
}
 
/**
 * Update the line description based on selected production line
 */
function updateLineDescription() {
  const select = document.getElementById('prodLine');
  const desc = document.getElementById('lineDesc');
  if (select && desc) {
    desc.value = LINE_DESCRIPTIONS[select.value] || '';
  }
  // Refresh activity dropdowns to match the newly selected line
  if (typeof refreshAllActivityDropdowns === 'function') {
    refreshAllActivityDropdowns();
  }
}
 
/**
 * Enable or disable form fields based on state
 * @param {boolean} isEditable
 */
function setFormEditable(isEditable) {
  App.isFormEditable = isEditable;
 
  const fields = [
    'itemCode',
    'skuDesc',
    'qtyInput',
    'prodLine'
  ];
 
  // Enable/disable main form inputs
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = !isEditable;
  });
 
  // Enable/disable mode buttons
  const btnFg = document.getElementById('btn-fg');
  const btnBm = document.getElementById('btn-bm');
  if (btnFg) btnFg.disabled = !isEditable;
  if (btnBm) btnBm.disabled = !isEditable;
 
  // Enable/disable table inputs
  document.querySelectorAll('#tableBody input').forEach(input => {
    input.disabled = !isEditable;
  });
 
  // Enable/disable activity dropdowns
  document.querySelectorAll('#tableBody .activity-select').forEach(sel => {
    sel.disabled = !isEditable;
  });
 
  // Show/hide action buttons
  const addRowBtn = document.getElementById('btn-add-row');
  if (addRowBtn) {
    addRowBtn.style.display = isEditable ? 'inline-flex' : 'none';
  }
 
  document.querySelectorAll('.btn-remove-row').forEach(btn => {
    btn.style.display = isEditable ? 'inline-flex' : 'none';
  });
}
 
/**
 * Clear the entire routing form
 */
function clearForm() {
  setMode('FG');
 
  const fields = {
    'itemCode': '',
    'skuDesc': '',
    'qtyInput': '1',
    'prodLine': '',
    'lineDesc': ''
  };
 
  Object.entries(fields).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
 
  const tableBody = document.getElementById('tableBody');
  if (tableBody) {
    tableBody.innerHTML = '';
  }
 
  // Add empty rows for ADD mode
  if (App.currentState === AppState.ADD) {
    addRow('', '', '', '');
    addRow('', '', '', '');
  }
 
  // Reset search status
  const searchStatus = document.getElementById('search-status');
  if (searchStatus) {
    searchStatus.textContent = '';
    searchStatus.className = 'search-status';
  }
 
  calculateAll();
}
 
/**
 * Sync activity name from input to the BOM side
 * @param {HTMLInputElement} input
 */
function syncActivityName(input) {
  const row = input.closest('tr');
  if (row) {
    const syncCell = row.querySelector('.sync-activity-cell');
    if (syncCell) {
      syncCell.textContent = input.value;
    }
  }
}
 
// Expose globally
window.setMode = setMode;
window.updateLineDescription = updateLineDescription;
window.setFormEditable = setFormEditable;
window.clearForm = clearForm;
window.syncActivityName = syncActivityName;