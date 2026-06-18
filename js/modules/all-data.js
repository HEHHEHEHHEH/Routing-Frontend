/* ============================================
   ALL-DATA.JS - Paginated Table View
   Pioneer Adhesives Routing Template System

   Displays all routing records with pagination.
   Loads from API on init (limit=1000 to get all
   records), falls back to mock-db on failure.
   ============================================ */

/**
 * Load all records from API into local cache, then render.
 * Passes limit=1000 (API max) to ensure we get all 491 entries.
 */
async function loadAndRenderAllData() {
  // Show a loading indicator
  const tbody = document.getElementById('allDataTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="p-6 text-center text-gray-500 italic">
          Loading records from server...
        </td>
      </tr>`;
  }

  try {
    // Use limit=1000 (API max) so we retrieve every record, not just the default 50
    const res = await apiGetItems('', 1000);
    if (res.ok && Array.isArray(res.data)) {
      // Sync API response into local mock-db cache using normalized fields
      res.data.forEach(item => {
        const key = (item.inventory_id || item.item_code || '').toUpperCase();
        if (!key) return;

        // Normalize API item to internal format before caching
        const normalized = _normalizeApiItem(item);
        if (normalized) {
          saveRoutingRecord(key, normalized);
        }
      });
      console.log(`[API] Loaded ${res.data.length} items into local cache.`);
    } else {
      console.warn('[API] Could not load items (status ' + res.status + '), using local cache.');
    }
  } catch (_) {
    console.warn('[API] Unreachable — displaying local cache.');
  }
  renderAllData();
}

/**
 * Render the paginated data table from local cache.
 */
function renderAllData() {
  const dbArray = getAllRoutingRecords();
  const totalItems = dbArray.length;
  const totalPages = Math.ceil(totalItems / App.itemsPerPage) || 1;

  if (App.currentPage < 1) App.currentPage = 1;
  if (App.currentPage > totalPages) App.currentPage = totalPages;

  const startIndex = (App.currentPage - 1) * App.itemsPerPage;
  const endIndex = Math.min(startIndex + App.itemsPerPage, totalItems);
  const paginatedData = dbArray.slice(startIndex, endIndex);
  const tbody = document.getElementById('allDataTableBody');

  if (!tbody) return;
  tbody.innerHTML = '';

  if (paginatedData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="p-6 text-center text-gray-500 italic">
          No records found in database.
        </td>
      </tr>`;
  } else {
    paginatedData.forEach(item => {
      const tr = document.createElement('tr');

      // Support both internal and raw API field names
      const itemCode    = item.inventory_id || item.itemCode || 'N/A';
      const skuDesc     = item.revision_descr || item.skuDesc || '';
      // production_line_code may come from fg or bm fields
      const lineCode    = item.production_line_code
                        || item.fg_production_line_code
                        || item.bm_production_line_code
                        || item.prodLine
                        || '';
      const productType  = item.product_type || '';
      const typeCode    = getTypeShortCode(productType);
      const badgeClass  = getTypeBadgeClass(productType);

      tr.innerHTML = `
        <td class="col-item-code">${sanitizeInput(itemCode)}</td>
        <td>${sanitizeInput(skuDesc)}</td>
        <td>${sanitizeInput(lineCode)}</td>
        <td><span class="badge ${badgeClass}">${typeCode}</span></td>
        <td class="text-center">
          <button onclick="viewFromAllData('${sanitizeInput(itemCode)}')" class="link-action">
            View Details
          </button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  const paginationInfo = document.getElementById('pagination-info');
  if (paginationInfo) {
    paginationInfo.textContent =
      `Showing ${totalItems === 0 ? 0 : startIndex + 1} to ${endIndex} of ${totalItems} entries`;
  }

  const btnPrev = document.getElementById('btn-prev-page');
  const btnNext = document.getElementById('btn-next-page');
  if (btnPrev) btnPrev.disabled = App.currentPage === 1;
  if (btnNext) btnNext.disabled = App.currentPage === totalPages || totalPages === 0;
}

/**
 * Change the current page.
 */
function changePage(delta) {
  App.currentPage += delta;
  renderAllData();
}

/**
 * View a record's details from the All Data table.
 */
function viewFromAllData(itemCode) {
  if (!itemCode) return;
  switchTab(AppState.LOOKUP);
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = itemCode;
  performSearch();
}

window.loadAndRenderAllData = loadAndRenderAllData;
window.renderAllData        = renderAllData;
window.changePage           = changePage;
window.viewFromAllData      = viewFromAllData;