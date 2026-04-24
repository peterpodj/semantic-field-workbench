/* tweaks-panel.js — Host protocol + form controls */

const TweaksPanel = (function() {
  'use strict';

  const UI = window.UI;

  /* Default state */
  const state = {
    diffusion: 0.10,
    advX: 0.00,
    advY: 0.00,
    decay: 0.01,
    showGrid: false,
    activeField: 'sandbox',
    theme: 'cream'
  };

  const listeners = [];

  function onChange(cb) {
    listeners.push(cb);
  }

  function emit() {
    for (const cb of listeners) cb({ ...state });
  }

  function setState(partial) {
    Object.assign(state, partial);
    emit();
  }

  function sliderRow(label, key, min, max, step, fmt = v => v.toFixed(2)) {
    const row = UI.el('div', 'control-row');
    row.appendChild(UI.el('span', 'control-label', label));
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min; input.max = max; input.step = step;
    input.value = state[key];
    const val = UI.el('span', 'font-mono text-xs', fmt(state[key]));
    val.style.minWidth = '40px';
    val.style.textAlign = 'right';
    input.addEventListener('input', () => {
      state[key] = parseFloat(input.value);
      val.textContent = fmt(state[key]);
      emit();
    });
    row.appendChild(input);
    row.appendChild(val);
    return row;
  }

  function build() {
    const panel = UI.el('div', 'tweaks-panel');
    panel.appendChild(UI.el('div', 'tweaks-title', 'Tweaks'));

    panel.appendChild(UI.el('div', 'font-mono text-xs mt-8', 'Diffusion'));
    panel.appendChild(sliderRow('D', 'diffusion', 0.01, 0.50, 0.01));

    panel.appendChild(UI.el('div', 'font-mono text-xs mt-8', 'Advection'));
    panel.appendChild(sliderRow('uᴼ', 'advX', -1.0, 1.0, 0.05));
    panel.appendChild(sliderRow('uʸ', 'advY', -1.0, 1.0, 0.05));

    panel.appendChild(UI.el('div', 'font-mono text-xs mt-8', 'Decay'));
    panel.appendChild(sliderRow('k', 'decay', 0.00, 0.10, 0.005));

    // Theme
    const themeRow = UI.el('div', 'control-row mt-16');
    themeRow.appendChild(UI.el('span', 'control-label', 'Theme'));
    const themeSel = document.createElement('select');
    themeSel.style.border = 'var(--chrome-border)';
    themeSel.style.padding = '4px';
    themeSel.style.fontFamily = 'JetBrains Mono';
    themeSel.style.fontSize = '12px';
    for (const t of ['cream', 'yellow', 'white']) {
      const opt = document.createElement('option');
      opt.value = t; opt.textContent = t;
      if (t === state.theme) opt.selected = true;
      themeSel.appendChild(opt);
    }
    themeSel.addEventListener('change', () => {
      state.theme = themeSel.value;
      emit();
    });
    themeRow.appendChild(themeSel);
    panel.appendChild(themeRow);

    // Active field
    const fieldRow = UI.el('div', 'control-row mt-8');
    fieldRow.appendChild(UI.el('span', 'control-label', 'Field'));
    const fieldSel = document.createElement('select');
    fieldSel.style.border = 'var(--chrome-border)';
    fieldSel.style.padding = '4px';
    fieldSel.style.fontFamily = 'JetBrains Mono';
    fieldSel.style.fontSize = '12px';
    for (const f of ['sandbox', 'vector-db', 'content-routing', 'cache-warming', 'incident-propagation', 'doc-graphs', 'feature-store']) {
      const opt = document.createElement('option');
      opt.value = f; opt.textContent = f;
      if (f === state.activeField) opt.selected = true;
      fieldSel.appendChild(opt);
    }
    fieldSel.addEventListener('change', () => {
      state.activeField = fieldSel.value;
      emit();
    });
    fieldRow.appendChild(fieldSel);
    panel.appendChild(fieldRow);

    // Show grid toggle
    const gridRow = UI.el('div', 'control-row mt-8');
    gridRow.appendChild(UI.el('span', 'control-label', 'Grid'));
    const gridCheck = document.createElement('input');
    gridCheck.type = 'checkbox';
    gridCheck.checked = state.showGrid;
    gridCheck.addEventListener('change', () => {
      state.showGrid = gridCheck.checked;
      emit();
    });
    gridRow.appendChild(gridCheck);
    panel.appendChild(gridRow);

    return panel;
  }

  return { build, onChange, setState, getState: () => ({ ...state }) };
})();
