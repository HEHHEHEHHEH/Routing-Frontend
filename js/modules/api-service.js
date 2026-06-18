/* ============================================
   API-SERVICE.JS - Backend API Integration
   Pioneer Adhesives Routing Template System

   Centralized API client for the ACU Routing API.
   All fetch calls go through this module.
   Replace API_BASE_URL with your server address.

   Endpoints (from apispec):
   --- Health ---
   GET  /api/health

   --- Items ---
   GET    /api/items                              Browse / search item codes
   POST   /api/items                              Create a new product
   GET    /api/items/{item_code}                  Look up routing details
   PATCH  /api/items/{item_code}                  Update product metadata
   DELETE /api/items/{item_code}                  Permanently delete a product
   POST   /api/items/{item_code}/activities       Add one activity to a product
   PATCH  /api/items/{item_code}/activities/{id}  Update one activity
   DELETE /api/items/{item_code}/activities/{id}  Remove one activity

   --- Production Lines ---
   GET    /api/production-lines                              List all lines + activities
   POST   /api/production-lines                              Create a new line
   GET    /api/production-lines/{line_code}                  Get a single line
   PATCH  /api/production-lines/{line_code}                  Rename a line
   PUT    /api/production-lines/{line_code}                  Replace line + activities atomically
   DELETE /api/production-lines/{line_code}                  Delete a line
   POST   /api/production-lines/{line_code}/activities       Add one activity to a line
   PATCH  /api/production-lines/{line_code}/activities/{id}  Update one line activity
   DELETE /api/production-lines/{line_code}/activities/{id}  Remove one line activity
   ============================================ */

const API_BASE_URL = 'http://192.168.50.119:5000'; // Change to your server URL

/**
 * Internal helper — perform a fetch request and return parsed JSON.
 * @param {string} path - API path (e.g. '/api/items')
 * @param {string} method - HTTP method
 * @param {Object|null} body - Request body (will be JSON-serialized)
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
async function _apiFetch(path, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }
  try {
    const response = await fetch(API_BASE_URL + path, options);
    let data = null;
    try { data = await response.json(); } catch (_) {}
    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    console.error('[API] Network error:', err);
    return { ok: false, status: 0, data: null };
  }
}

/* ============================================
   HEALTH
   ============================================ */

/** GET /api/health */
async function apiHealthCheck() {
  return _apiFetch('/api/health');
}

/* ============================================
   ITEMS
   ============================================ */

/**
 * GET /api/items
 * Browse / search item codes.
 * @param {string} [query] - Optional search query
 */
async function apiGetItems(query = '') {
  const qs = query ? `?q=${encodeURIComponent(query)}` : '';
  return _apiFetch(`/api/items${qs}`);
}

/**
 * POST /api/items
 * Create a new product with optional activities.
 * @param {Object} payload - { inventory_id, revision_descr, production_line_code, product_type, qty, activities[] }
 */
async function apiCreateItem(payload) {
  return _apiFetch('/api/items', 'POST', payload);
}

/**
 * GET /api/items/{item_code}
 * Look up an item's full routing details.
 * @param {string} itemCode
 */
async function apiGetItem(itemCode) {
  return _apiFetch(`/api/items/${encodeURIComponent(itemCode)}`);
}

/**
 * PATCH /api/items/{item_code}
 * Update product metadata. Revision is auto-incremented.
 * @param {string} itemCode
 * @param {Object} payload - Fields to update
 */
async function apiUpdateItem(itemCode, payload) {
  return _apiFetch(`/api/items/${encodeURIComponent(itemCode)}`, 'PATCH', payload);
}

/**
 * DELETE /api/items/{item_code}
 * Permanently delete a product and all its activities.
 * @param {string} itemCode
 */
async function apiDeleteItem(itemCode) {
  return _apiFetch(`/api/items/${encodeURIComponent(itemCode)}`, 'DELETE');
}

/**
 * POST /api/items/{item_code}/activities
 * Add one new activity to a product.
 * @param {string} itemCode
 * @param {Object} activity - { activities, pax, machine, time_min }
 */
async function apiAddItemActivity(itemCode, activity) {
  return _apiFetch(`/api/items/${encodeURIComponent(itemCode)}/activities`, 'POST', activity);
}

/**
 * PATCH /api/items/{item_code}/activities/{activity_id}
 * Update one specific activity by its ID.
 * @param {string} itemCode
 * @param {string|number} activityId
 * @param {Object} payload - Fields to update
 */
async function apiUpdateItemActivity(itemCode, activityId, payload) {
  return _apiFetch(
    `/api/items/${encodeURIComponent(itemCode)}/activities/${activityId}`,
    'PATCH',
    payload
  );
}

