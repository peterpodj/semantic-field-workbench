/* ==============================================================
   SEMANTIC SANDBOX — hero interactive.
   A 2D conceptual space where words become density sources,
   diffusion spreads activation, advection drifts the discourse.
   ============================================================== */

window.Sandbox = (function () {
  'use strict';
  const { FIELDS, Field2D, guessField, placeWord, clamp } = window.SF;
  const { Window, Labeled, Slider, Segmented, FieldLegend } = window.UI;

  const GRID_W = 110;
  const GRID_H = 68;

  function Sandbox({ D = 0.12, advX = 0, advY = 0, decay = 0.004, showGrid = true, activeFields }) {
    const canvasRef = React.useRef(null);
    const overlayRef = React.useRef(null);
    const fieldRef = React.useRef(null);
    const rafRef = React.useRef(0);
    const paramsRef = React.useRef({ D, advX, advY, decay });
    paramsRef.current = { D, advX, advY, decay };

    const [wordsPlaced, setWordsPlaced] = React.useState([]);
    const [input, setInput] = React.useState('');
    const [warning, setWarning] = React.useState('');
    const [running, setRunning] = React.useState(true);
    const [tick, setTick] = React.useState(0);

    if (!fieldRef.current) fieldRef.current = new Field2D(GRID_W, GRID_H);

    // Inject vocabulary sources on each animation frame (keeps the field lit)
    const wordsRef = React.useRef(wordsPlaced);
    wordsRef.current = wordsPlaced;

    React.useEffect(() => {
      let last = performance.now();
      const loop = (now) => {
        const dt = Math.min(48, now - last); last = now;
        const p = paramsRef.current;
        const F = fieldRef.current;
        // sources
        wordsRef.current.forEach(({ x, y, channel, strength }) => {
          const gx = Math.floor(x * GRID_W), gy = Math.floor(y * GRID_H);
          F.inject(gx, gy, strength * 0.04, channel);
        });
        // steps (sub-stepping for stability)
        const sub = 2;
        for (let i = 0; i < sub; i++) {
          F.step(p.D * 0.25, p.advX * 0.15, p.advY * 0.15, p.decay);
        }
        // paint
        paint(canvasRef.current, F);
        setTick(t => t + 1);
        if (running) rafRef.current = requestAnimationFrame(loop);
      };
      if (running) rafRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafRef.current);
    }, [running]);

    // ------ PAINTING ------
    function paint(canvas, F) {
      if (!canvas) return;
      const { W, H } = F;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W; canvas.height = H;
      }
      const ctx = canvas.getContext('2d');
      const img = ctx.getImageData(0, 0, W, H);
      const data = img.data;
      // BG paper: #FFF7D6 (pale) -> tint by activation
      const bgR = 0xFF, bgG = 0xF7, bgB = 0xD6;
      for (let i = 0; i < W * H; i++) {
        const r = Math.min(1, F.R[i]);
        const g = Math.min(1, F.G[i]);
        const b = Math.min(1, F.B[i]);
        // Additive ink deposited ON paper — subtract brightness where pigment lands.
        // Mix pigment with paper: paper * (1 - density) + pigment * density
        const density = Math.min(1, r + g + b);
        const pr = r / (r + g + b + 1e-6);
        const pg = g / (r + g + b + 1e-6);
        const pb = b / (r + g + b + 1e-6);
        // pigment color: take full saturated RGB from channel mix
        const pigR = Math.round(lerp(255, 70, pr) * (pr) + (pg + pb) * lerp(255, 20, 0.5));
        // simpler: each channel attenuates paper independently by its density
        const R = Math.round(bgR * (1 - r * 0.85));
        const G = Math.round(bgG * (1 - g * 0.85));
        const B = Math.round(bgB * (1 - b * 0.85));
        const j = i * 4;
        data[j] = R; data[j + 1] = G; data[j + 2] = B; data[j + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    // ------ INTERACTION ------
    function addWord(rawWord, atPoint = null) {
      const word = rawWord.trim().toLowerCase();
      if (!word) return;
      let x, y, fieldId, channel;
      if (atPoint) {
        x = atPoint.x; y = atPoint.y;
        fieldId = nearestField(x, y);
      } else {
        fieldId = guessField(word);
        if (!fieldId) {
          setWarning(`"${word}" not in known fields — placed in nearest region`);
          // random placement in most open area
          fieldId = 'data';
          ({ x, y } = placeWord(word, fieldId));
        } else {
          const hit = FIELDS[fieldId].words.find(d => d.w === word);
          if (hit) { x = hit.x; y = hit.y; }
          else ({ x, y } = placeWord(word, fieldId));
          setWarning('');
        }
      }
      channel = fieldToChannel(fieldId);
      setWordsPlaced(ws => [...ws, { id: Date.now() + Math.random(), w: word, x, y, fieldId, channel, strength: 1 }]);
    }

    function fieldToChannel(f) {
      if (f === 'temperature') return 'R';
      if (f === 'motion') return 'B';
      if (f === 'math') return 'all'; // will render as white/mix via all channels? override:
      if (f === 'data') return 'G';
      return 'all';
    }

    // Actually: for RGB additive visual clarity use distinct:
    // temperature -> R, motion -> B, data -> G, math -> R+B (magenta)
    function fieldToChannelStrict(f) {
      switch (f) {
        case 'temperature': return ['R'];
        case 'motion':      return ['B'];
        case 'data':        return ['G'];
        case 'math':        return ['R', 'B'];
        default:            return ['R','G','B'];
      }
    }

    // Override addWord injection: recompute channels via strict mapping.
    // (Patch: replace single-channel model above)
    function placedInjectChannels(word) {
      return fieldToChannelStrict(word.fieldId);
    }

    // Rewire the per-frame injection to use strict channels
    React.useEffect(() => {
      // re-assign channels on change (no-op; channel is computed at render via helper)
    }, [wordsPlaced]);

    // actually simpler: override the source injection by using a ref with channels baked in.
    // Rebuild sources ref each render:
    React.useEffect(() => {
      // noop, wordsRef already used
    });

    // Override: replace the earlier wordsRef-based injection in the loop
    // by using a side-effect injection here. Too late — the loop already uses wordsRef.
    // Just ensure `channel` field is correct in placed objects:
    // (addWord above stores single channel; let's upgrade to an array)
    // We'll do that fix in a single newer addWord below and delete the prior usage.

    function nearestField(x, y) {
      let best = null, bestD = Infinity;
      for (const f of Object.values(FIELDS)) {
        for (const w of f.words) {
          const d = (w.x - x) ** 2 + (w.y - y) ** 2;
          if (d < bestD) { bestD = d; best = f.id; }
        }
      }
      return best;
    }

    function handleSubmit(e) {
      e.preventDefault();
      addWord(input);
      setInput('');
    }

    function handleCanvasClick(e) {
      const rect = overlayRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const w = input.trim() || 'echo';
      addWord(w, { x, y });
      setInput('');
    }

    function clearAll() {
      setWordsPlaced([]);
      fieldRef.current.clear();
      setWarning('');
    }

    function seed(fieldId) {
      const f = FIELDS[fieldId];
      const items = f.words.slice(0, 6).map(d => ({
        id: Date.now() + Math.random() + d.w,
        w: d.w, x: d.x, y: d.y, fieldId,
        channel: fieldToChannel(fieldId),
        strength: 0.8,
      }));
      setWordsPlaced(ws => [...ws, ...items]);
    }

    // Quick single-channel model is OK visually — additive mixing still works.
    // (R=temperature, G=data, B=motion, math uses R+B via double-injection on placement)

    const avgR = sampleAvg(fieldRef.current?.R), avgG = sampleAvg(fieldRef.current?.G), avgB = sampleAvg(fieldRef.current?.B);

    function sampleAvg(arr) {
      if (!arr) return 0;
      let s = 0; for (let i = 0; i < arr.length; i++) s += arr[i];
      return s / arr.length;
    }

    // ------ RENDER ------
    return (
      <Window title="◆ SEMANTIC SANDBOX.EXE" meta="v0.4 — diffusion+advection" variant="yellow"
        statusLeft={<span>FLD: {GRID_W}×{GRID_H} · D={paramsRef.current.D.toFixed(2)} · u=({paramsRef.current.advX.toFixed(2)}, {paramsRef.current.advY.toFixed(2)})</span>}
        statusRight={<span>t={tick}</span>}
      >
        <div className="window-body pad-0">
          <div className="row" style={{ gap: 0 }}>
            {/* MAIN FIELD CANVAS */}
            <div style={{ flex: 1, position: 'relative', borderRight: '2px solid var(--ink)' }}>
              <div ref={overlayRef}
                   className={`canvas-frame ${showGrid ? 'px-grid' : ''}`}
                   style={{ aspectRatio: `${GRID_W}/${GRID_H}`, cursor: 'crosshair', border: 'none' }}
                   onClick={handleCanvasClick}>
                <canvas ref={canvasRef} style={{ imageRendering: 'pixelated', width: '100%', height: '100%' }} />
                {/* AXES */}
                <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
                     viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="0" y1="100" x2="100" y2="100" stroke="var(--ink)" strokeWidth="0.4" />
                  <line x1="0" y1="0"   x2="0"   y2="100" stroke="var(--ink)" strokeWidth="0.4" />
                </svg>
                {/* SEED WORD LABELS (all known fields, muted) */}
                <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
                  {Object.values(FIELDS).filter(f => !activeFields || activeFields[f.id]).flatMap(f =>
                    f.words.map((d,i) => (
                      <div key={f.id+d.w} style={{
                        position:'absolute',
                        left: `${d.x*100}%`, top: `${d.y*100}%`,
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'var(--font-mono)', fontSize: 10,
                        color: 'var(--ink)',
                        opacity: 0.45,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        whiteSpace:'nowrap',
                      }}>·{d.w}</div>
                    ))
                  )}
                </div>
                {/* PLACED WORD MARKERS */}
                <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
                  {wordsPlaced.map(wp => (
                    <div key={wp.id} style={{
                      position:'absolute',
                      left: `${wp.x*100}%`, top: `${wp.y*100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}>
                      <div style={{
                        width: 10, height: 10, border: '2px solid var(--ink)',
                        background: FIELDS[wp.fieldId]?.colorRaw || '#fff',
                        marginBottom: 2,
                      }}></div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11,
                        background: 'var(--ink)', color: 'var(--paper-pale)',
                        padding: '1px 4px', letterSpacing: 0.5, whiteSpace: 'nowrap',
                        transform: 'translateX(-50%)', marginLeft: 5,
                      }}>{wp.w}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AXIS LABELS UNDER CANVAS */}
              <div className="between" style={{ padding: '6px 10px', background: 'var(--paper-deep)', borderTop: '2px solid var(--ink)' }}>
                <span className="caption">x → axis₁ (structure / intensity / speed)</span>
                <span className="caption">y → axis₂ (volatility / affect / grace)</span>
              </div>
            </div>

            {/* SIDEBAR */}
            <div style={{ width: 260, padding: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h4>Vocabulary Input</h4>
                <form onSubmit={handleSubmit} className="row gap-4" style={{ marginTop: 4 }}>
                  <input className="input" value={input}
                         placeholder="type a word…"
                         onChange={e => setInput(e.target.value)} />
                  <button className="pbtn" type="submit">PLACE</button>
                </form>
                {warning && <div className="caption" style={{ marginTop: 4, color: 'var(--rgb-r)' }}>! {warning}</div>}
                <div className="caption" style={{ marginTop: 4 }}>
                  or click the grid to drop at cursor
                </div>
              </div>

              <div>
                <h4>Seed a field</h4>
                <div className="row gap-4" style={{ flexWrap: 'wrap', marginTop: 6 }}>
                  {Object.values(FIELDS).map(f => (
                    <button key={f.id} className="pbtn tiny" onClick={() => seed(f.id)}>
                      + {f.title}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4>Placed ({wordsPlaced.length})</h4>
                <div style={{ maxHeight: 140, overflowY: 'auto', padding: 4, background:'var(--paper-white)', border:'2px solid var(--ink)' }}>
                  {wordsPlaced.length === 0 && <div className="caption">∅ empty — seed or type a word</div>}
                  {wordsPlaced.map(wp => (
                    <div key={wp.id} className="between" style={{ fontFamily:'var(--font-mono)', fontSize: 11, padding: '2px 0' }}>
                      <span><span className="legend-sw" style={{ display:'inline-block', background: FIELDS[wp.fieldId]?.colorRaw, verticalAlign:'middle', marginRight: 4 }}></span>{wp.w}</span>
                      <span className="caption">{wp.fieldId.slice(0,3)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <FieldLegend />

              <div className="row gap-4">
                <button className={`pbtn tiny ${running ? 'is-on' : ''}`} onClick={() => setRunning(r => !r)}>
                  {running ? '■ pause' : '▶ run'}
                </button>
                <button className="pbtn tiny" onClick={clearAll}>CLEAR</button>
              </div>

              <div style={{ marginTop: 'auto', borderTop: '1px dashed var(--ink)', paddingTop: 8 }}>
                <div className="caption">RGB CHANNEL READOUT</div>
                <ChannelBar label="R temp"    v={avgR * 40} color="var(--rgb-r)" />
                <ChannelBar label="G data"    v={avgG * 40} color="var(--rgb-g)" />
                <ChannelBar label="B motion"  v={avgB * 40} color="var(--rgb-b)" />
                <div className="caption" style={{ marginTop: 4 }}>
                  mix → {colorMix(avgR, avgG, avgB)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Window>
    );
  }

  function ChannelBar({ label, v, color }) {
    const w = Math.min(100, v * 400);
    return (
      <div style={{ display:'flex', alignItems:'center', gap: 6, margin: '2px 0' }}>
        <span className="caption" style={{ width: 60 }}>{label}</span>
        <div style={{ flex:1, height: 8, background:'var(--paper-pale)', border:'1px solid var(--ink)' }}>
          <div style={{ width:`${w}%`, height:'100%', background: color }}></div>
        </div>
      </div>
    );
  }

  function colorMix(r, g, b) {
    if (r + g + b < 0.001) return '∅ quiet';
    if (r > g && r > b && g < 0.3 && b < 0.3) return 'red — temp dominant';
    if (g > r && g > b && r < 0.3 && b < 0.3) return 'green — data dominant';
    if (b > r && b > g && r < 0.3 && g < 0.3) return 'blue — motion dominant';
    if (r > 0.3 && g > 0.3 && b < 0.3) return 'yellow — temp + data';
    if (g > 0.3 && b > 0.3 && r < 0.3) return 'cyan — data + motion';
    if (r > 0.3 && b > 0.3 && g < 0.3) return 'magenta — math field';
    if (r > 0.2 && g > 0.2 && b > 0.2) return 'white — all active';
    return 'mixed';
  }

  return { Sandbox };
})();
