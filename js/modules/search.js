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

    if (typeof refreshAllActivityDropdowns === 'function') {
      refreshAllActivityDropdowns();
    }

    if (App.currentState === AppState.UPDATE) {
      setFormEditable(true);
      const itemCodeEl = document.getElementById('itemCode');
      if (itemCodeEl) itemCodeEl.disabled = true;
    } else {
      setFormEditable(false);
    }
  } else {
    statusLabel.textContent = `No record found for ${query}.`;
    statusLabel.className = 'search-status search-status--error';
    clearForm();
    setFormEditable(false);
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

window.performSearch        = performSearch;
window.handleSearchKeypress = handleSearchKeypress;
window.quickSearch          = quickSearch;