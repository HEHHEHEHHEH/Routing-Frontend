/* ============================================
   MAIN.JS - Application Entry Point
   Pioneer Adhesives Routing Template System
   
   Initializes the application, loads modules,
   and sets up the default view state.
   ============================================ */

/**
 * Module loading order:
 * 1. state.js       - Constants, enums, global state
 * 2. mock-db.js     - Data layer, mock database
 * 3. utils.js       - Helper functions
 * 4. calculations.js - Math engine
 * 5. view-controller.js - View state management
 * 6. routing-form.js - Form handling
 * 7. search.js      - Search engine
 * 8. manage-activities.js - Activity CRUD
 * 9. all-data.js    - Paginated table view
 * 10. tabs.js       - Tab controller/router
 *
 * All modules expose their functions globally via window.*
 * This entry point simply initializes the app.
 */

/**
 * Initialize the application
 */
function initApp() {
  console.log('Pioneer Adhesives Routing System - Initializing...');

  // Seed mock database with test data for pagination
  seedMockData(25);

  // Set default tab (ADD mode)
  switchTab(AppState.ADD);

  // Set default template mode
  setMode('FG');

  // Populate production line dropdown
  populateProdLineSelect();

  console.log('Initialization complete.');
  console.log(`Loaded ${Object.keys(mockRoutingDB).length} routing records`);
  console.log(`Loaded ${Object.keys(lineActivitiesDB).length} production lines with activities`);
}

/**
 * Populate the production line select dropdown
 */
function populateProdLineSelect() {
  const select = document.getElementById('prodLine');
  if (!select) return;

  // Keep the first option (placeholder)
  const placeholder = select.options[0];
  select.innerHTML = '';
  select.appendChild(placeholder);

  // Add sorted line options
  const lineCodes = Object.keys(LINE_DESCRIPTIONS).sort();
  lineCodes.forEach(code => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = code;
    select.appendChild(opt);
  });
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} e
 */
function handleKeyboardShortcuts(e) {
  // Ctrl/Cmd + S: Save document
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (App.currentState === AppState.ADD || App.currentState === AppState.UPDATE) {
      saveRoutingDocument();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
document.addEventListener('keydown', handleKeyboardShortcuts);

// Also expose init function globally for manual re-initialization
window.initApp = initApp;