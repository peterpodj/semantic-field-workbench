/* sandbox.js — §01 Hero: type word → place → simulate */

const Sandbox = (function() {
  'use strict';

  const UI = window.UI;
  const Sim = window.Sim;

  function build(tweaks) {
    const container = UI.el('div', '');

    // Intro text
    const intro = UI.ExplainCard({
      title: 'Semantic Field Sandbox',
      body: 'Type a word to create a token. Click the canvas to drop it as a Gaussian source. Watch activation diffuse under the reaction–diffusion–advection equation.'
    });
    container.appendChild(intro);

    // Controls row
    const controls = UI.el('div', 'flex gap-16 mt-16');

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Type a word...';
    input.style.flex = '1';
    controls.appendChild(input);

    const addBtn = UI.el('button', '', 'Add Token');
    controls.appendChild(addBtn);

    const resetBtn = UI.el('button', '', 'Reset');
    controls.appendChild(resetBtn);

    const clearSrcBtn = UI.el('button', '', 'Clear Sources');
    controls.appendChild(clearSrcBtn);

    const playBtn = UI.el('button', 'active', 'Pause');
    controls.appendChild(playBtn);

    container.appendChild(controls);

    // Token list
    const tokenList = UI.el('div', 'mt-8');
    tokenList.style.display = 'flex';
    tokenList.style.flexWrap = 'wrap';
    container.appendChild(tokenList);

    // Canvas
    const canvasWrap = UI.el('div', 'mt-16');
    canvasWrap.style.position = 'relative';
    const canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    canvas.width = 256;
    canvas.height = 256;
    canvas.style.width = '100%';
    canvas.style.maxWidth = '600px';
    canvas.style.height = 'auto';
    canvas.style.aspectRatio = '1 / 1';
    canvasWrap.appendChild(canvas);
    container.appendChild(canvasWrap);

    // Legend
    const legend = UI.el('div', 'flex gap-16 mt-8 text-xs font-mono');
    legend.innerHTML = '<span>Low φ</span><span style="flex:1;height:12px;background:linear-gradient(90deg,#440154,#31688e,#35b779,#fde724);border:2px solid var(--ink);"></span><span>High φ</span>';
    container.appendChild(legend);

    // Stats
    const stats = UI.el('div', 'stats-bar mt-8');
    const statTotal = UI.el('span', '', 'Total: 0.000');
    const statPeak = UI.el('span', '', 'Peak: 0.000');
    const statSources = UI.el('span', '', 'Sources: 0');
    stats.appendChild(statTotal);
    stats.appendChild(statPeak);
    stats.appendChild(statSources);
    container.appendChild(stats);

    // Solver
    const solver = new Sim.FieldSolver(canvas, { NX: 256, NY: 256, D: 0.1, uX: 0, uY: 0, k: 0.01 });
    solver.draw();
    solver.start();

    // Tokens
    const tokens = [];
    let activeToken = null;

    function renderTokens() {
      tokenList.innerHTML = '';
      for (const t of tokens) {
        const tag = UI.el('span', 'token', t.word);
        if (activeToken === t) tag.classList.add('active');
        tag.addEventListener('click', () => { activeToken = t; renderTokens(); });
        tokenList.appendChild(tag);
      }
    }

    addBtn.addEventListener('click', () => {
      const w = input.value.trim();
      if (!w) return;
      tokens.push({ word: w });
      activeToken = tokens[tokens.length - 1];
      input.value = '';
      renderTokens();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });

    // Canvas click to place
    canvas.addEventListener('click', (e) => {
      if (!activeToken) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      solver.addSource(x, y, activeToken.word);
      statSources.textContent = 'Sources: ' + solver.sources.length;
    });

    resetBtn.addEventListener('click', () => {
      solver.reset();
    });

    clearSrcBtn.addEventListener('click', () => {
      solver.clearSources();
      statSources.textContent = 'Sources: 0';
    });

    let playing = true;
    playBtn.addEventListener('click', () => {
      playing = !playing;
      if (playing) { solver.start(); playBtn.textContent = 'Pause'; playBtn.classList.add('active'); }
      else { solver.stop(); playBtn.textContent = 'Play'; playBtn.classList.remove('active'); }
    });

    // Tweak updates
    tweaks.onChange((s) => {
      solver.setParams({ D: s.diffusion, uX: s.advX, uY: s.advY, k: s.decay });
    });

    // Stats loop
    setInterval(() => {
      if (!playing) return;
      const metrics = solver.draw();
      statTotal.textContent = 'Total: ' + metrics.total.toFixed(3);
      statPeak.textContent = 'Peak: ' + metrics.peak.toFixed(3);
    }, 250);

    return container;
  }

  return { build };
})();
