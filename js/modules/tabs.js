/* ============================================
   TABS.JS - Tab Controller & Router
   Pioneer Adhesives Routing Template System
   
   Manages switching between the 5 main views:
   ADD, LOOKUP, UPDATE, MANAGE, ALLDATA
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
 * Switch to a different tab/view
 * Central routing function that handles all view transitions
 * @param {string} tabId - The AppState value to switch to
 */
function switchTab(tabId) {
  // Update global state
  App.currentState = tabId;

  // Reset all tab styles
  Object.values(TAB_ELEMENTS).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.className = 'nav-tab nav-tab--inactive';
    }
  });

  // Set active tab style
  const activeTabId = TAB_ELEMENTS[tabId];
  if (activeTabId) {
    const activeEl = document.getElementById(activeTabId);
    if (activeEl) {
      activeEl.className = 'nav-tab nav-tab--active';
    }
  }

  // Show/hide views based on tab
  routeToView(tabId);
}

/**
 * Route to the appropriate view based on state
 * @param {string} state
 */
function routeToView(state) {
  const viewRouting = document.getElementById('view-routing');
  const viewManage = document.getElementById('view-manage');
  const viewAllData = document.getElementById('view-alldata');

  switch (state) {
    case AppState.ADD:
      showRoutingView(viewRouting, viewManage, viewAllData, 'add');
      break;
    case AppState.LOOKUP:
      showRoutingView(viewRouting, viewManage, viewAllData, 'lookup');
      break;
    case AppState.UPDATE:
      showRoutingView(viewRouting, viewManage, viewAllData, 'update');
      break;
    case AppState.MANAGE:
      showManageView(viewRouting, viewManage, viewAllData);
      break;
    case AppState.ALLDATA:
      showAllDataView(viewRouting, viewManage, viewAllData);
      break;
    default:
      console.warn('Unknown tab state:', state);
      showRoutingView(viewRouting, viewManage, viewAllData, 'add');
  }
}

/**
 * Configure and show the routing form view (ADD/LOOKUP/UPDATE)
 */
function showRoutingView(viewRouting, viewManage, viewAllData, mode) {
  viewRouting.classList.remove('hidden');
  viewManage.classList.add('hidden');
  viewAllData.classList.add('hidden');

  const searchSection = document.getElementById('search-section');
  const saveBtn = document.getElementById('save-section');
  const searchStatus = document.getElementById('search-status');

  if (mode === 'add') {
    // ADD mode: fresh form, editable
    searchSection.classList.add('hidden');
    saveBtn.classList.remove('hidden');
    clearForm();
    setFormEditable(true);
  } else if (mode === 'lookup') {
    // LOOKUP mode: search required, read-only
    searchSection.classList.remove('hidden');
    saveBtn.classList.add('hidden');
    clearForm();
    setFormEditable(false);
    if (searchStatus) {
      searchStatus.textContent = 'Search to view a record in Read-Only mode.';
      searchStatus.className = 'search-status search-status--neutral';
    }
  } else if (mode === 'update') {
    // UPDATE mode: search required, editable after search
    searchSection.classList.remove('hidden');
    saveBtn.classList.remove('hidden');
    clearForm();
    setFormEditable(false);
    if (searchStatus) {
      searchStatus.textContent = 'Search to find a record to edit.';
      searchStatus.className = 'search-status search-status--neutral';
    }
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
  renderAllData();
}

// Expose globally
window.switchTab = switchTab;
window.routeToView = routeToView;