/**
 * DELETE /api/items/{item_code}/activities/{activity_id}
 * Remove one activity from a product.
 * @param {string} itemCode
 * @param {string|number} activityId
 */
async function apiDeleteItemActivity(itemCode, activityId) {
  return _apiFetch(
    `/api/items/${encodeURIComponent(itemCode)}/activities/${activityId}`,
    'DELETE'
  );
}

/* ============================================
   PRODUCTION LINES
   ============================================ */

/**
 * GET /api/production-lines
 * List all production lines and their activities.
 */
async function apiGetProductionLines() {
  return _apiFetch('/api/production-lines');
}

/**
 * POST /api/production-lines
 * Create a new production line.
 * @param {Object} payload - { line_code, description }
 */
async function apiCreateProductionLine(payload) {
  return _apiFetch('/api/production-lines', 'POST', payload);
}

/**
 * GET /api/production-lines/{line_code}
 * Get a single production line and its activities.
 * @param {string} lineCode
 */
async function apiGetProductionLine(lineCode) {
  return _apiFetch(`/api/production-lines/${encodeURIComponent(lineCode)}`);
}

/**
 * PATCH /api/production-lines/{line_code}
 * Rename a production line (code and/or description).
 * @param {string} lineCode
 * @param {Object} payload - { new_line_code?, description? }
 */
async function apiRenameProductionLine(lineCode, payload) {
  return _apiFetch(`/api/production-lines/${encodeURIComponent(lineCode)}`, 'PATCH', payload);
}

/**
 * PUT /api/production-lines/{line_code}
 * Replace a production line and its activities atomically.
 * @param {string} lineCode
 * @param {Object} payload - { description, activities[] }
 */
async function apiReplaceProductionLine(lineCode, payload) {
  return _apiFetch(`/api/production-lines/${encodeURIComponent(lineCode)}`, 'PUT', payload);
}

/**
 * DELETE /api/production-lines/{line_code}
 * Delete a production line and all its activities.
 * @param {string} lineCode
 */
async function apiDeleteProductionLine(lineCode) {
  return _apiFetch(`/api/production-lines/${encodeURIComponent(lineCode)}`, 'DELETE');
}

/**
 * POST /api/production-lines/{line_code}/activities
 * Add a single activity to a production line.
 * @param {string} lineCode
 * @param {Object} activity - { name } or { activity_name }
 */
async function apiAddLineActivity(lineCode, activity) {
  return _apiFetch(
    `/api/production-lines/${encodeURIComponent(lineCode)}/activities`,
    'POST',
    activity
  );
}

/**
 * PATCH /api/production-lines/{line_code}/activities/{activity_id}
 * Update a single activity on a production line.
 * @param {string} lineCode
 * @param {string|number} activityId
 * @param {Object} payload
 */
async function apiUpdateLineActivity(lineCode, activityId, payload) {
  return _apiFetch(
    `/api/production-lines/${encodeURIComponent(lineCode)}/activities/${activityId}`,
    'PATCH',
    payload
  );
}

/**
 * DELETE /api/production-lines/{line_code}/activities/{activity_id}
 * Delete a single activity from a production line.
 * @param {string} lineCode
 * @param {string|number} activityId
 */
async function apiDeleteLineActivity(lineCode, activityId) {
  return _apiFetch(
    `/api/production-lines/${encodeURIComponent(lineCode)}/activities/${activityId}`,
    'DELETE'
  );
}

/* ============================================
   EXPOSE GLOBALLY
   ============================================ */
window.apiHealthCheck             = apiHealthCheck;
window.apiGetItems                = apiGetItems;
window.apiCreateItem              = apiCreateItem;
window.apiGetItem                 = apiGetItem;
window.apiUpdateItem              = apiUpdateItem;
window.apiDeleteItem              = apiDeleteItem;
window.apiAddItemActivity         = apiAddItemActivity;
window.apiUpdateItemActivity      = apiUpdateItemActivity;
window.apiDeleteItemActivity      = apiDeleteItemActivity;
window.apiGetProductionLines      = apiGetProductionLines;
window.apiCreateProductionLine    = apiCreateProductionLine;
window.apiGetProductionLine       = apiGetProductionLine;
window.apiRenameProductionLine    = apiRenameProductionLine;
window.apiReplaceProductionLine   = apiReplaceProductionLine;
window.apiDeleteProductionLine    = apiDeleteProductionLine;
window.apiAddLineActivity         = apiAddLineActivity;
window.apiUpdateLineActivity      = apiUpdateLineActivity;
window.apiDeleteLineActivity      = apiDeleteLineActivity;
