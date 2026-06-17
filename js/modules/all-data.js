/* ============================================
   ALL-DATA.JS - Paginated Table View
   Pioneer Adhesives Routing Template System
   
   Displays all routing records with pagination.
   Supports viewing details of individual records.
   ============================================ */

/**
 * Render the paginated data table
 * Shows current page of routing records
 */
function renderAllData() {
  const dbArray = getAllRoutingRecords();
  const totalItems = dbArray.length;
  const totalPages = Math.ceil(totalItems / App.itemsPerPage) || 1;

  // Ensure valid page number
  if (App.currentPage < 1) App.currentPage = 1;
  if (App.currentPage > totalPages) App.currentPage = totalPages;

  const startIndex = (App.currentPage - 1) * App.itemsPerPage;
  const endIndex = Math.min(startIndex + App.itemsPerPage, totalItems);

  const paginatedData = dbArray.slice(startIndex, endIndex);
  const tbody = document.getElementById('allDataTableBody');

  if (!tbody) return;
  tbody.innerHTML = '';

  if (paginatedData.length === 0) {
    // Empty state
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="p-6 text-center text-gray-500 italic">
          No records found in database.
        </td>
      </tr>
    `;
  } else {
    // Render rows
    paginatedData.forEach(item => {
      const tr = document.createElement('tr');

      const itemCode = item.inventory_id || item.itemCode || 'N/A';
      const skuDesc = item.revision_descr || item.skuDesc || '';
      const lineCode = item.production_line_code || item.prodLine || '';
      const productType = item.product_type || '';
      const typeCode = getTypeShortCode(productType);
      const badgeClass = getTypeBadgeClass(productType);

      tr.innerHTML = `
        <td class="col-item-code">${sanitizeInput(itemCode)}</td>
        <td>${sanitizeInput(skuDesc)}</td>
        <td>${sanitizeInput(lineCode)}</td>
        <td>
          <span class="badge ${badgeClass}">${typeCode}</span>
        </td>
        <td class="text-center">
          <button onclick="viewFromAllData('${itemCode}')"
                  class="link-action">
            View Details
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  // Update pagination info
  const paginationInfo = document.getElementById('pagination-info');
  if (paginationInfo) {
    paginationInfo.textContent =
      `Showing ${totalItems === 0 ? 0 : startIndex + 1} to ${endIndex} of ${totalItems} entries`;
  }

  // Update button states
  const btnPrev = document.getElementById('btn-prev-page');
  const btnNext = document.getElementById('btn-next-page');

  if (btnPrev) btnPrev.disabled = App.currentPage === 1;
  if (btnNext) btnNext.disabled = App.currentPage === totalPages || totalPages === 0;
}

/**
 * Change the current page
 * @param {number} delta - +1 for next, -1 for previous
 */
function changePage(delta) {
  App.currentPage += delta;
  renderAllData();
}

/**
 * View a record's details from the All Data table
 * Switches to LOOKUP tab and searches for the item
 * @param {string} itemCode
 */
function viewFromAllData(itemCode) {
  if (!itemCode) return;

  // Switch to lookup tab
  switchTab(AppState.LOOKUP);

  // Set search value
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = itemCode;
  }

  // Perform search
  performSearch();
}

// Expose globally
window.renderAllData = renderAllData;
window.changePage = changePage;
window.viewFromAllData = viewFromAllData;
