/* app.js — top-level composition, SectionHeader, topbar, §07 worked example */

const App = (function() {
  'use strict';

  const UI = window.UI;
  const Sim = window.Sim;

  function SectionHeader(num, title) {
    const h = UI.el('div', 'section-header');
    h.appendChild(UI.el('span', 'section-numeral', num));
    h.appendChild(UI.el('span', 'section-title', title));
    return h;
  }

  function Topbar() {
    const bar = UI.el('div', 'topbar');
    bar.appendChild(UI.el('span', 'topbar-title', 'Semantic Field Workbench'));
    bar.appendChild(UI.el('span', 'topbar-meta', 'v1.0 · explicit Euler · console-clean'));
    return bar;
  }

  function WorkedExample() {
    const wrap = UI.el('div', '');
    wrap.appendChild(Sim.TeX(String.raw`
      \begin{cases}
      \partial_t \phi = D\nabla^2\phi - \vec{u}\cdot\nabla\phi - k\phi \\
      \phi(\vec{x},0) = \sum_i S_i \exp\!\left(-\frac{|\vec{x}-\vec{x}_i|^2}{2\sigma^2}\right)
      \end{cases}
    `));

    const body = UI.el('div', 'explain-card mt-16');
    body.innerHTML = `
      <div class="explain-card-title">§07 Worked Example</div>
      <div class="explain-card-body">
        <p>Given two sources at <strong>x₁ = (0.3, 0.4)</strong> and <strong>x₂ = (0.7, 0.6)</strong> with strengths S₁ = 0.8, S₂ = 0.5, and parameters D = 0.10, u⃗ = (0.20, 0.10), k = 0.01:</p>
        <ol style="margin-top:8px;padding-left:20px;">
          <li>Initialize φ with Gaussian sources.</li>
          <li>Step explicit Euler with dt = 0.05 on a 256×256 grid.</li>
          <li>Observe: peaks drift down-right (advection); tails spread (diffusion); total mass slowly decays.</li>
          <li>Stability check: dt < dx²/(4D) ≈ 1/(4·0.10) = 2.5 ✓</li>
        </ol>
      </div>
    `;
    wrap.appendChild(body);
    return wrap;
  }

  function init() {
    document.body.appendChild(Topbar());

    const main = UI.el('div', 'container');
    const layout = UI.el('div', '');
    layout.style.display = 'grid';
    layout.style.gridTemplateColumns = '1fr 260px';
    layout.style.gap = '24px';

    const content = UI.el('div', 'stack');
    const sidebar = UI.el('div', '');

    // Tweaks panel
    const tweaks = TweaksPanel;
    sidebar.appendChild(tweaks.build());

    // §01 Sandbox
    content.appendChild(SectionHeader('01', 'Sandbox'));
    content.appendChild(Sandbox.build(tweaks));

    // §02 Lambda Lens
    content.appendChild(SectionHeader('02', 'λ-Lens'));
    content.appendChild(Sections.buildLambdaLens());

    // §03 Feature Space
    content.appendChild(SectionHeader('03', 'Feature Space'));
    content.appendChild(Sections.buildFeatureSpace());

    // §04 Flow
    content.appendChild(SectionHeader('04', 'Flow'));
    content.appendChild(Sections.buildFlow());

    // §05 Concept Map
    content.appendChild(SectionHeader('05', 'Concept Map'));
    content.appendChild(ConceptMap.build());

    // §06 IT Applications
    content.appendChild(SectionHeader('06', 'IT Applications'));
    content.appendChild(ITApps.build());

    // §07 Worked Example
    content.appendChild(SectionHeader('07', 'Worked Example'));
    content.appendChild(WorkedExample());

    layout.appendChild(content);
    layout.appendChild(sidebar);
    main.appendChild(layout);
    document.body.appendChild(main);
  }

  return { init };
})();
