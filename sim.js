/* sim.js — PDE Solver Core + TeX Wrapper */

const Sim = (function() {
  'use strict';

  /* ---------- TeX Rendering ---------- */
  function renderTex(element, latex) {
    if (window.katex) {
      katex.render(latex, element, { throwOnError: false, displayMode: true });
    } else {
      element.textContent = latex;
    }
  }

  function TeX(latex) {
    const el = document.createElement('div');
    el.className = 'equation-block';
    renderTex(el, latex);
    return el;
  }

  /* ---------- PDE Solver ---------- */
  class FieldSolver {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.NX = opts.NX || 128;
      this.NY = opts.NY || 128;
      this.D = opts.D ?? 0.1;
      this.uX = opts.uX ?? 0.0;
      this.uY = opts.uY ?? 0.0;
      this.k = opts.k ?? 0.01;
      this.dt = opts.dt ?? 0.05;
      this.dx = opts.dx ?? 1.0;
      this.dy = opts.dy ?? 1.0;

      this.phi = new Float32Array(this.NX * this.NY);
      this.phiNext = new Float32Array(this.NX * this.NY);
      this.sources = []; // {x, y, strength, word}
      this.running = false;
      this.animId = null;

      this.imageData = this.ctx.createImageData(this.NX, this.NY);
      this.pixels = this.imageData.data;
    }

    idx(i, j) {
      return j * this.NX + i;
    }

    /* 5-point Laplacian with Neumann boundaries */
    laplacian(i, j) {
      const NX = this.NX, NY = this.NY;
      const ip = i < NX - 1 ? i + 1 : i;
      const im = i > 0 ? i - 1 : i;
      const jp = j < NY - 1 ? j + 1 : j;
      const jm = j > 0 ? j - 1 : j;
      const p = this.phi;
      const id = (x, y) => y * NX + x;
      return (
        p[id(ip, j)] + p[id(im, j)] + p[id(i, jp)] + p[id(i, jm)] - 4 * p[id(i, j)]
      ) / (this.dx * this.dy);
    }

    /* Upwind advection */
    advection(i, j) {
      const NX = this.NX, NY = this.NY;
      const p = this.phi;
      const id = (x, y) => y * NX + x;
      let dpx = 0, dpy = 0;
      if (this.uX > 0) {
        const im = i > 0 ? i - 1 : i;
        dpx = (p[id(i, j)] - p[id(im, j)]) / this.dx;
      } else {
        const ip = i < NX - 1 ? i + 1 : i;
        dpx = (p[id(ip, j)] - p[id(i, j)]) / this.dx;
      }
      if (this.uY > 0) {
        const jm = j > 0 ? j - 1 : j;
        dpy = (p[id(i, j)] - p[id(i, jm)]) / this.dy;
      } else {
        const jp = j < NY - 1 ? j + 1 : j;
        dpy = (p[id(i, jp)] - p[id(i, j)]) / this.dy;
      }
      return this.uX * dpx + this.uY * dpy;
    }

    step() {
      const NX = this.NX, NY = this.NY;
      // Re-inject sources each frame
      for (const s of this.sources) {
        this.injectSource(s.x, s.y, s.strength);
      }
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
          const lap = this.laplacian(i, j);
          const adv = this.advection(i, j);
          const idx = this.idx(i, j);
          this.phiNext[idx] = this.phi[idx] + this.dt * (this.D * lap - adv - this.k * this.phi[idx]);
        }
      }
      // Swap
      const tmp = this.phi;
      this.phi = this.phiNext;
      this.phiNext = tmp;
    }

    injectSource(x, y, strength = 1.0, sigma = 3.0) {
      const NX = this.NX, NY = this.NY;
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
          const dx = i - x, dy = j - y;
          const dist2 = dx * dx + dy * dy;
          const val = strength * Math.exp(-dist2 / (2 * sigma * sigma));
          this.phi[this.idx(i, j)] += val;
        }
      }
    }

    /* Viridis-ish ramp modulated by active palette */
    colorMap(v) {
      // Clamp
      v = Math.max(0, Math.min(1, v));
      // Simple viridis approximation
      const r = Math.max(0, Math.min(255, Math.round(68 + 220 * Math.pow(v, 2.5))));
      const g = Math.max(0, Math.min(255, Math.round(1 + 220 * Math.pow(v, 1.5))));
      const b = Math.max(0, Math.min(255, Math.round(84 + 170 * v)));
      return [r, g, b];
    }

    draw() {
      const NX = this.NX, NY = this.NY;
      let peak = 0, total = 0;
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
          const idx = this.idx(i, j);
          const val = this.phi[idx];
          if (val > peak) peak = val;
          total += val;
        }
      }
      const scale = peak > 0.001 ? 1 / peak : 1;
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
          const idx = this.idx(i, j);
          const v = this.phi[idx] * scale;
          const [r, g, b] = this.colorMap(v);
          const pIdx = (j * NX + i) * 4;
          this.pixels[pIdx] = r;
          this.pixels[pIdx + 1] = g;
          this.pixels[pIdx + 2] = b;
          this.pixels[pIdx + 3] = 255;
        }
      }
      this.ctx.putImageData(this.imageData, 0, 0);
      return { peak, total };
    }

    start() {
      if (this.running) return;
      this.running = true;
      const loop = () => {
        if (!this.running) return;
        this.step();
        this.draw();
        this.animId = requestAnimationFrame(loop);
      };
      loop();
    }

    stop() {
      this.running = false;
      if (this.animId) cancelAnimationFrame(this.animId);
    }

    reset() {
      this.phi.fill(0);
      this.phiNext.fill(0);
      this.draw();
    }

    clearSources() {
      this.sources = [];
    }

    addSource(x, y, word) {
      // Normalize to grid coords
      const gridX = Math.floor((x / this.canvas.clientWidth) * this.NX);
      const gridY = Math.floor((y / this.canvas.clientHeight) * this.NY);
      this.sources.push({ x: gridX, y: gridY, strength: 0.8, word });
      this.injectSource(gridX, gridY, 0.8);
    }

    setParams({ D, uX, uY, k }) {
      if (D !== undefined) this.D = D;
      if (uX !== undefined) this.uX = uX;
      if (uY !== undefined) this.uY = uY;
      if (k !== undefined) this.k = k;
    }
  }

  return { TeX, FieldSolver, renderTex };
})();

/* Egress: bind to window for downstream script access */
window.Sim = Sim;
