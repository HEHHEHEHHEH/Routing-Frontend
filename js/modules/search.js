/* ============================================
   SEARCH.JS - Database Search Engine
   Pioneer Adhesives Routing Template System
   
   Handles search functionality for LOOKUP and
   UPDATE modes. Searches mockRoutingDB by
   inventory ID (item code).
   ============================================ */

/**
 * Perform a search in the mock database
 * Triggered by the search button in LOOKUP/UPDATE modes
 */
function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const statusLabel = document.getElementById('search-status');

  if (!searchInput || !statusLabel) return;

  const query = searchInput.value.trim().toUpperCase();

  // Validation
  if (!query) {
    statusLabel.textContent = 'Please enter an item code.';
    statusLabel.className = 'search-status search-status--error';
    return;
  }

  // Search database
  const data = getRoutingRecord(query);

  if (data) {
    // Record found
    statusLabel.textContent = `Record found for ${query}.`;
    statusLabel.className = 'search-status search-status--success';

    loadDataIntoForm(data);

    // Configure editability based on current state
    if (App.currentState === AppState.UPDATE) {
      setFormEditable(true);
      // Keep item code disabled to prevent ID changes during update
      const itemCodeEl = document.getElementById('itemCode');
      if (itemCodeEl) itemCodeEl.disabled = true;
    } else {
      // LOOKUP mode - read only
      setFormEditable(false);
    }
  } else {
    // Not found
    statusLabel.textContent = `No record found for ${query}.`;
    statusLabel.className = 'search-status search-status--error';
    clearForm();
    setFormEditable(false);
  }
}

/**
 * Handle enter key press in search input
 * @param {KeyboardEvent} event
 */
function handleSearchKeypress(event) {
  if (event.key === 'Enter') {
    performSearch();
  }
}

/**
 * Quick search for an item code (used from All Data view)
 * @param {string} itemCode
 */
function quickSearch(itemCode) {
  if (!itemCode) return;

  // Switch to lookup tab
  switchTab(AppState.LOOKUP);

  // Set search value and trigger search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = itemCode;
  }

  performSearch();
}

// Expose globally
window.performSearch = performSearch;
window.handleSearchKeypress = handleSearchKeypress;
window.quickSearch = quickSearch;
