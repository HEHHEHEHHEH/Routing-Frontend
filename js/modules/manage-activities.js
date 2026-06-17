/* ============================================
   MANAGE-ACTIVITIES.JS - Line Activity CRUD
   Pioneer Adhesives Routing Template System
   
   Manages the line activity database.
   Supports viewing, adding, editing, and deleting
   activities per production line.
   ============================================ */

/**
 * Initialize the production line dropdown in Manage view
 * Populates with all available production lines
 */
function initManageLines() {
  const select = document.getElementById('manageLineSelect');
  if (!select) return;

  // Only populate if not already populated
  if (select.options.length <= 1) {
    // Sort line codes
    const lineCodes = Object.keys(LINE_DESCRIPTIONS).sort();

    lineCodes.forEach(code => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = code;
      select.appendChild(opt);
    });
  }
}

/**
 * Render the activities list for the selected production line
 */
function renderManageActivities() {
  const selectedLine = document.getElementById('manageLineSelect')?.value;
  const lineDescEl = document.getElementById('manageLineDesc');
  const editorSection = document.getElementById('activityEditorSection');
  const listContainer = document.getElementById('manageActivityList');
  const emptyMsg = document.getElementById('emptyActivitiesMsg');

  if (!selectedLine) return;

  // Update line description
  if (lineDescEl) {
    lineDescEl.textContent = LINE_DESCRIPTIONS[selectedLine] || '';
  }

  // Show editor
  if (editorSection) {
    editorSection.classList.remove('hidden');
  }

  // Render activities list
  if (listContainer) {
    listContainer.innerHTML = '';
  }

  const activities = getLineActivities(selectedLine);

  if (activities.length === 0) {
    // Show empty message
    if (emptyMsg) emptyMsg.classList.remove('hidden');
  } else {
    // Hide empty message and render list
    if (emptyMsg) emptyMsg.classList.add('hidden');

    activities.forEach((act, index) => {
      const li = document.createElement('li');
      li.className = 'activity-item';
      li.innerHTML = `
        <input type="text"
               value="${sanitizeInput(act)}"
               onchange="updateActivityName('${selectedLine}', ${index}, this.value)"
               class="font-medium text-gray-700">
        <button onclick="deleteActivity('${selectedLine}', ${index})"
                class="btn btn--danger"
                style="font-size:0.75rem;padding:0.25rem 0.5rem;">
          Delete
        </button>
      `;
      listContainer.appendChild(li);
    });
  }
}

/**
 * Add a new activity to the selected production line
 */
function addActivityToLine() {
  const selectedLine = document.getElementById('manageLineSelect')?.value;
  const input = document.getElementById('newActivityInput');

  if (!selectedLine || !input) return;

  const newAct = input.value.trim();

  if (!newAct) return;

  addLineActivity(selectedLine, newAct);
  input.value = '';
  renderManageActivities();
}

/**
 * Delete an activity from a production line
 * @param {string} line - Line code
 * @param {number} index - Activity index
 */
function deleteActivity(line, index) {
  removeLineActivity(line, index);
  renderManageActivities();
}

/**
 * Update an activity name
 * @param {string} line - Line code
 * @param {number} index - Activity index
 * @param {string} newValue - New activity name
 */
function updateActivityName(line, index, newValue) {
  if (newValue.trim() === '') {
    deleteActivity(line, index);
  } else {
    updateLineActivity(line, index, newValue);
  }
  renderManageActivities();
}

/**
 * Handle enter key in new activity input
 * @param {KeyboardEvent} event
 */
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
