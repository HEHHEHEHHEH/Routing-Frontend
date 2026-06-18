/* ============================================
   MANAGE-ACTIVITIES.JS - Line Activity CRUD
   Pioneer Adhesives Routing Template System

   Manages the line activity database.
   Supports viewing, adding, editing, and deleting
   activities per production line with safety guards.

   Uses custom modal dialogs instead of browser
   prompt()/confirm() for a consistent UI experience.
   ============================================ */

/* ============================================
   CUSTOM MODAL SYSTEM
   ============================================ */

/**
 * Show a custom modal. Returns a Promise that resolves with:
 *   { confirmed: true, value: string } on OK
 *   { confirmed: false } on Cancel
 *
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {'confirm'|'prompt'} opts.type
 * @param {string} [opts.inputDefault]   - Pre-fill value for prompt type
 * @param {string} [opts.inputPlaceholder]
 * @param {'primary'|'danger'} [opts.confirmStyle] - Button color
 * @param {string} [opts.confirmLabel]
 * @param {string} [opts.icon]           - 'warn' | 'info' | 'danger'
 */
function showModal(opts) {
  return new Promise(resolve => {
    const modal       = document.getElementById('customModal');
    const titleEl     = document.getElementById('modalTitle');
    const msgEl       = document.getElementById('modalMessage');
    const inputWrap   = document.getElementById('modalInputWrap');
    const inputEl     = document.getElementById('modalInput');
    const confirmBtn  = document.getElementById('modalConfirmBtn');
    const cancelBtn   = document.getElementById('modalCancelBtn');
    const iconWrap    = document.getElementById('modalIconWrap');

    titleEl.textContent   = opts.title || '';
    msgEl.textContent     = opts.message || '';

    // Icon
    iconWrap.innerHTML = '';
    if (opts.icon === 'danger') {
      iconWrap.innerHTML = '<div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#fff1f2;border:1px solid #fecdd3;"><span style="font-size:1.1rem;color:#dc2626;">&#9888;</span></div>';
    } else if (opts.icon === 'warn') {
      iconWrap.innerHTML = '<div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#fffbeb;border:1px solid #fde68a;"><span style="font-size:1.1rem;color:#d97706;">&#9888;</span></div>';
    } else if (opts.icon === 'info') {
      iconWrap.innerHTML = '<div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#eff6ff;border:1px solid #bfdbfe;"><span style="font-size:1.1rem;color:#2563eb;">&#8505;</span></div>';
    }

    // Input field
    if (opts.type === 'prompt') {
      inputWrap.style.display = 'block';
      inputEl.value = opts.inputDefault || '';
      inputEl.placeholder = opts.inputPlaceholder || '';
      setTimeout(() => inputEl.focus(), 50);
    } else {
      inputWrap.style.display = 'none';
    }

    // Confirm button style
    const isDanger = opts.confirmStyle === 'danger';
    confirmBtn.textContent = opts.confirmLabel || 'Confirm';
    confirmBtn.style.background = isDanger ? '#dc2626' : '#2563eb';
    confirmBtn.onmouseover = () => { confirmBtn.style.background = isDanger ? '#b91c1c' : '#1d4ed8'; };
    confirmBtn.onmouseout  = () => { confirmBtn.style.background = isDanger ? '#dc2626' : '#2563eb'; };

    modal.style.display = 'flex';

    // Keyboard: Enter = confirm, Escape = cancel
    function onKey(e) {
      if (e.key === 'Enter')  handleConfirm();
      if (e.key === 'Escape') handleCancel();
    }
    document.addEventListener('keydown', onKey);

    function cleanup() {
      modal.style.display = 'none';
      document.removeEventListener('keydown', onKey);
      confirmBtn.onclick = null;
      cancelBtn.onclick  = null;
    }

    function handleConfirm() {
      cleanup();
      resolve({ confirmed: true, value: inputEl.value.trim() });
    }
    function handleCancel() {
      cleanup();
      resolve({ confirmed: false });
    }

    confirmBtn.onclick = handleConfirm;
    cancelBtn.onclick  = handleCancel;
  });
}


/**
 * Show a modal with TWO labeled input fields.
 * Returns a Promise resolving with:
 *   { confirmed: true, value1: string, value2: string } on Done
 *   { confirmed: false } on Cancel
 *
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} opts.label1
 * @param {string} opts.label2
 * @param {string} [opts.default1]
 * @param {string} [opts.default2]
 * @param {string} [opts.placeholder1]
 * @param {string} [opts.placeholder2]
 * @param {string} [opts.confirmLabel]
 * @param {string} [opts.icon]
 */
