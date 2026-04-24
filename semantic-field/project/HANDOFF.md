# Session Handoff — Semantic Field Workbench

## Executive Summary

Built a comprehensive interactive artifact exploring **semantic fields** as a general IT concept — data represented and linked in a grounded mathematical space. Entry point: **`Semantic Fields.html`**.

The piece is framed as a retro-OS "workbench": pixel window chrome, hatched fills, yellow/cream palette with RGB accent mixes, VT323 display + JetBrains Mono + IBM Plex Serif. Math rendered in KaTeX. Seven sections, each anchored to a live interactive. Tweaks panel exposes diffusion/advection/decay + theme + active field.

The hero is a real 2D reaction–diffusion–advection simulation: the user types words, drops them onto a canvas, and watches activation diffuse under `∂ₜφ = D∇²φ − u⃗·∇φ`. The same PDE is then reused downstream as a metaphor for information propagation in IT systems.

Three verifier-reported bugs resolved at end of session: section-header numeral/title collision (grid layout fix), concept-map title clipping behind traffic-light dots (left-anchor past dots), and a `<TeX block>` nested inside `<p>` (unwrapped).

**Status:** Shipped, console-clean, verifier-clean.

---

## Table of Contents

| # | File | Role |
|---|---|---|
| 1 | `Semantic Fields.html` | Entry point — shell, fonts, KaTeX, script load order |
| 2 | `styles.css` | Design tokens, window chrome, hatch patterns, layout helpers |
| 3 | `tweaks-panel.jsx` | Host protocol + form controls (starter component) |
| 4 | `ui.jsx` | `Window`, `SectionMark`, `ExplainCard`, chrome primitives |
| 5 | `sim.jsx` | `TeX` wrapper + diffusion/advection numerical core |
| 6 | `sandbox.jsx` | §01 — hero: type-word → place → simulate |
| 7 | `sections.jsx` | §02 λ-lens, §03 feature space, §04 flow |
| 8 | `concept-map.jsx` | §05 — node-graph SVG rendered from excalidraw source |
| 9 | `it-apps.jsx` | §06 — six IT-domain applications grid |
| 10 | `app.jsx` | Top-level composition, `SectionHeader`, topbar, §07 worked example |

---

## Chapter 1 — Design System

- **Palette:** `--paper`, `--paper-white`, `--paper-pale`, `--ink`, `--mix-y` (yellow), `--rgb-r/g/b`, tonal swatches (sky, violet, peach, mint, butter, sage).
- **Type:** VT323 (display), JetBrains Mono (UI/code), IBM Plex Serif (prose/equations), IBM Plex Sans (captions/labels).
- **Chrome:** pixel-stepped shadows, dashed dividers, hatched fills via CSS `linear-gradient`, 2px solid ink borders — no rounded corners on window chrome.
- **Windows:** `Window` component w/ variants `yellow` | `cream` | `white`, optional titlebar meta + statusbar (left/right).

## Chapter 2 — Simulation Core (`sim.jsx`)

2D grid solver. Explicit Euler step: `φ' = φ + dt·(D·∇²φ − u·∇φ − kφ)`. 5-point Laplacian, upwind advection. `requestAnimationFrame` loop. Grid is a `Float32Array` drawn to canvas via `ImageData` with a viridis-ish ramp modulated by the active palette. Decay keeps the field from saturating.

## Chapter 3 — Sandbox (`sandbox.jsx`)

- Text input → adds a word token; click the canvas to drop it as a Gaussian source.
- Sources persist and re-inject each frame (rate-limited) so fields stay readable.
- Legend, controls (reset, clear sources, play/pause), live stats (total activation, peak).
- Everything reads its knobs from the Tweaks panel.

## Chapter 4 — Conceptual Sections (`sections.jsx`)

- **§02 Lambda lens** — `I(w) = λc. h(c, f⃗(w))`. A draggable context pad re-ranks a vocabulary against the current context point.
- **§03 Feature space** — vectors in `{−1,0,1}ⁿ`; live table with `χ_S = λw. g(f⃗(w))`; hover rows to highlight membership.
- **§04 Flow** — standalone vector-field SVG + mini sim, showing advection dominating diffusion as `|u|` grows.

## Chapter 5 — Concept Map (`concept-map.jsx`)

Static SVG re-render of the excalidraw source. Six nodes (ling / lambda / fluid / feat / act / ex) with titlebar traffic-dots, hatched accent strip, bullet list. Click to highlight incident edges. Titles left-anchored at `n.x + 48` past the dots (post-fix).

## Chapter 6 — IT Applications (`it-apps.jsx`)

Grid of six domain cards, each showing the same math re-cast:
vector DBs, content routing, cache warming, incident propagation, doc graphs, feature stores. Each card: domain label → headline → equation → 3-bullet mapping (φ, u⃗, D interpretation).

## Chapter 7 — Tweaks

Persisted via `/*EDITMODE-BEGIN*/...{/*EDITMODE-END*/}` JSON block in `app.jsx`. Exposes: `diffusion` (D), `advX`/`advY` (u⃗), `decay`, `showGrid`, `activeField`, `theme`. All controls live-update.

---

## Known Next Steps (if resumed)

- Add a **save/share** button: serialize sandbox sources to URL hash.
- Wire **IT app cards** to a shared sim instance — switching domain swaps the label layer on the same field.
- Add a **1D cross-section probe** under the 2D canvas (time-series of φ along a horizontal line).
- Consider a **dark mode** variant using the terminal-green/amber palette that was offered but not selected.
