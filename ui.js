/* ui.js — Window, SectionMark, ExplainCard primitives */

const UI = (function() {
  'use strict';

  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  /* ---------- Window ---------- */
  function Window({ title, variant = 'white', meta, statusLeft, statusRight, children = [] }) {
    const win = el('div', `window window-${variant}`);

    // Titlebar
    const tb = el('div', 'window-titlebar');
    tb.appendChild(el('span', 'traffic-light traffic-red'));
    tb.appendChild(el('span', 'traffic-light traffic-yellow'));
    tb.appendChild(el('span', 'traffic-light traffic-green'));
    if (title) {
      const t = el('span', 'font-mono text-sm', title);
      t.style.marginLeft = '8px';
      tb.appendChild(t);
    }
    if (meta) {
      const m = el('span', 'window-titlebar-meta', meta);
      tb.appendChild(m);
    }
    win.appendChild(tb);

    // Body
    const body = el('div', 'window-body');
    for (const c of children) body.appendChild(c);
    win.appendChild(body);

    // Statusbar
    if (statusLeft || statusRight) {
      const sb = el('div', 'window-statusbar');
      sb.appendChild(el('span', '', statusLeft || ''));
      sb.appendChild(el('span', '', statusRight || ''));
      win.appendChild(sb);
    }

    return win;
  }

  /* ---------- SectionMark ---------- */
  function SectionMark(text) {
    return el('span', 'section-mark', text);
  }

  /* ---------- ExplainCard ---------- */
  function ExplainCard({ title, body }) {
    const card = el('div', 'explain-card');
    if (title) card.appendChild(el('div', 'explain-card-title', title));
    if (body) {
      const b = el('div', 'explain-card-body');
      if (typeof body === 'string') b.textContent = body;
      else b.appendChild(body);
      card.appendChild(b);
    }
    return card;
  }

  return { el, Window, SectionMark, ExplainCard };
})();

/* Egress: bind to window for downstream script access */
window.UI = UI;