function showDualInputModal(opts) {
  return new Promise(resolve => {
    const modal      = document.getElementById('customModal');
    const titleEl    = document.getElementById('modalTitle');
    const msgEl      = document.getElementById('modalMessage');
    const inputWrap  = document.getElementById('modalInputWrap');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn  = document.getElementById('modalCancelBtn');
    const iconWrap   = document.getElementById('modalIconWrap');

    titleEl.textContent = opts.title || '';
    msgEl.textContent   = opts.message || '';

    // Icon
    iconWrap.innerHTML = '';
    if (opts.icon === 'info') {
      iconWrap.innerHTML = '<div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#eff6ff;border:1px solid #bfdbfe;"><span style="font-size:1.1rem;color:#2563eb;">&#8505;</span></div>';
    } else if (opts.icon === 'warn') {
      iconWrap.innerHTML = '<div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#fffbeb;border:1px solid #fde68a;"><span style="font-size:1.1rem;color:#d97706;">&#9888;</span></div>';
    }

    // Build dual input UI inside inputWrap
    inputWrap.style.display = 'block';
    inputWrap.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        <div>
          <label style="display:block;font-size:0.78rem;font-weight:600;color:#64748b;margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:0.05em;">${opts.label1 || 'Field 1'}</label>
          <input id="modalDualInput1"
                 value="${opts.default1 || ''}"
                 placeholder="${opts.placeholder1 || ''}"
                 style="width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:0.55rem 0.8rem;font-size:0.875rem;color:#0f172a;box-sizing:border-box;outline:none;"
                 onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#cbd5e1'">
        </div>
        <div>
          <label style="display:block;font-size:0.78rem;font-weight:600;color:#64748b;margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:0.05em;">${opts.label2 || 'Field 2'}</label>
          <input id="modalDualInput2"
                 value="${opts.default2 || ''}"
                 placeholder="${opts.placeholder2 || ''}"
                 style="width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:0.55rem 0.8rem;font-size:0.875rem;color:#0f172a;box-sizing:border-box;outline:none;"
                 onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#cbd5e1'">
        </div>
      </div>
    `;

    const input1 = document.getElementById('modalDualInput1');
    const input2 = document.getElementById('modalDualInput2');
    setTimeout(() => input1.focus(), 50);

    // Confirm button
    confirmBtn.textContent = opts.confirmLabel || 'Done';
    confirmBtn.style.background = '#2563eb';
    confirmBtn.onmouseover = () => { confirmBtn.style.background = '#1d4ed8'; };
    confirmBtn.onmouseout  = () => { confirmBtn.style.background = '#2563eb'; };

    modal.style.display = 'flex';

    function onKey(e) {
      if (e.key === 'Escape') handleCancel();
    }
    document.addEventListener('keydown', onKey);

    function cleanup() {
      modal.style.display = 'none';
      // Restore inputWrap to its original single-input state for showModal reuse
      inputWrap.innerHTML = '<input id="modalInput" style="width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:0.55rem 0.8rem;font-size:0.875rem;color:#0f172a;box-sizing:border-box;outline:none;" onfocus="this.style.borderColor=\'#3b82f6\'" onblur="this.style.borderColor=\'#cbd5e1\'">';
      document.removeEventListener('keydown', onKey);
      confirmBtn.onclick = null;
      cancelBtn.onclick  = null;
    }

    function handleConfirm() {
      cleanup();
      resolve({
        confirmed: true,
        value1: document.getElementById('modalDualInput1')?.value.trim() || input1.value.trim(),
        value2: document.getElementById('modalDualInput2')?.value.trim() || input2.value.trim(),
      });
    }
    function handleCancel() {
      cleanup();
      resolve({ confirmed: false });
    }

    confirmBtn.onclick = handleConfirm;
    cancelBtn.onclick  = handleCancel;
  });
}


/**
 * Initialize the production line dropdown
 */
function initManageLines(preselectCode = null) {
  const select = document.getElementById('manageLineSelect');
  if (!select) return;

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
  } else {
    // No line selected: hide editor + action buttons
    _hideEditorAndButtons();
  }
}

/**
 * Render the activities list and toggle UI visibility
 */
function renderManageActivities() {
  const selectedLine  = document.getElementById('manageLineSelect')?.value;
  const lineDescEl    = document.getElementById('manageLineDesc');
  const editorSection = document.getElementById('activityEditorSection');
  const listContainer = document.getElementById('manageActivityList');
  const emptyMsg      = document.getElementById('emptyActivitiesMsg');
  const countBadge    = document.getElementById('activityCountBadge');

  const btnEdit   = document.getElementById('btnEditLine');
  const btnDelete = document.getElementById('btnDeleteLine');

  if (!selectedLine) {
    _hideEditorAndButtons();
    if (lineDescEl) { lineDescEl.textContent = ''; lineDescEl.style.display = 'none'; }
    return;
  }

  // Show line description
  if (lineDescEl) {
    const desc = LINE_DESCRIPTIONS[selectedLine] || '';
    lineDescEl.textContent = desc;
    lineDescEl.style.display = desc ? 'block' : 'none';
  }

  // Show editor + action buttons
  if (editorSection) editorSection.style.display = 'block';
  if (btnEdit)   { btnEdit.style.display   = 'block'; btnEdit.classList.remove('hidden'); }
  if (btnDelete) { btnDelete.style.display = 'block'; btnDelete.classList.remove('hidden'); }

  if (listContainer) listContainer.innerHTML = '';

  const activities = getLineActivities(selectedLine);

  // Update count badge
  if (countBadge) {
    countBadge.textContent = activities.length === 1 ? '1 activity' : `${activities.length} activities`;
  }

  if (activities.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
  } else {
    if (emptyMsg) emptyMsg.style.display = 'none';

    activities.forEach((act, index) => {
      const li = document.createElement('li');
      li.style.cssText = 'display:flex; gap:0.5rem; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:0.45rem 0.6rem;';

      // Drag handle / index indicator
      const numSpan = document.createElement('span');
      numSpan.textContent = String(index + 1).padStart(2, '0');
      numSpan.style.cssText = 'font-size:0.72rem; font-weight:700; color:#94a3b8; min-width:1.5rem; text-align:center;';

      const sanitizedAct = sanitizeInput(act);
      const input = document.createElement('input');
      input.type = 'text';
      input.value = sanitizedAct;
      input.dataset.original = sanitizedAct;
      input.style.cssText = 'flex:1; font-size:0.875rem; font-weight:500; color:#1e293b; border:1px solid transparent; border-radius:6px; padding:0.3rem 0.5rem; background:transparent; outline:none;';
      input.title = 'Click to rename';
      input.addEventListener('focus', () => { input.style.borderColor = '#93c5fd'; input.style.background = '#fff'; });
      input.addEventListener('blur',  () => { input.style.borderColor = 'transparent'; input.style.background = 'transparent'; });
      input.addEventListener('change', () => updateActivityName(selectedLine, index, input, sanitizedAct));

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.style.cssText = 'font-size:0.75rem; font-weight:600; padding:0.25rem 0.65rem; border-radius:6px; background:#fff; color:#dc2626; border:1px solid #fca5a5; cursor:pointer;';
      deleteBtn.onmouseover = () => { deleteBtn.style.background = '#fff1f2'; };
      deleteBtn.onmouseout  = () => { deleteBtn.style.background = '#fff'; };
      deleteBtn.addEventListener('click', () => deleteActivity(selectedLine, index));

      li.appendChild(numSpan);
      li.appendChild(input);
      li.appendChild(deleteBtn);
      listContainer.appendChild(li);
    });
  }
}

function _hideEditorAndButtons() {
  const editorSection = document.getElementById('activityEditorSection');
  const btnEdit       = document.getElementById('btnEditLine');
  const btnDelete     = document.getElementById('btnDeleteLine');
  if (editorSection) editorSection.style.display = 'none';
  if (btnEdit)       { btnEdit.style.display   = 'none'; btnEdit.classList.add('hidden'); }
  if (btnDelete)     { btnDelete.style.display = 'none'; btnDelete.classList.add('hidden'); }
}


/* ============================================
   LINE CRUD
   ============================================ */

async function handleCreateLine() {
  // Single modal with both code and description fields
  const r1 = await showDualInputModal({
    icon: 'info',
    title: 'Create New Production Line',
    message: 'Fill in both fields below. Line code will be converted to uppercase.',
    label1: 'Line Code',
    label2: 'Description',
    placeholder1: 'e.g., L12',
    placeholder2: 'e.g., L1 COATINGS LINE',
    confirmLabel: 'Done',
  });
  if (!r1.confirmed) return;

  const cleanCode = r1.value1.toUpperCase();
  const cleanDesc = r1.value2;

  // Validate inputs are not empty
  if (!cleanCode || !cleanDesc) {
    await showModal({
      icon: 'danger',
      title: 'Invalid Input',
      message: 'Line code and description cannot be empty.',
      type: 'confirm',
      confirmLabel: 'OK',
    });
    return;
  }

  // Check code does not already exist
  if (LINE_DESCRIPTIONS[cleanCode]) {
    await showModal({
      icon: 'danger',
      title: 'Code Already Exists',
      message: `Production line code "${cleanCode}" already exists. Please use a different code.`,
      type: 'confirm',
      confirmLabel: 'OK',
    });
    return;
  }

  // Confirm before creating
  const r2 = await showModal({
    icon: 'warn',
    title: 'Confirm New Line',
    message: `Create production line?\n\nCode: ${cleanCode}\nDescription: ${cleanDesc}`,
    type: 'confirm',
    confirmLabel: 'Create Line',
  });
  if (!r2.confirmed) return;

  // --- API call ---
  try {
    const res = await apiCreateProductionLine({ line_code: cleanCode, description: cleanDesc });
    if (!res.ok) console.warn('[API] Create line failed:', res.status);
  } catch (_) { console.warn('[API] Unreachable — creating line locally only.'); }

  // Keep local cache in sync
  addProductionLine(cleanCode, cleanDesc);
  // Sync the production line dropdown on all routing tabs immediately (no refresh needed)
  if (typeof populateProdLineSelect === 'function') populateProdLineSelect();
  initManageLines(cleanCode);
}

async function handleEditLine() {
  const selectedLine = document.getElementById('manageLineSelect')?.value;
  if (!selectedLine) return;

  const currentDesc = LINE_DESCRIPTIONS[selectedLine];

  // Single modal with both code and description fields
  const r1 = await showDualInputModal({
    icon: 'info',
    title: 'Edit Production Line',
    message: 'Update the line code and/or description below.',
    label1: 'Line Code',
    label2: 'Description',
    default1: selectedLine,
    default2: currentDesc,
    placeholder1: 'e.g., L12',
    placeholder2: 'e.g., L1 COATINGS LINE',
    confirmLabel: 'Done',
  });
  if (!r1.confirmed) return;

  const newCode = r1.value1.toUpperCase();
  const newDesc = r1.value2;

  // Validate inputs are not empty
  if (!newCode || !newDesc) {
    await showModal({
      icon: 'danger',
      title: 'Invalid Input',
      message: 'Line code and description cannot be empty.',
      type: 'confirm',
      confirmLabel: 'OK',
    });
    return;
  }

  // If the new code is different, check it doesn't already exist
  if (newCode !== selectedLine && LINE_DESCRIPTIONS[newCode]) {
    await showModal({
      icon: 'danger',
      title: 'Code Already Exists',
      message: `Production line code "${newCode}" already exists. Please use a different code.`,
      type: 'confirm',
      confirmLabel: 'OK',
    });
    return;
  }

  // If nothing changed, do nothing
  if (newCode === selectedLine && newDesc === currentDesc) return;

  // Confirm summary of changes
  const changes = [];
  if (newCode !== selectedLine) changes.push(`Code: "${selectedLine}" → "${newCode}"`);
  if (newDesc !== currentDesc)  changes.push(`Description: "${currentDesc}" → "${newDesc}"`);

  const r2 = await showModal({
    icon: 'warn',
    title: 'Confirm Line Changes',
    message: `Save the following changes?\n\n${changes.join('\n')}`,
    type: 'confirm',
    confirmLabel: 'Save Changes',
  });
  if (!r2.confirmed) return;


  // --- API call ---
  try {
    const res = await apiRenameProductionLine(selectedLine, { new_line_code: newCode, description: newDesc });
    if (!res.ok) console.warn('[API] Rename line failed:', res.status);
  } catch (_) { console.warn('[API] Unreachable — renaming line locally only.'); }

  // Keep local cache in sync
  renameProductionLine(selectedLine, newCode, newDesc);
  // Sync the production line dropdown on all routing tabs immediately (no refresh needed)
  if (typeof populateProdLineSelect === 'function') populateProdLineSelect();
  initManageLines(newCode);
}

async function handleDeleteLine() {
  const selectedLine = document.getElementById('manageLineSelect')?.value;
  if (!selectedLine) return;

  const r = await showModal({
    icon: 'danger',
    title: 'Delete Production Line',
    message: `This will permanently delete "${selectedLine}" and all its associated activities. This action cannot be undone.`,
    type: 'confirm',
    confirmStyle: 'danger',
    confirmLabel: 'Yes, Delete Line',
  });
  if (!r.confirmed) return;

  // --- API call ---
  try {
    const res = await apiDeleteProductionLine(selectedLine);
    if (!res.ok) console.warn('[API] Delete line failed:', res.status);
  } catch (_) { console.warn('[API] Unreachable — deleting line locally only.'); }

  // Keep local cache in sync
  deleteProductionLine(selectedLine);
  // Sync the production line dropdown on all routing tabs immediately (no refresh needed)
  if (typeof populateProdLineSelect === 'function') populateProdLineSelect();
  initManageLines();
  renderManageActivities();
}


/* ============================================
   ACTIVITY CRUD
   ============================================ */

async function addActivityToLine() {
  const selectedLine = document.getElementById('manageLineSelect')?.value;
  const input        = document.getElementById('newActivityInput');
  if (!selectedLine || !input) return;

  const newAct = input.value.trim().toUpperCase();
  if (!newAct) return;

  const r = await showModal({
    icon: 'info',
    title: 'Add Activity',
    message: `Add "${newAct}" to production line ${selectedLine}?`,
    type: 'confirm',
    confirmLabel: 'Add Activity',
  });
  if (!r.confirmed) return;

  // --- API call ---
  try {
    const res = await apiAddLineActivity(selectedLine, { activity_name: newAct });
    if (!res.ok) console.warn('[API] Add activity failed:', res.status);
  } catch (_) { console.warn('[API] Unreachable — adding activity locally only.'); }

  // Keep local cache in sync
  addLineActivity(selectedLine, newAct);
  input.value = '';
  renderManageActivities();
}

async function deleteActivity(line, index) {
  const activities = getLineActivities(line);
  const targetAct  = activities[index];

  const r = await showModal({
    icon: 'danger',
    title: 'Delete Activity',
    message: `Permanently remove "${targetAct}" from this production line?`,
    type: 'confirm',
    confirmStyle: 'danger',
    confirmLabel: 'Delete Activity',
  });
  if (!r.confirmed) return;

  // --- API call ---
  try {
    const res = await apiDeleteLineActivity(line, index);
    if (!res.ok) console.warn('[API] Delete activity failed:', res.status);
  } catch (_) { console.warn('[API] Unreachable — deleting activity locally only.'); }

  // Keep local cache in sync
  removeLineActivity(line, index);
  renderManageActivities();
}

async function updateActivityName(line, index, inputElement, originalValue) {
  const newValue = inputElement.value.trim().toUpperCase();

  if (newValue === originalValue) return;

  if (newValue === '') {
    const r = await showModal({
      icon: 'warn',
      title: 'Delete Activity?',
      message: 'You cleared the activity name. Do you want to delete this activity entirely?',
      type: 'confirm',
      confirmStyle: 'danger',
      confirmLabel: 'Delete Activity',
    });
    if (r.confirmed) {
      deleteActivity(line, index);
    } else {
      inputElement.value = originalValue;
    }
  } else {
    const r = await showModal({
      icon: 'info',
      title: 'Rename Activity',
      message: `Rename "${originalValue}" to "${newValue}"?`,
      type: 'confirm',
      confirmLabel: 'Save Rename',
    });
    if (r.confirmed) {
      // --- API call ---
      try {
        const res = await apiUpdateLineActivity(line, index, { activity_name: newValue });
        if (!res.ok) console.warn('[API] Update activity failed:', res.status);
      } catch (_) { console.warn('[API] Unreachable — updating activity locally only.'); }

      // Keep local cache in sync
      updateLineActivity(line, index, newValue);
      renderManageActivities();
    } else {
      inputElement.value = originalValue;
    }
  }
}

function handleActivityKeypress(event) {
  if (event.key === 'Enter') {
    addActivityToLine();
  }
}

// Expose globally
window.initManageLines        = initManageLines;
window.renderManageActivities = renderManageActivities;
window.addActivityToLine      = addActivityToLine;
window.deleteActivity         = deleteActivity;
window.updateActivityName     = updateActivityName;
window.handleActivityKeypress = handleActivityKeypress;
window.handleCreateLine       = handleCreateLine;
window.handleEditLine         = handleEditLine;
window.handleDeleteLine       = handleDeleteLine;