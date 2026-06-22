/* ============================================
   SEARCH.JS - Database Search Engine
   Pioneer Adhesives Routing Template System

   Handles search functionality for LOOKUP and
   UPDATE modes. Tries the API first, falls back
   to the local mock-db if the API is unreachable.
   ============================================ */

/**
 * Perform a search — API first, mock-db fallback.
 */
async function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const statusLabel = document.getElementById('search-status');

  if (!searchInput || !statusLabel) return;

  const query = searchInput.value.trim().toUpperCase();

  if (!query) {
    statusLabel.textContent = 'Please enter an item code.';
    statusLabel.className = 'search-status search-status--error';
    return;
  }

  // --- Try API first ---
  let data = null;
  try {
    const res = await apiGetItem(query);
    if (res.ok && res.data) {
      // Normalize API response to internal field names
      data = _normalizeApiItem(res.data);
      // Keep local cache in sync
      saveRoutingRecord(query, data);
    }
  } catch (_) { /* API unreachable — fall through to mock-db */ }

  // --- Fallback to mock-db ---
  if (!data) {
    data = getRoutingRecord(query);
  }

  if (data) {
    statusLabel.textContent = `Record found for ${query}.`;
    statusLabel.className = 'search-status search-status--success';

    loadDataIntoForm(data);

    // Refresh dropdowns AFTER loadDataIntoForm has set the production line value,
    // so the correct activity list is available for the selected line.
    if (typeof refreshAllActivityDropdowns === 'function') {
      refreshAllActivityDropdowns();
    }

    if (App.currentState === AppState.UPDATE) {
      setFormEditable(true);
      const itemCodeEl = document.getElementById('itemCode');
      if (itemCodeEl) itemCodeEl.disabled = true;
      _setUpdateActionButtonsVisible(true);
    } else {
      // LOOKUP mode: populate plain-text display spans
      _populateLookupDisplay(data);
      setFormEditable(false);
      _setUpdateActionButtonsVisible(false);
    }
  } else {
    statusLabel.textContent = `No record found for ${query}.`;
    statusLabel.className = 'search-status search-status--error';
    clearForm();
    setFormEditable(false);
    _setUpdateActionButtonsVisible(false);
  }
}

/**
 * Show or hide the Update/Delete action buttons in the UPDATE tab header area.
 * These buttons replace the bottom Save button for the UPDATE tab only.
 * @param {boolean} visible
 */
function _setUpdateActionButtonsVisible(visible) {
  const el = document.getElementById('update-action-buttons');
  if (el) el.style.display = visible ? 'flex' : 'none';
}

/**
 * Handle the Update action: save the routing document via API.
 * Identical to saveRoutingDocument() but always treats state as UPDATE.
 */
async function handleUpdateItem() {
  await saveRoutingDocument();
}

/**
 * Handle the Delete action: confirm then delete item via API and local cache.
 */
async function handleDeleteItem() {
  const itemCode = document.getElementById('itemCode')?.value.trim();
  if (!itemCode) return;

  const r = await showModal({
    icon: 'danger',
    title: 'Delete Routing Record',
    message: `Permanently delete routing record for "${itemCode}"? This action cannot be undone.`,
    type: 'confirm',
    confirmStyle: 'danger',
    confirmLabel: 'Yes, Delete',
  });
  if (!r.confirmed) return;

  // --- Try API first ---
  try {
    const res = await apiDeleteItem(itemCode);
    if (!res.ok) console.warn('[API] Delete item failed (status ' + res.status + '), removing locally.');
  } catch (_) {
    console.warn('[API] Unreachable — deleting from local cache only.');
  }

  // Remove from local cache
  delete mockRoutingDB[itemCode.toUpperCase()];

  // Clear tab state and reset form
  clearTabFormState(AppState.UPDATE);
  clearForm();
  setFormEditable(false);
  _setUpdateActionButtonsVisible(false);

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  const statusLabel = document.getElementById('search-status');
  if (statusLabel) {
    statusLabel.textContent = `Record "${itemCode}" deleted successfully.`;
    statusLabel.className = 'search-status search-status--success';
  }
}

/**
 * Handle enter key press in search input.
 */
function handleSearchKeypress(event) {
  if (event.key === 'Enter') performSearch();
}

/**
 * Quick search from All Data view.
 */
function quickSearch(itemCode) {
  if (!itemCode) return;
  switchTab(AppState.LOOKUP);
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = itemCode;
  performSearch();
}

/**
 * Populate the LOOKUP plain-text display spans from a record.
 * @param {Object} data - The routing record
 */
function _populateLookupDisplay(data) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '';
  };

  set('ld-itemCode', data.inventory_id || '');
  set('ld-skuDesc',  data.revision_descr || '');
  set('ld-qty',      data.qty || data.quantity || 1);
  set('ld-notes',    data.notes || '');
  set('ld-mode',     data.product_type
                       ? (data.product_type.includes('Base') ? 'BM' : 'FG')
                       : (App.currentMode || 'FG'));
  set('ld-prodLine', data.production_line_code
                       || data.fg_production_line_code
                       || data.bm_production_line_code
                       || '');
  // Line description from LINE_DESCRIPTIONS lookup
  const lineCode = data.production_line_code
                || data.fg_production_line_code
                || data.bm_production_line_code
                || '';
  set('ld-lineDesc', LINE_DESCRIPTIONS[lineCode] || data.production_line || '');
}

window.performSearch                  = performSearch;
window.handleSearchKeypress           = handleSearchKeypress;
window.quickSearch                    = quickSearch;
window._setUpdateActionButtonsVisible = _setUpdateActionButtonsVisible;
window.handleUpdateItem               = handleUpdateItem;
window.handleDeleteItem               = handleDeleteItem;