/* sections.js — §02 λ-lens, §03 feature space, §04 flow */

const Sections = (function() {
  'use strict';

  const UI = window.UI;
  const Sim = window.Sim;

  /* ---------- §02 Lambda Lens ---------- */
  function buildLambdaLens() {
    const wrap = UI.el('div', '');
    wrap.appendChild(Sim.TeX(String.raw`I(w) = \lambda c.\;\bigl(c,\vec{f}(w)\bigr)`));

    const body = UI.el('div', 'explain-card mt-16');
    body.innerHTML = `
      <div class="explain-card-title">λ-Lens: Contextual Re-ranking</div>
      <div class="explain-card-body">
        <p>Drag the context pad below to change the context point <em>c</em>. The vocabulary table re-ranks by similarity to <em>c</em>.</p>
      </div>
    `;
    wrap.appendChild(body);

    // Simple interactive: a draggable dot on a 2D plane
    const planeWrap = UI.el('div', 'mt-16');
    planeWrap.style.position = 'relative';
    planeWrap.style.width = '100%';
    planeWrap.style.maxWidth = '400px';
    planeWrap.style.aspectRatio = '1 / 1';
    planeWrap.style.border = 'var(--chrome-border)';
    planeWrap.style.background = 'var(--paper-white)';

    const ctxDot = UI.el('div', '');
    ctxDot.style.position = 'absolute';
    ctxDot.style.width = '16px';
    ctxDot.style.height = '16px';
    ctxDot.style.background = 'var(--rgb-r)';
    ctxDot.style.border = '2px solid var(--ink)';
    ctxDot.style.cursor = 'grab';
    let cx = 0.5, cy = 0.5;
    function placeDot() {
      ctxDot.style.left = `calc(${cx * 100}% - 8px)`;
      ctxDot.style.top = `calc(${cy * 100}% - 8px)`;
      updateTable();
    }
    placeDot();
    planeWrap.appendChild(ctxDot);

    let dragging = false;
    ctxDot.addEventListener('mousedown', () => dragging = true);
    window.addEventListener('mouseup', () => dragging = false);
    planeWrap.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const rect = planeWrap.getBoundingClientRect();
      cx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      cy = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      placeDot();
    });

    wrap.appendChild(planeWrap);

    // Vocabulary table
    const vocab = [
      { word: 'database',  f: [0.90, 0.10] },
      { word: 'vector',    f: [0.80, 0.70] },
      { word: 'semantic',  f: [0.30, 0.90] },
      { word: 'field',     f: [0.20, 0.60] },
      { word: 'cache',     f: [0.70, 0.20] },
      { word: 'query',     f: [0.60, 0.50] },
      { word: 'index',     f: [0.50, 0.30] },
      { word: 'embedding', f: [0.40, 0.90] },
    ];

    const table = UI.el('table', 'data-table mt-16');
    const thead = UI.el('thead', '');
    thead.innerHTML = '<tr><th>Rank</th><th>Word</th><th>Score</th></tr>';
    table.appendChild(thead);
    const tbody = UI.el('tbody', '');
    table.appendChild(tbody);
    wrap.appendChild(table);

    function sim(a, b) {
      let dot = 0, na = 0, nb = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
      }
      return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
    }

    function updateTable() {
      const c = [cx, cy];
      const scored = vocab.map(v => ({ ...v, score: sim(v.f, c) }));
      scored.sort((a, b) => b.score - a.score);
      tbody.innerHTML = '';
      scored.forEach((v, i) => {
        const tr = UI.el('tr', '');
        tr.innerHTML = `<td>${i + 1}</td><td>${v.word}</td><td>${v.score.toFixed(3)}</td>`;
        tbody.appendChild(tr);
      });
    }
    updateTable();

    return wrap;
  }

  /* ---------- §03 Feature Space ---------- */
  function buildFeatureSpace() {
    const wrap = UI.el('div', '');
    wrap.appendChild(Sim.TeX(String.raw`\chi_S = \lambda w.\;\bigl(\tilde{\phi}(w)\bigr)`));

    const body = UI.el('div', 'explain-card mt-16');
    body.innerHTML = `
      <div class="explain-card-title">Feature Space</div>
      <div class="explain-card-body">
        <p>Vectors in <em>{-1, 0, 1}</em>ⁿ. Hover rows to highlight membership in the active feature set.</p>
      </div>
    `;
    wrap.appendChild(body);

    const dims = 6;
    const dimLabels = ['storage', 'math', 'language', 'structure', 'runtime', 'abstract'];
    const rows = 12;
    const table = UI.el('table', 'data-table mt-16');
    let header = '<tr><th>Word</th>';
    for (let d = 0; d < dims; d++) header += `<th title="${dimLabels[d]}">f<sub>${d}</sub></th>`;
    header += '</tr>';
    table.innerHTML = `<thead>${header}</thead>`;
    const tbody = UI.el('tbody', '');

    /* Hard-coded semantic feature vectors in {-1,0,1}⁶.
       Dimensions: 0=storage  1=math  2=language  3=structure  4=runtime  5=abstract */
    const wordData = [
      { word: 'database',  vec: [ 1, 0, 0, 1, 1, 0] },
      { word: 'vector',    vec: [ 0, 1, 0, 0, 0, 0] },
      { word: 'semantic',  vec: [ 0, 0, 1, 0, 0, 1] },
      { word: 'field',     vec: [ 0, 1, 0, 0, 0, 1] },
      { word: 'cache',     vec: [ 1, 0, 0, 0, 1,-1] },
      { word: 'query',     vec: [ 0, 0, 1, 0, 1, 0] },
      { word: 'index',     vec: [ 1, 0, 0, 1, 1, 0] },
      { word: 'embedding', vec: [-1, 1, 0, 0, 0, 1] },
      { word: 'token',     vec: [ 0, 0, 1, 1, 1, 0] },
      { word: 'graph',     vec: [ 0, 1, 0, 1, 0, 1] },
      { word: 'node',      vec: [ 0, 0, 0, 1, 0, 0] },
      { word: 'edge',      vec: [ 0, 0, 0, 1, 0, 0] },
    ];

    for (let r = 0; r < rows; r++) {
      const tr = UI.el('tr', '');
      const wd = wordData[r];
      let html = `<td>${wd.word}</td>`;
      for (let d = 0; d < dims; d++) {
        const v = wd.vec[d];
        const bg = v === 1 ? 'var(--mint)' : v === -1 ? 'var(--peach)' : '';
        html += `<td style="background:${bg};text-align:center;font-family:JetBrains Mono;">${v}</td>`;
      }
      tr.innerHTML = html;
      tr.addEventListener('mouseenter', () => {
        tr.style.background = 'var(--butter)';
      });
      tr.addEventListener('mouseleave', () => {
        tr.style.background = '';
      });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrap.appendChild(table);

    return wrap;
  }

  /* ---------- §04 Flow ---------- */
  function buildFlow() {
    const wrap = UI.el('div', '');
    wrap.appendChild(Sim.TeX(String.raw`∂_t φ + \vec{u} · \nabla φ = D ∇² φ`));

    const body = UI.el('div', 'explain-card mt-16');
    body.innerHTML = `
      <div class="explain-card-title">Flow: Advection Dominates Diffusion</div>
      <div class="explain-card-body">
        <p>As |<strong>u</strong>| grows, the field is swept downstream faster than it can diffuse. Below: a standalone vector-field SVG showing the velocity field.</p>
      </div>
    `;
    wrap.appendChild(body);

    // Vector field SVG
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 200');
    svg.style.width = '100%';
    svg.style.maxWidth = '600px';
    svg.style.border = 'var(--chrome-border)';
    svg.style.background = 'var(--paper-white)';

    const NX = 20, NY = 10;
    const W = 400, H = 200;
    const dx = W / NX, dy = H / NY;
    const u = 1.2, v = 0.3;

    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < NX; i++) {
        const x = i * dx + dx / 2;
        const y = j * dy + dy / 2;
        const len = Math.sqrt(u * u + v * v) * 8;
        const angle = Math.atan2(v, u);
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', y);
        line.setAttribute('x2', x + len * Math.cos(angle));
        line.setAttribute('y2', y + len * Math.sin(angle));
        line.setAttribute('stroke', 'var(--ink-light)');
        line.setAttribute('stroke-width', '1.5');
        svg.appendChild(line);

        // Arrowhead
        const head = document.createElementNS(svgNS, 'polygon');
        const ax = x + len * Math.cos(angle);
        const ay = y + len * Math.sin(angle);
        const s = 3;
        const p1 = `${ax},${ay}`;
        const p2 = `${ax - s * Math.cos(angle - 0.5)},${ay - s * Math.sin(angle - 0.5)}`;
        const p3 = `${ax - s * Math.cos(angle + 0.5)},${ay - s * Math.sin(angle + 0.5)}`;
        head.setAttribute('points', `${p1} ${p2} ${p3}`);
        head.setAttribute('fill', 'var(--ink-light)');
        svg.appendChild(head);
      }
    }

    wrap.appendChild(svg);
    return wrap;
  }

  return { buildLambdaLens, buildFeatureSpace, buildFlow };
})();
