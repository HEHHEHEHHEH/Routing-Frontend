/* ============================================
   TABS.JS - Tab Controller & Router
   Pioneer Adhesives Routing Template System
   
   Manages switching between the 5 main views:
   ADD, LOOKUP, UPDATE, MANAGE, ALLDATA

   Tab form state is persisted across switches:
   - Before leaving a routing tab, form data is
     saved into TabFormState.
   - When returning to a routing tab, data is
     restored so the user doesn't lose their work.
   ============================================ */

/**
 * Tab ID to DOM element ID mapping
 */
const TAB_ELEMENTS = {
  [AppState.ADD]:     'tab-add',
  [AppState.LOOKUP]:  'tab-lookup',
  [AppState.UPDATE]:  'tab-update',
  [AppState.MANAGE]:  'tab-manage',
  [AppState.ALLDATA]: 'tab-alldata'
};

/**
 * Switch to a different tab/view.
 * Saves the current tab's form state before switching,
 * then restores the target tab's saved state if available.
 * @param {string} tabId - The AppState value to switch to
 */
function switchTab(tabId) {
  const previousState = App.currentState;

  // --- Save current tab form state before leaving ---
  // Only save routing form tabs (ADD/LOOKUP/UPDATE) and only when leaving them
  if (
    previousState !== tabId &&
    (previousState === AppState.ADD ||
     previousState === AppState.LOOKUP ||
     previousState === AppState.UPDATE)
  ) {
    saveTabFormState(previousState);
  }

  // Update global state
  App.currentState = tabId;

  // Reset all tab styles
  Object.values(TAB_ELEMENTS).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = 'nav-tab nav-tab--inactive';
  });

  // Set active tab style
  const activeTabId = TAB_ELEMENTS[tabId];
  if (activeTabId) {
    const activeEl = document.getElementById(activeTabId);
    if (activeEl) activeEl.className = 'nav-tab nav-tab--active';
  }

  // Route to the appropriate view
  routeToView(tabId, previousState);
}

/**
 * Route to the appropriate view based on state.
 * @param {string} state
 * @param {string} [previousState] - The state we switched FROM
 */
function routeToView(state, previousState) {
  const viewRouting = document.getElementById('view-routing');
  const viewManage  = document.getElementById('view-manage');
  const viewAllData = document.getElementById('view-alldata');

  switch (state) {
    case AppState.ADD:
      showRoutingView(viewRouting, viewManage, viewAllData, 'add', previousState);
      break;
    case AppState.LOOKUP:
      showRoutingView(viewRouting, viewManage, viewAllData, 'lookup', previousState);
      break;
    case AppState.UPDATE:
      showRoutingView(viewRouting, viewManage, viewAllData, 'update', previousState);
      break;
    case AppState.MANAGE:
      showManageView(viewRouting, viewManage, viewAllData);
      break;
    case AppState.ALLDATA:
      showAllDataView(viewRouting, viewManage, viewAllData);
      break;
    default:
      console.warn('Unknown tab state:', state);
      showRoutingView(viewRouting, viewManage, viewAllData, 'add', previousState);
  }
}

/**
 * Configure and show the routing form view (ADD/LOOKUP/UPDATE).
 * Restores saved tab state if available; otherwise sets defaults.
 * @param {string} mode - 'add' | 'lookup' | 'update'
 * @param {string} [previousState] - The state we came from
 */
function showRoutingView(viewRouting, viewManage, viewAllData, mode, previousState) {
  viewRouting.classList.remove('hidden');
  viewManage.classList.add('hidden');
  viewAllData.classList.add('hidden');

  const searchSection = document.getElementById('search-section');
  const saveBtn       = document.getElementById('save-section');
  const searchStatus  = document.getElementById('search-status');

  // Map mode string to AppState key for TabFormState lookup
  const tabKey = mode === 'add'    ? AppState.ADD
               : mode === 'lookup' ? AppState.LOOKUP
               : AppState.UPDATE;

  if (mode === 'add') {
    searchSection.classList.add('hidden');
    saveBtn.classList.remove('hidden');
    // Hide UPDATE-only action buttons when on other tabs
    if (typeof _setUpdateActionButtonsVisible === 'function') {
      _setUpdateActionButtonsVisible(false);
    }

    // Restore saved state or start fresh
    const restored = restoreTabFormState(AppState.ADD);
    if (!restored) {
      clearForm();
      setFormEditable(true);
    } else {
      // Re-apply editable state after restore
      setFormEditable(true);
    }
    updateDelColumnVisibility();

  } else if (mode === 'lookup') {
    searchSection.classList.remove('hidden');
    saveBtn.classList.add('hidden');
    // Hide UPDATE-only action buttons when on other tabs
    if (typeof _setUpdateActionButtonsVisible === 'function') {
      _setUpdateActionButtonsVisible(false);
    }

    // Restore saved state or start fresh
    const restored = restoreTabFormState(AppState.LOOKUP);
    if (!restored) {
      clearForm();
      setFormEditable(false);
      if (searchStatus) {
        searchStatus.textContent = 'Search to view a record in Read-Only mode.';
        searchStatus.className   = 'search-status search-status--neutral';
      }
    } else {
      // Keep the form read-only; restore editable state appropriately
      setFormEditable(false);
    }
    updateDelColumnVisibility();

  } else if (mode === 'update') {
    searchSection.classList.remove('hidden');
    saveBtn.classList.add('hidden'); // Save button is replaced by Update/Delete buttons in upper right

    // Restore saved state or start fresh
    const restored = restoreTabFormState(AppState.UPDATE);
    if (!restored) {
      clearForm();
      setFormEditable(false);
      _setUpdateActionButtonsVisible(false);
      if (searchStatus) {
        searchStatus.textContent = 'Search to find a record to edit.';
        searchStatus.className   = 'search-status search-status--neutral';
      }
    } else {
      // After restore, keep editable only if a record had been loaded
      // (If itemCode is filled, assume a record was loaded and form should be editable)
      const itemCodeEl = document.getElementById('itemCode');
      const hasRecord  = itemCodeEl && itemCodeEl.value.trim() !== '';
      setFormEditable(hasRecord);
      _setUpdateActionButtonsVisible(hasRecord);
      if (hasRecord) {
        // Item code itself stays locked (can't change it during update)
        if (itemCodeEl) itemCodeEl.disabled = true;
      } else if (searchStatus) {
        searchStatus.textContent = 'Search to find a record to edit.';
        searchStatus.className   = 'search-status search-status--neutral';
      }
    }
    updateDelColumnVisibility();
  }
}

/**
 * Show the manage activities view
 */
function showManageView(viewRouting, viewManage, viewAllData) {
  viewRouting.classList.add('hidden');
  viewAllData.classList.add('hidden');
  viewManage.classList.remove('hidden');
  initManageLines();
}

/**
 * Show the all data (paginated) view
 */
function showAllDataView(viewRouting, viewManage, viewAllData) {
  viewRouting.classList.add('hidden');
  viewManage.classList.add('hidden');
  viewAllData.classList.remove('hidden');
  App.currentPage = 1;
  // Load from API (falls back to local cache if unreachable)
  loadAndRenderAllData();
}

// Expose globally
window.switchTab    = switchTab;
window.routeToView  = routeToView;