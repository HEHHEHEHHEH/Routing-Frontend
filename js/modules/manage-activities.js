/* ============================================
   MANAGE-ACTIVITIES.JS - Line Activity CRUD
   Pioneer Adhesives Routing Template System
   
   Manages the line activity database.
   Supports viewing, adding, editing, and deleting
   activities per production line with safety guards.
   ============================================ */

/**
 * Initialize the production line dropdown
 */
function initManageLines(preselectCode = null) {
  const select = document.getElementById('manageLineSelect');
  if (!select) return;

  // Clear existing options
  select.innerHTML = '<option value="" disabled selected>-- Choose Line --</option>';
  
  const lineCodes = Object.keys(LINE_DESCRIPTIONS).sort();
  lineCodes.forEach(code => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = code;
    select.appendChild(opt);
  });

  if (preselectCode && LINE_DESCRIPTIONS[preselectCode]) {
    select.value = preselectCode;
    renderManageActivities();
  }
}

/**
 * Render the activities list and toggle UI visibility
 */
function renderManageActivities() {
  const selectedLine = document.getElementById('manageLineSelect')?.value;
  const lineDescEl = document.getElementById('manageLineDesc');
  const editorSection = document.getElementById('activityEditorSection');
  const listContainer = document.getElementById('manageActivityList');
  const emptyMsg = document.getElementById('emptyActivitiesMsg');
  
  // Action Buttons
  const btnEdit = document.getElementById('btnEditLine');
  const btnDelete = document.getElementById('btnDeleteLine');

  if (!selectedLine) {
    if (editorSection) editorSection.classList.add('hidden');
    if (btnEdit) btnEdit.classList.add('hidden');
    if (btnDelete) btnDelete.classList.add('hidden');
    if (lineDescEl) lineDescEl.textContent = '';
    return;
  }

  // Show UI elements for selected line
  if (lineDescEl) lineDescEl.textContent = LINE_DESCRIPTIONS[selectedLine] || '';
  if (editorSection) editorSection.classList.remove('hidden');
  if (btnEdit) btnEdit.classList.remove('hidden');
  if (btnDelete) btnDelete.classList.remove('hidden');

  if (listContainer) listContainer.innerHTML = '';
  const activities = getLineActivities(selectedLine);

  if (activities.length === 0) {
    if (emptyMsg) emptyMsg.classList.remove('hidden');
  } else {
    if (emptyMsg) emptyMsg.classList.add('hidden');

    activities.forEach((act, index) => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.gap = '0.5rem';
      
      // Pass the original value into the onchange handler so we can revert if cancelled
      const sanitizedAct = sanitizeInput(act);
      li.innerHTML = `
        <input type="text"
               value="${sanitizedAct}"
               onchange="updateActivityName('${selectedLine}', ${index}, this, '${sanitizedAct}')"
               class="font-medium text-gray-700 flex-1 border border-transparent focus:border-gray-300 rounded px-2 py-1"
               title="Edit to rename">
        <button onclick="deleteActivity('${selectedLine}', ${index})"
                class="btn btn--danger"
                style="font-size:0.75rem; padding:0.25rem 0.75rem;">
          Delete
        </button>
      `;
      listContainer.appendChild(li);
    });
  }
}

/* --- LINE CRUD WITH CONFIRMATIONS --- */

function handleCreateLine() {
  const code = prompt("CREATE LINE: Enter a unique Production Line Code (e.g., L12):");
  if (!code || code.trim() === "") return;
  
  const cleanCode = code.trim().toUpperCase();
  if (LINE_DESCRIPTIONS[cleanCode]) {
    alert(`Error: Production line code "${cleanCode}" already exists.`);
    return;
  }

  const desc = prompt(`CREATE LINE: Enter description for Line ${cleanCode}:`);
  if (!desc || desc.trim() === "") return;

  if (confirm(`SECURITY CHECK: Are you sure you want to create a new production line:\n\nCode: ${cleanCode}\nDesc: ${desc.trim()}`)) {
    addProductionLine(cleanCode, desc.trim());
    initManageLines(cleanCode); // Refresh dropdown and auto-select new line
  }
}

function handleEditLine() {
  const selectedLine = document.getElementById('manageLineSelect')?.value;
  if (!selectedLine) return;

  const currentDesc = LINE_DESCRIPTIONS[selectedLine];
  const newDesc = prompt(`EDIT LINE: Enter new description for ${selectedLine}:`, currentDesc);
  
  if (newDesc !== null && newDesc.trim() !== "" && newDesc.trim() !== currentDesc) {
    if (confirm(`SECURITY CHECK: Confirm change from "${currentDesc}" to "${newDesc.trim()}"?`)) {
      updateProductionLine(selectedLine, newDesc.trim());
      renderManageActivities(); // Refresh UI
    }
  }
}

function handleDeleteLine() {
  const selectedLine = document.getElementById('manageLineSelect')?.value;
  if (!selectedLine) return;

  const isConfirmed = confirm(`CRITICAL WARNING: Are you absolutely sure you want to delete the ENTIRE production line "${selectedLine}"?\n\nThis will also delete all associated activities. This cannot be undone.`);
  
  if (isConfirmed) {
    deleteProductionLine(selectedLine);
    initManageLines(); // Refresh dropdown
    renderManageActivities(); // Clear activity view
  }
}

/* --- ACTIVITY CRUD WITH CONFIRMATIONS --- */

function addActivityToLine() {
  const selectedLine = document.getElementById('manageLineSelect')?.value;
  const input = document.getElementById('newActivityInput');

  if (!selectedLine || !input) return;

  const newAct = input.value.trim().toUpperCase();
  if (!newAct) return;

  if (confirm(`ADD ACTIVITY: Add "${newAct}" to production line ${selectedLine}?`)) {
    addLineActivity(selectedLine, newAct);
    input.value = '';
    renderManageActivities();
  }
}

function deleteActivity(line, index) {
  const activities = getLineActivities(line);
  const targetAct = activities[index];

  if (confirm(`DELETE ACTIVITY: Are you sure you want to permanently remove "${targetAct}"?`)) {
    removeLineActivity(line, index);
    renderManageActivities();
  }
}

function updateActivityName(line, index, inputElement, originalValue) {
  const newValue = inputElement.value.trim().toUpperCase();
  
  // If no changes were made, do nothing
  if (newValue === originalValue) return;

  if (newValue === '') {
    // If they delete the text, assume they want to delete the item, but confirm first
    if (confirm("DELETE ACTIVITY: You cleared the activity name. Do you want to delete this activity entirely?")) {
      deleteActivity(line, index);
    } else {
      inputElement.value = originalValue; // Revert change
    }
  } else {
    // Standard rename confirmation
    if (confirm(`UPDATE ACTIVITY: Rename "${originalValue}" to "${newValue}"?`)) {
      updateLineActivity(line, index, newValue);
      renderManageActivities();
    } else {
      inputElement.value = originalValue; // Revert change
    }
  }
}

function handleActivityKeypress(event) {
  if (event.key === 'Enter') {
    addActivityToLine();
  }
}

// Expose globally
window.initManageLines = initManageLines;
window.renderManageActivities = renderManageActivities;
window.addActivityToLine = addActivityToLine;
window.deleteActivity = deleteActivity;
window.updateActivityName = updateActivityName;
window.handleActivityKeypress = handleActivityKeypress;
window.handleCreateLine = handleCreateLine;
window.handleEditLine = handleEditLine;
window.handleDeleteLine = handleDeleteLine;