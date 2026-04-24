/* concept-map.js — §05 static SVG node graph */

const ConceptMap = (function() {
  'use strict';

  const UI = window.UI;

  const nodes = [
    { id: 'ling',  x: 80,  y: 80,  title: 'Linguistics', bullets: ['Meaning as use', 'Semantic range', 'Collocation'] },
    { id: 'lambda',x: 320, y: 60,  title: 'λ-Calculus',  bullets: ['Abstraction', 'Application', 'β-reduction'] },
    { id: 'fluid', x: 560, y: 90,  title: 'Fluid Dynamics', bullets: ['Navier–Stokes', 'Diffusion', 'Advection'] },
    { id: 'feat',  x: 100, y: 220, title: 'Feature Space', bullets: ['Embeddings', 'Similarity', 'Manifold'] },
    { id: 'act',   x: 360, y: 240, title: 'Activation',   bullets: ['Neuron firing', 'Propagation', 'Saturation'] },
    { id: 'ex',    x: 600, y: 210, title: 'Example',      bullets: ['Concrete case', 'Boundary test', 'Counter-example'] },
  ];

  const edges = [
    { from: 'ling',   to: 'feat',  label: null },
    { from: 'ling',   to: 'lambda',label: 'formalization' },
    { from: 'lambda', to: 'act',   label: null },
    { from: 'lambda', to: 'feat',  label: 'formal structure' },
    { from: 'fluid',  to: 'act',   label: 'dynamic process' },
    { from: 'fluid',  to: 'ex',    label: 'instantiates' },
    { from: 'feat',   to: 'act',   label: 'drives' },
    { from: 'act',    to: 'ex',    label: null },
  ];

  function build() {
    const wrap = UI.el('div', '');

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 720 320');
    svg.style.width = '100%';
    svg.style.maxWidth = '720px';
    svg.style.border = 'var(--chrome-border)';
    svg.style.background = 'var(--paper-white)';

    // Edges (rendered first so behind nodes)
    const edgeEls = [];
    for (const e of edges) {
      const n0 = nodes.find(n => n.id === e.from);
      const n1 = nodes.find(n => n.id === e.to);
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', n0.x + 80);
      line.setAttribute('y1', n0.y + 30);
      line.setAttribute('x2', n1.x);
      line.setAttribute('y2', n1.y + 30);
      line.setAttribute('class', 'concept-map-edge');
      line.style.stroke = 'var(--ink-light)';
      line.style.strokeWidth = '1.5px';
      svg.appendChild(line);
      edgeEls.push({ el: line, from: e.from, to: e.to });

      // Edge label
      if (e.label) {
        const mx = (n0.x + 80 + n1.x) / 2;
        const my = (n0.y + 30 + n1.y + 30) / 2;
        const g = document.createElementNS(svgNS, 'g');
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', mx - 50);
        rect.setAttribute('y', my - 10);
        rect.setAttribute('width', '100');
        rect.setAttribute('height', '18');
        rect.setAttribute('fill', 'var(--paper-white)');
        rect.setAttribute('stroke', 'var(--ink-light)');
        rect.setAttribute('stroke-width', '1');
        g.appendChild(rect);
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', mx);
        text.setAttribute('y', my + 3);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', "'JetBrains Mono', monospace");
        text.setAttribute('font-size', '9');
        text.setAttribute('fill', 'var(--ink-mid)');
        text.textContent = e.label;
        g.appendChild(text);
        svg.appendChild(g);
      }
    }

    // Nodes
    for (const n of nodes) {
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', 'concept-map-node');
      g.style.cursor = 'pointer';

      // Background rect
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', n.x);
      rect.setAttribute('y', n.y);
      rect.setAttribute('width', '160');
      rect.setAttribute('height', '90');
      rect.setAttribute('fill', 'var(--paper-white)');
      rect.setAttribute('stroke', 'var(--ink)');
      rect.setAttribute('stroke-width', '2');
      g.appendChild(rect);

      // Hatched accent strip at top
      const strip = document.createElementNS(svgNS, 'rect');
      strip.setAttribute('x', n.x);
      strip.setAttribute('y', n.y);
      strip.setAttribute('width', '160');
      strip.setAttribute('height', '6');
      strip.setAttribute('fill', 'var(--mix-y)');
      g.appendChild(strip);

      // Traffic dots
      const dotColors = ['var(--rgb-r)', 'var(--mix-y)', 'var(--rgb-g)'];
      for (let d = 0; d < 3; d++) {
        const c = document.createElementNS(svgNS, 'circle');
        c.setAttribute('cx', n.x + 12 + d * 14);
        c.setAttribute('cy', n.y + 18);
        c.setAttribute('r', '4');
        c.setAttribute('fill', dotColors[d]);
        c.setAttribute('stroke', 'var(--ink)');
        c.setAttribute('stroke-width', '1');
        g.appendChild(c);
      }

      // Title (left-anchored past dots)
      const title = document.createElementNS(svgNS, 'text');
      title.setAttribute('x', n.x + 48);
      title.setAttribute('y', n.y + 22);
      title.setAttribute('font-family', "'IBM Plex Serif', serif");
      title.setAttribute('font-size', '13');
      title.setAttribute('font-weight', 'bold');
      title.setAttribute('fill', 'var(--ink)');
      title.textContent = n.title;
      g.appendChild(title);

      // Bullets
      for (let b = 0; b < n.bullets.length; b++) {
        const t = document.createElementNS(svgNS, 'text');
        t.setAttribute('x', n.x + 10);
        t.setAttribute('y', n.y + 42 + b * 16);
        t.setAttribute('font-family', "'IBM Plex Sans', sans-serif");
        t.setAttribute('font-size', '11');
        t.setAttribute('fill', 'var(--ink-mid)');
        t.textContent = '• ' + n.bullets[b];
        g.appendChild(t);
      }

      // Click to highlight incident edges
      g.addEventListener('click', () => {
        for (const ee of edgeEls) {
          if (ee.from === n.id || ee.to === n.id) {
            ee.el.style.stroke = 'var(--mix-y)';
            ee.el.style.strokeWidth = '2.5px';
          } else {
            ee.el.style.stroke = 'var(--ink-light)';
            ee.el.style.strokeWidth = '1.5px';
          }
        }
      });

      svg.appendChild(g);
    }

    wrap.appendChild(svg);
    return wrap;
  }

  return { build };
})();
