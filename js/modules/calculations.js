/* ============================================
   CALCULATIONS.JS - Math & Formula Engine
   Pioneer Adhesives Routing Template System
   
   Handles all formula calculations for the
   routing table including run time, labor
   minutes, machine minutes, DL, VOH, FOH.
   ============================================ */

/**
 * Calculation constants
 */
const CALC_CONSTANTS = {
  DECIMAL_PLACES_DISPLAY: 5,
  DECIMAL_PLACES_TIME: 5
};

/**
 * Calculate all derived values for a single row
 * @param {number} pax - Number of workers
 * @param {number} machine - Number of machines
 * @param {number} time - Time in minutes
 * @param {number} qty - FG quantity per unit
 * @returns {Object} Calculated values
 */
function calculateRow(pax, machine, time, qty) {
  const safeQty = Math.max(qty, 0);
  const safePax = Math.max(pax, 0);
  const safeMachine = Math.max(machine, 0);
  const safeTime = Math.max(time, 0);

  const runTime = safeQty !== 0 ? (safeTime / safeQty) : 0;
  const laborMin = safePax * safeTime;
  const mcMin = safeMachine * safeTime;

  let dlUnits = 0;
  if (safeTime > 0) {
    dlUnits = safeQty / safeTime;
  }

  // DL, VOH, FOH all equal runTime per business logic
  const dl = runTime;
  const voh = runTime;
  const foh = runTime;

  return {
    runTime,
    laborMin,
    mcMin,
    dlUnits: dlUnits > 0 ? Math.round(dlUnits) : 0,
    dl,
    voh,
    foh
  };
}

/**
 * Perform full recalculation of all table rows and update totals
 * Reads input values directly from DOM, writes computed values back
 */
function calculateAll() {
  const qtyInput = document.getElementById('qtyInput');
  const qty = parseFloat(qtyInput?.value) || 0;

  let totalPax = 0;
  let totalMachine = 0;
  let totalTime = 0;
  let totalRunTime = 0;
  let totalLabor = 0;
  let totalMc = 0;
  let totalDL = 0;
  let totalVOH = 0;
  let totalFOH = 0;

  const rows = document.querySelectorAll('#tableBody tr');

  rows.forEach(row => {
    const paxInput = row.querySelector('.pax-input');
    const machineInput = row.querySelector('.machine-input');
    const timeInput = row.querySelector('.time-input');

    const pax = parseFloat(paxInput?.value) || 0;
    const machine = parseFloat(machineInput?.value) || 0;
    const time = parseFloat(timeInput?.value) || 0;

    const calc = calculateRow(pax, machine, time, qty);

    // Update computed cells in DOM
    const runTimeCell = row.querySelector('.run-time-cell');
    const laborMinCell = row.querySelector('.labor-min-cell');
    const mcMinCell = row.querySelector('.mc-min-cell');
    const dlUnitsCell = row.querySelector('.dl-units-cell');
    const dlCell = row.querySelector('.dl-cell');
    const vohCell = row.querySelector('.voh-cell');
    const fohCell = row.querySelector('.foh-cell');

    if (runTimeCell) runTimeCell.textContent = formatNumber(calc.runTime);
    if (laborMinCell) laborMinCell.textContent = formatNumber(calc.laborMin);
    if (mcMinCell) mcMinCell.textContent = formatNumber(calc.mcMin);
    if (dlUnitsCell) dlUnitsCell.textContent = calc.dlUnits > 0 ? calc.dlUnits.toString() : '0';
    if (dlCell) dlCell.textContent = formatNumber(calc.dl);
    if (vohCell) vohCell.textContent = formatNumber(calc.voh);
    if (fohCell) fohCell.textContent = formatNumber(calc.foh);

    // Accumulate totals
    totalPax += safePax;
    totalMachine += safeMachine;
    totalTime += safeTime;
    totalRunTime += calc.runTime;
    totalLabor += calc.laborMin;
    totalMc += calc.mcMin;
    totalDL += calc.dl;
    totalVOH += calc.voh;
    totalFOH += calc.foh;
  });

  // Update footer totals
  updateTotals({
    pax: totalPax,
    machine: totalMachine,
    time: totalTime,
    runTime: totalRunTime,
    labor: totalLabor,
    mc: totalMc,
    dl: totalDL,
    voh: totalVOH,
    foh: totalFOH
  });
}

/**
 * Update the totals row in the footer
 * @param {Object} totals
 */
function updateTotals(totals) {
  const els = {
    sumPax: document.getElementById('sumPax'),
    sumMachine: document.getElementById('sumMachine'),
    sumTime: document.getElementById('sumTime'),
    sumRunTime: document.getElementById('sumRunTime'),
    sumLaborMin: document.getElementById('sumLaborMin'),
    sumMcMin: document.getElementById('sumMcMin'),
    sumDL: document.getElementById('sumDL'),
    sumVOH: document.getElementById('sumVOH'),
    sumFOH: document.getElementById('sumFOH')
  };

  if (els.sumPax) els.sumPax.textContent = totals.pax;
  if (els.sumMachine) els.sumMachine.textContent = totals.machine;
  if (els.sumTime) els.sumTime.textContent = formatNumber(totals.time);
  if (els.sumRunTime) els.sumRunTime.textContent = formatNumber(totals.runTime);
  if (els.sumLaborMin) els.sumLaborMin.textContent = formatNumber(totals.labor);
  if (els.sumMcMin) els.sumMcMin.textContent = formatNumber(totals.mc);
  if (els.sumDL) els.sumDL.textContent = formatNumber(totals.dl);
  if (els.sumVOH) els.sumVOH.textContent = formatNumber(totals.voh);
  if (els.sumFOH) els.sumFOH.textContent = formatNumber(totals.foh);
}

/**
 * Format a number for display
 * @param {number} num
 * @param {number} decimals
 * @returns {string}
 */
function formatNumber(num, decimals = CALC_CONSTANTS.DECIMAL_PLACES_DISPLAY) {
  if (isNaN(num) || !isFinite(num)) return '0.00000';
  return num.toFixed(decimals);
}

// Expose globally
window.calculateRow = calculateRow;
window.calculateAll = calculateAll;
window.updateTotals = updateTotals;
window.formatNumber = formatNumber;
