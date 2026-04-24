/* it-apps.js — §06 six IT domain application cards
   Patched for IT-linguistic fidelity: explicit mapping table, degenerate-case
   flags, disclaimer, and consistent formal notation per card.
*/

const ITApps = (function() {
  'use strict';

  const UI = window.UI;

  const apps = [
    {
      label: 'Vector DBs',
      headline: 'Semantic retrieval as field query',
      equation: String.raw`R(q) = \{\, d \in D : \lVert \vec{e}(d) - q \rVert < \epsilon \,\}`,
      map: {
        word: 'query embedding q',
        field: 'corpus embedding space',
        diffusion: 'kNN / ANN approximation (exact distance → neighborhood)',
        advection: 'query drift / reformulation',
        decay: 'index freshness / embedding staleness'
      }
    },
    {
      label: 'Content Routing',
      headline: 'Propagation of relevance signals',
      equation: String.raw`\partial_t \phi = D\nabla^2\phi - \vec{u}\cdot\nabla\phi - k\phi`,
      map: {
        word: 'content item',
        field: 'topic priority space',
        diffusion: 'cross-topic spillover (related topics boosted)',
        advection: 'user traffic direction (demand drives distribution)',
        decay: 'content aging / trend half-life'
      }
    },
    {
      label: 'Cache Warming',
      headline: 'Pre-fetching by predicted demand',
      equation: String.raw`\phi_{t+1} = \phi_t + \Delta t\,(D\nabla^2\phi - k\phi)`,
      map: {
        word: 'cache key',
        field: 'key popularity space',
        diffusion: 'popularity diffusion between related keys',
        advection: 'request velocity (read-heavy keys move fast)',
        decay: 'TTL expiration'
      }
    },
    {
      label: 'Incident Propagation',
      headline: 'Alert cascade through service graph',
      equation: String.raw`\partial_t \phi = D\nabla^2\phi - \vec{u}\cdot\nabla\phi - k\phi + S(t)`,
      map: {
        word: 'alert / metric',
        field: 'service dependency graph',
        diffusion: 'blast-radius spread (impact diffuses along edges)',
        advection: 'dependency direction (alerts flow downstream)',
        decay: 'auto-resolution / self-healing'
      }
    },
    {
      label: 'Doc Graphs',
      headline: 'Knowledge diffusion across links',
      equation: String.raw`\phi_i^{(n+1)} = \phi_i^{(n)} + \alpha\sum_j A_{ij}(\phi_j - \phi_i)`,
      map: {
        word: 'concept / node',
        field: 'knowledge graph',
        diffusion: 'edge conductance (information flows through links)',
        advection: 'link direction (directed edges carry flow)',
        decay: 'document staleness / outdated nodes'
      }
    },
    {
      label: 'Feature Stores',
      headline: 'Feature freshness as decaying field',
      equation: String.raw`\partial_t \phi = -k\phi + \sum_m \delta(t - t_m)`,
      map: {
        word: 'feature value',
        field: 'feature manifold',
        diffusion: 'zero — batch updates, no continuous spread',
        advection: 'zero — static store',
        decay: 'TTL staleness (features age until refreshed)'
      },
      note: 'Limit case: D = 0, u⃗ = 0. Only decay + impulse sources remain.'
    }
  ];

  function build() {
    const wrap = UI.el('div', '');

    // Disclaimer
    const disclaimer = UI.el('div', 'explain-card mt-16');
    disclaimer.innerHTML = `
      <div class="explain-card-body" style="font-size:13px;">
        <strong>Disclaimer:</strong> λ-formalism is data-agnostic. The mappings below are
        <em>illustrative</em>, not exhaustive. Each card shows how a semantic-field concept
        (word, field, diffusion, advection, decay) maps to an IT domain, with the
        corresponding equation. The Feature Store card is a <em>degenerate limit case</em>
        where diffusion and advection vanish — this is intentional, not an error.
      </div>
    `;
    wrap.appendChild(disclaimer);

    const grid = UI.el('div', 'grid-6 mt-16');

    for (const app of apps) {
      const card = UI.el('div', 'it-card');
      card.appendChild(UI.el('div', 'it-card-label', app.label));
      card.appendChild(UI.el('div', 'it-card-headline', app.headline));

      // Mapping table inside card
      const table = UI.el('table', 'it-map-table');
      table.style.width = '100%';
      table.style.fontSize = '11px';
      table.style.fontFamily = 'JetBrains Mono, monospace';
      table.style.marginTop = '8px';
      table.style.borderCollapse = 'collapse';

      const rows = [
        ['word', app.map.word, 'λw.'],
        ['field', app.map.field, 'S ⊆ W'],
        ['diffusion (D)', app.map.diffusion, 'D∇²φ'],
        ['advection (u⃗)', app.map.advection, 'u⃗·∇φ'],
        ['decay (k)', app.map.decay, '−kφ']
      ];

      let tbody = '';
      for (const [k, v, f] of rows) {
        tbody += `<tr style="border-bottom:1px dashed var(--ink-mid);">
          <td style="padding:3px 4px;color:var(--ink-mid);white-space:nowrap;">${k}</td>
          <td style="padding:3px 4px;font-family:IBM Plex Serif, serif;font-size:12px;">${v}</td>
          <td style="padding:3px 4px;text-align:right;color:var(--ink-light);white-space:nowrap;">${f}</td>
        </tr>`;
      }
      table.innerHTML = `<tbody>${tbody}</tbody>`;
      card.appendChild(table);

      // Equation
      const eq = UI.el('div', 'it-card-equation');
      eq.style.marginTop = '10px';
      card.appendChild(eq);
      setTimeout(() => {
        if (window.katex) katex.render(app.equation, eq, { throwOnError: false, displayMode: false });
      }, 100);

      // Limit-case note
      if (app.note) {
        const note = UI.el('div', '');
        note.style.fontSize = '10px';
        note.style.color = 'var(--ink-mid)';
        note.style.marginTop = '6px';
        note.style.fontStyle = 'italic';
        note.textContent = app.note;
        card.appendChild(note);
      }

      grid.appendChild(card);
    }

    wrap.appendChild(grid);
    return wrap;
  }

  return { build };
})();
