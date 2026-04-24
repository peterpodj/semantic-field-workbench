/* ==============================================================
   SEMANTIC FIELD SIMULATION — shared utilities
   Pure JS module (loaded after React so `window` is available)
   ============================================================== */

window.SF = (function () {
  'use strict';

  // ---------- LATEX HELPER (KaTeX must be loaded) ----------
  function TeX({ children, block = false }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (!ref.current || !window.katex) return;
      try {
        window.katex.render(children, ref.current, {
          displayMode: block, throwOnError: false, strict: 'ignore',
        });
      } catch (e) { ref.current.textContent = children; }
    }, [children, block]);
    return React.createElement(block ? 'div' : 'span', {
      ref, className: block ? 'eq-block' : 'eq-inline',
    });
  }

  // ---------- SEEDED RANDOM ----------
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- UTILITY ----------
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ---------- VOCABULARY DATA ----------
  // Each word has position in feature space, a field it belongs to, and a short gloss.
  // Feature axes differ per field; axis meaning described on the field object.
  const FIELDS = {
    temperature: {
      id: 'temperature',
      title: 'Temperature',
      color: 'var(--field-temp)',
      colorRaw: '#E8886E',
      axes: ['intensity', 'affect'],
      axisLabels: ['← cold   intensity   hot →', '← negative   affect   positive →'],
      lambda: '\\lambda c.\\,\\text{temp}(w,c)',
      words: [
        { w: 'frigid',  x: 0.05, y: 0.10 },
        { w: 'freezing',x: 0.10, y: 0.18 },
        { w: 'cold',    x: 0.20, y: 0.35 },
        { w: 'chilly',  x: 0.28, y: 0.50 },
        { w: 'cool',    x: 0.38, y: 0.62 },
        { w: 'mild',    x: 0.48, y: 0.72 },
        { w: 'warm',    x: 0.62, y: 0.82 },
        { w: 'hot',     x: 0.78, y: 0.72 },
        { w: 'scorching',x:0.88, y: 0.55 },
        { w: 'blazing', x: 0.94, y: 0.42 },
      ],
    },
    motion: {
      id: 'motion',
      title: 'Motion',
      color: 'var(--field-motion)',
      colorRaw: '#7AA9D6',
      axes: ['speed', 'grace'],
      axisLabels: ['← still   speed   fast →', '← labored   grace   fluid →'],
      lambda: '\\lambda c.\\,\\text{move}(w,c)',
      words: [
        { w: 'still',   x: 0.05, y: 0.50 },
        { w: 'crawl',   x: 0.15, y: 0.20 },
        { w: 'shuffle', x: 0.22, y: 0.30 },
        { w: 'walk',    x: 0.35, y: 0.55 },
        { w: 'stroll',  x: 0.40, y: 0.75 },
        { w: 'jog',     x: 0.55, y: 0.55 },
        { w: 'run',     x: 0.68, y: 0.60 },
        { w: 'sprint',  x: 0.82, y: 0.45 },
        { w: 'dash',    x: 0.88, y: 0.65 },
        { w: 'glide',   x: 0.60, y: 0.88 },
        { w: 'dart',    x: 0.78, y: 0.80 },
      ],
    },
    math: {
      id: 'math',
      title: 'Math Ops',
      color: 'var(--field-math)',
      colorRaw: '#9B7FC7',
      axes: ['arity', 'order'],
      axisLabels: ['← unary   arity   n-ary →', '← elementary   order   higher-order →'],
      lambda: '\\lambda f.\\,\\nabla f',
      words: [
        { w: 'negate',  x: 0.10, y: 0.18 },
        { w: 'add',     x: 0.55, y: 0.12 },
        { w: 'subtract',x: 0.55, y: 0.22 },
        { w: 'multiply',x: 0.65, y: 0.28 },
        { w: 'divide',  x: 0.65, y: 0.36 },
        { w: 'sum',     x: 0.88, y: 0.20 },
        { w: 'product', x: 0.88, y: 0.32 },
        { w: 'diff',    x: 0.28, y: 0.65 },
        { w: 'integrate',x:0.70, y: 0.72 },
        { w: 'gradient',x: 0.30, y: 0.82 },
        { w: 'divergence',x:0.55, y:0.88 },
        { w: 'curl',    x: 0.45, y: 0.75 },
      ],
    },
    data: {
      id: 'data',
      title: 'Data / IT',
      color: 'var(--field-data)',
      colorRaw: '#98BE91',
      axes: ['structure', 'volatility'],
      axisLabels: ['← atomic   structure   composite →', '← immutable   volatility   streaming →'],
      lambda: '\\lambda q.\\,\\text{resolve}(q)',
      words: [
        { w: 'byte',     x: 0.05, y: 0.20 },
        { w: 'int',      x: 0.12, y: 0.15 },
        { w: 'string',   x: 0.18, y: 0.28 },
        { w: 'record',   x: 0.40, y: 0.30 },
        { w: 'table',    x: 0.55, y: 0.25 },
        { w: 'tree',     x: 0.62, y: 0.40 },
        { w: 'graph',    x: 0.78, y: 0.35 },
        { w: 'document', x: 0.72, y: 0.55 },
        { w: 'blob',     x: 0.85, y: 0.48 },
        { w: 'event',    x: 0.40, y: 0.82 },
        { w: 'stream',   x: 0.60, y: 0.88 },
        { w: 'queue',    x: 0.30, y: 0.72 },
        { w: 'log',      x: 0.22, y: 0.65 },
      ],
    },
  };

  // Unified bag for "unknown word" lookup — so "cache" lands near "log/queue", etc.
  const LEXICON_HINTS = {
    // temperature family
    frosty:'temperature', icy:'temperature', tepid:'temperature', boiling:'temperature',
    lukewarm:'temperature', arctic:'temperature', tropical:'temperature',
    // motion
    stride:'motion', pace:'motion', trot:'motion', gallop:'motion', saunter:'motion',
    creep:'motion', race:'motion', zoom:'motion', drift:'motion',
    // math
    derive:'math', laplacian:'math', hessian:'math', matmul:'math', dot:'math',
    cross:'math', modulo:'math', exponent:'math',
    // data / IT
    cache:'data', buffer:'data', heap:'data', stack:'data', hashmap:'data',
    schema:'data', pipeline:'data', shard:'data', partition:'data', index:'data',
    row:'data', column:'data', key:'data', value:'data', pointer:'data', packet:'data',
  };

  function guessField(word) {
    const lw = word.toLowerCase().trim();
    if (!lw) return null;
    for (const f of Object.values(FIELDS)) {
      if (f.words.some(d => d.w === lw)) return f.id;
    }
    if (LEXICON_HINTS[lw]) return LEXICON_HINTS[lw];
    // heuristics by substring
    if (/(cold|hot|warm|cool|freez|boil|tepid|chill|frost)/.test(lw)) return 'temperature';
    if (/(run|walk|crawl|dash|sprint|jog|glide|drift|race|flow|stride)/.test(lw)) return 'motion';
    if (/(add|sub|mul|div|int|deriv|grad|sum|prod|oper|calc)/.test(lw)) return 'math';
    if (/(byte|bit|log|stream|queue|cache|db|sql|row|col|graph|tree|node|table|json|ptr|packet|buf)/.test(lw)) return 'data';
    return null;
  }

  // Approximate placement of an unknown word inside its guessed field
  // — uses a hash for stable pseudo-random position, then snaps to field's cloud centroid zone.
  function placeWord(word, fieldId) {
    const field = FIELDS[fieldId];
    if (!field) return { x: 0.5, y: 0.5 };
    // centroid
    const cx = field.words.reduce((s, p) => s + p.x, 0) / field.words.length;
    const cy = field.words.reduce((s, p) => s + p.y, 0) / field.words.length;
    // hash
    let h = 2166136261;
    for (let i = 0; i < word.length; i++) { h ^= word.charCodeAt(i); h = Math.imul(h, 16777619); }
    const rand = mulberry32(h >>> 0);
    const r = 0.18 * rand();
    const a = 2 * Math.PI * rand();
    return {
      x: clamp(cx + r * Math.cos(a), 0.06, 0.94),
      y: clamp(cy + r * Math.sin(a), 0.06, 0.94),
    };
  }

  // ---------- 2D DIFFUSION + ADVECTION GRID ----------
  class Field2D {
    constructor(W, H) {
      this.W = W; this.H = H;
      this.phi = new Float32Array(W * H);
      this.next = new Float32Array(W * H);
      // RGB channels for "multi-species" activation
      this.R = new Float32Array(W * H);
      this.G = new Float32Array(W * H);
      this.B = new Float32Array(W * H);
      this.Rn = new Float32Array(W * H);
      this.Gn = new Float32Array(W * H);
      this.Bn = new Float32Array(W * H);
    }
    idx(x, y) { return y * this.W + x; }
    inject(x, y, amt, channel = 'all') {
      const r = 3;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= this.W || ny >= this.H) continue;
        const d = Math.hypot(dx, dy);
        if (d > r) continue;
        const a = amt * (1 - d / r);
        const i = this.idx(nx, ny);
        if (channel === 'R' || channel === 'all') this.R[i] = Math.min(1.2, this.R[i] + a);
        if (channel === 'G' || channel === 'all') this.G[i] = Math.min(1.2, this.G[i] + a);
        if (channel === 'B' || channel === 'all') this.B[i] = Math.min(1.2, this.B[i] + a);
      }
    }
    // Explicit diffusion: phi_t = D * lap(phi); and advection: -u . grad(phi)
    step(D, ux, uy, decay) {
      const { W, H } = this;
      for (const [src, dst] of [[this.R, this.Rn], [this.G, this.Gn], [this.B, this.Bn]]) {
        for (let y = 1; y < H - 1; y++) {
          for (let x = 1; x < W - 1; x++) {
            const i = y * W + x;
            const c = src[i];
            // Laplacian
            const lap = src[i - 1] + src[i + 1] + src[i - W] + src[i + W] - 4 * c;
            // advection (upwind, stable for small dt)
            const gx = (src[i + 1] - src[i - 1]) * 0.5;
            const gy = (src[i + W] - src[i - W]) * 0.5;
            const adv = -(ux * gx + uy * gy);
            let v = c + D * lap + adv - decay * c;
            if (v < 0) v = 0;
            dst[i] = v;
          }
        }
      }
      [this.R, this.Rn] = [this.Rn, this.R];
      [this.G, this.Gn] = [this.Gn, this.G];
      [this.B, this.Bn] = [this.Bn, this.B];
    }
    clear() {
      this.R.fill(0); this.G.fill(0); this.B.fill(0);
    }
  }

  // Expose
  return {
    TeX, FIELDS, LEXICON_HINTS, guessField, placeWord,
    Field2D, mulberry32, clamp, lerp, smoothstep, dist,
  };
})();
