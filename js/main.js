/* ============================================
   MAIN.JS - Application Entry Point
   Pioneer Adhesives Routing Template System
   
   Initializes the application, loads modules,
   and sets up the default view state.
   ============================================ */

/**
 * Module loading order:
 * 1. auth.js          - Authentication manager
 * 2. api-service.js   - Backend API client
 * 3. state.js         - Constants, enums, global state
 * 4. mock-db.js       - Data layer, mock database
 * 5. utils.js         - Helper functions
 * 6. calculations.js  - Math engine
 * 7. view-controller.js - View state management
 * 8. routing-form.js  - Form handling
 * 9. search.js        - Search engine
 * 10. manage-activities.js - Activity CRUD
 * 11. all-data.js     - Paginated table view
 * 12. admin-panel.js  - Admin panel (user management)
 * 13. logs.js         - Audit logs view
 * 14. tabs.js         - Tab controller/router
 *
 * All modules expose their functions globally via window.*
 * This entry point simply initializes the app.
 */

/**
 * Initialize the application
 */
async function initApp() {
  console.log('Pioneer Adhesives Routing System - Initializing...');

  // --- Authentication gate: blocks until user is logged in ---
  await Auth.init();

  // --- Initialize admin tabs visibility based on role ---
  _refreshAdminTabs();

  // --- Load production lines from API into local cache ---
  try {
    const res = await apiGetProductionLines();
    if (res.ok && Array.isArray(res.data)) {
      res.data.forEach(line => {
        // API returns production_line_code and production_line_name
        // apiGetProductionLines() normalizes these to code/line_code and description/desc
        const code = line.production_line_code || line.line_code || line.code;
        const desc = line.production_line_name  || line.description || line.desc || code;

        if (code) {
          LINE_DESCRIPTIONS[code] = desc;

          // Activities use activity_name field from API
          if (Array.isArray(line.activities) && line.activities.length > 0) {
            lineActivitiesDB[code] = line.activities.map(a =>
              a.activity_name || a.name || String(a)
            );
          } else if (!lineActivitiesDB[code]) {
            lineActivitiesDB[code] = [];
          }
        }
      });
      console.log(`[API] Production lines loaded: ${res.data.length} lines from server.`);
    } else {
      console.warn('[API] Could not load production lines, using local defaults.');
    }
  } catch (_) {
    console.warn('[API] Unreachable — using local production line defaults.');
  }

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
window.populateProdLineSelect = populateProdLineSelect; 