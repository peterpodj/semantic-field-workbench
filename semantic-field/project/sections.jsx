/* ==============================================================
   SUPPORTING SECTIONS — lambda, feature space, flow, IT apps.
   ============================================================== */

window.Sections = (function () {
  'use strict';
  const { FIELDS, TeX, clamp } = window.SF;
  const { Window, Slider, Segmented, Labeled, FormulaCard } = window.UI;

  // =================================================================
  // LAMBDA PROBE — click words to evaluate λc. meaning(w, c)
  // =================================================================
  function LambdaProbe() {
    const fields = Object.values(FIELDS);
    const [fieldId, setFieldId] = React.useState('temperature');
    const [ctx, setCtx] = React.useState({ intensity: 0.5, affect: 0.5 });
    const field = FIELDS[fieldId];
    const axisA = field.axes[0], axisB = field.axes[1];

    React.useEffect(() => { setCtx({ [axisA]: 0.5, [axisB]: 0.5 }); // eslint-disable-next-line
    }, [fieldId]);

    // Ranked truth values for each word in this field given context
    const ranked = field.words.map(w => {
      const d = Math.hypot(w.x - (ctx[axisA] ?? 0.5), w.y - (ctx[axisB] ?? 0.5));
      const v = Math.exp(-d * d * 18);
      return { ...w, v };
    }).sort((a, b) => b.v - a.v);

    const best = ranked[0];

    return (
      <Window title="λ LAMBDA PROBE" meta="eval λc. meaning(w, c)" variant="cream"
        statusLeft={<>binding ctx → ({ctx[axisA]?.toFixed(2)}, {ctx[axisB]?.toFixed(2)})</>}
        statusRight={<>β-reduce · {best?.w ?? '∅'}</>}
      >
        <div className="window-body">
          <div className="row gap-8" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
            {fields.map(f => (
              <button key={f.id} className={`pbtn tiny ${fieldId === f.id ? 'is-on' : ''}`} onClick={() => setFieldId(f.id)}>
                {f.title}
              </button>
            ))}
          </div>

          <div className="grid-2" style={{ gap: 20 }}>
            {/* LEFT: equation + interactive context */}
            <div className="stack">
              <TeX block>{`I(w) = \\lambda c.\\; h(c,\\; \\vec{f}(w))`}</TeX>
              <div className="caption">Drag the context point — the field re-ranks.</div>
              <ContextPad field={field} ctx={ctx} setCtx={setCtx} ranked={ranked} />
              <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                <Slider label={`ctx.${axisA}`} value={ctx[axisA] ?? 0.5} onChange={v => setCtx(c => ({ ...c, [axisA]: v }))} />
                <Slider label={`ctx.${axisB}`} value={ctx[axisB] ?? 0.5} onChange={v => setCtx(c => ({ ...c, [axisB]: v }))} />
              </div>
            </div>

            {/* RIGHT: evaluation output */}
            <div className="stack">
              <div className="caption">χ_S(w) · characteristic activation</div>
              <div className="window window-tight" style={{ background: 'var(--paper-white)' }}>
                <div className="titlebar" style={{ background: 'var(--ink)', color: 'var(--paper-pale)' }}>
                  <span className="title" style={{ fontSize: 14 }}>β-reduction</span>
                  <span className="meta" style={{ color: 'var(--paper-pale)' }}>{field.title}</span>
                </div>
                <div className="window-body" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  <div>{'> '}<span style={{color:'var(--ink-mid)'}}>eval</span>(<span style={{color:'var(--rgb-r)'}}>λc</span>. h(c, f(w)))</div>
                  <div>{'  '}ctx = {'{'} {axisA}:{ (ctx[axisA]??0).toFixed(2)}, {axisB}:{(ctx[axisB]??0).toFixed(2)} {'}'}</div>
                  <div style={{ marginTop: 6, color:'var(--ink-mid)'}}>// top-k activated words:</div>
                  {ranked.slice(0, 6).map((r, i) => (
                    <div key={r.w} className="between" style={{ padding: '1px 0' }}>
                      <span>{i === 0 ? '▶' : ' '} <strong>{r.w}</strong></span>
                      <span>
                        <span className="tab-num">{r.v.toFixed(3)}</span>
                        <span style={{
                          display:'inline-block', width: 60, height:6, marginLeft: 6,
                          background:'var(--paper-deep)', border: '1px solid var(--ink)', position:'relative'
                        }}>
                          <span style={{
                            position:'absolute', inset: 0,
                            width: `${r.v * 100}%`, background: field.colorRaw
                          }}></span>
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <TeX block>{`\\chi_S = \\lambda w.\\; g(\\vec{f}(w))`}</TeX>
              <div className="caption">
                The context resolver picks a word whose feature-space position best matches the current discourse state.
              </div>
            </div>
          </div>
        </div>
      </Window>
    );
  }

  function ContextPad({ field, ctx, setCtx, ranked }) {
    const ref = React.useRef(null);
    const axisA = field.axes[0], axisB = field.axes[1];

    function setFromEv(e) {
      const rect = ref.current.getBoundingClientRect();
      const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
      setCtx({ [axisA]: x, [axisB]: y });
    }

    return (
      <div ref={ref} onMouseDown={(e)=>{setFromEv(e); const m=ev=>setFromEv(ev); const u=()=>{window.removeEventListener('mousemove',m);window.removeEventListener('mouseup',u);}; window.addEventListener('mousemove',m); window.addEventListener('mouseup',u);}}
           className="canvas-frame px-grid" style={{ aspectRatio: '1.6', cursor: 'crosshair' }}>
        {/* FIELD REGION (hatched) */}
        <div style={{ position:'absolute', inset:0, color: field.colorRaw, opacity: 0.5 }} className="hatch"></div>
        {/* WORDS */}
        {field.words.map(w => {
          const r = ranked.find(x => x.w === w.w);
          const v = r ? r.v : 0;
          return (
            <div key={w.w} style={{
              position:'absolute', left: `${w.x*100}%`, top: `${w.y*100}%`,
              transform: 'translate(-50%, -50%)',
              fontFamily:'var(--font-mono)', fontSize: 11,
              fontWeight: v > 0.6 ? 700 : 400,
              background: v > 0.3 ? 'var(--ink)' : 'var(--paper-white)',
              color: v > 0.3 ? 'var(--paper-pale)' : 'var(--ink)',
              border: '1.5px solid var(--ink)',
              padding: '1px 4px',
              opacity: 0.4 + v * 0.6,
              pointerEvents:'none',
              letterSpacing: 0.3,
            }}>{w.w}</div>
          );
        })}
        {/* CONTEXT POINT */}
        <div style={{
          position:'absolute',
          left: `${(ctx[axisA]??0.5)*100}%`, top: `${(ctx[axisB]??0.5)*100}%`,
          transform:'translate(-50%, -50%)',
          pointerEvents:'none',
        }}>
          <div style={{ width: 16, height: 16, border: '2px solid var(--ink)', background: 'var(--paper)' }}></div>
          <div style={{
            position:'absolute', left:'50%', top: '50%',
            width: 8, height: 8, background: 'var(--ink)', transform:'translate(-50%,-50%)'
          }}></div>
          <div style={{ position:'absolute', bottom:-18, left:'50%', transform:'translateX(-50%)',
            fontFamily:'var(--font-mono)', fontSize: 9, letterSpacing: 1, background:'var(--ink)',
            color:'var(--paper-pale)', padding:'1px 4px', whiteSpace:'nowrap' }}>ctx</div>
        </div>
        {/* Axis labels */}
        <div style={{ position:'absolute', bottom:2, left:2, right:2, display:'flex', justifyContent:'space-between' }} className="caption">
          <span>← {field.axes[0]} →</span>
          <span>y: {field.axes[1]}</span>
        </div>
      </div>
    );
  }

  // =================================================================
  // FEATURE SPACE — shared attribute vectors
  // =================================================================
  function FeatureSpace() {
    const features = ['+object', '+motion', '+temp', '+discrete', '+stream', '+composite'];
    const wordSet = [
      { w: 'ice',      f: [1, 0, -1, 1, 0, 0] },
      { w: 'steam',    f: [0, 1, 1, 0, 1, 0] },
      { w: 'river',    f: [0, 1, 0, 0, 1, 0] },
      { w: 'table',    f: [1, 0, 0, 1, 0, 1] },
      { w: 'log',      f: [0, 0, 0, 0, 1, 0] },
      { w: 'packet',   f: [1, 1, 0, 1, 0, 1] },
      { w: 'gradient', f: [0, 1, 0, 0, 0, 1] },
      { w: 'cache',    f: [1, 0, 0, 1, 0, 0] },
    ];
    const [hovered, setHovered] = React.useState(null);

    return (
      <Window title="▦ FEATURE SPACE" meta="f: word → ℝⁿ · shared attributes" variant="cream"
        statusLeft="n = 6 binary features · words as sparse vectors"
        statusRight={hovered ? `inspect: ${hovered}` : 'hover a row'}>
        <div className="window-body">
          <TeX block>{`\\vec{f}(w) \\in \\{-1, 0, 1\\}^n,\\quad S = \\{\\, w \\in W : g(\\vec{f}(w)) = 1 \\,\\}`}</TeX>
          <div style={{ marginTop: 14, overflowX: 'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-mono)', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={th}>word</th>
                  {features.map(fn => <th key={fn} style={th}>{fn}</th>)}
                  <th style={th}>|f|</th>
                </tr>
              </thead>
              <tbody>
                {wordSet.map(row => {
                  const norm = Math.sqrt(row.f.reduce((s,v)=>s+v*v, 0)).toFixed(2);
                  return (
                    <tr key={row.w} onMouseEnter={() => setHovered(row.w)} onMouseLeave={() => setHovered(null)}
                        style={{ background: hovered === row.w ? 'var(--mix-y)' : 'transparent', cursor:'default' }}>
                      <td style={td}><strong>{row.w}</strong></td>
                      {row.f.map((v,i) => (
                        <td key={i} style={{...td, textAlign:'center'}}>
                          <FeatureCell v={v} />
                        </td>
                      ))}
                      <td style={{...td, textAlign:'right'}}>{norm}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="caption" style={{ marginTop: 10 }}>
            ▲ filled = +1 · ▽ inverted = −1 · ∅ dot = 0 (feature not asserted).
            Two words with similar vectors occupy overlapping regions of the semantic lexicon.
          </div>
        </div>
      </Window>
    );
  }
  const th = { textAlign:'left', padding:'4px 8px', borderBottom:'2px solid var(--ink)', fontSize: 10, textTransform:'uppercase', letterSpacing: 1 };
  const td = { padding:'4px 8px', borderBottom:'1px dashed var(--ink)' };

  function FeatureCell({ v }) {
    if (v === 1) return <span style={{display:'inline-block', width:14, height:14, background:'var(--ink)', border:'1px solid var(--ink)'}}></span>;
    if (v === -1) return <span style={{display:'inline-block', width:14, height:14, background:'var(--rgb-r)', border:'1px solid var(--ink)'}}></span>;
    return <span style={{ color: 'var(--ink-mid)' }}>·</span>;
  }

  // =================================================================
  // FLOW FIELD — advection vector diagram
  // =================================================================
  function FlowField({ ux = 0.3, uy = 0.05, D = 0.05 }) {
    const GX = 22, GY = 14;
    const arrows = [];
    for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) {
      // a pseudo-flow: gentle swirl + user velocity
      const fx = ux + 0.15 * Math.sin((y / GY) * Math.PI * 2);
      const fy = uy + 0.15 * Math.cos((x / GX) * Math.PI * 2);
      const mag = Math.hypot(fx, fy);
      const a = Math.atan2(fy, fx);
      arrows.push({ x, y, a, mag });
    }
    return (
      <Window title="≈ FLOW FIELD" meta="u·∇φ  advection + ∇²φ diffusion" variant="cream"
        statusLeft={<>velocity u = ({ux.toFixed(2)}, {uy.toFixed(2)}) · D = {D.toFixed(2)}</>}
        statusRight="deliberate topic shift = advection"
      >
        <div className="window-body">
          <TeX block>{`\\partial_t \\phi \\;=\\; D\\, \\nabla^2 \\phi \\;-\\; \\vec{u}\\cdot\\nabla\\phi`}</TeX>
          <div className="canvas-frame" style={{ marginTop: 12, aspectRatio: `${GX}/${GY}`, background: 'var(--paper-pale)' }}>
            <svg viewBox={`0 0 ${GX} ${GY}`} preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
              <defs>
                <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)"/>
                </marker>
              </defs>
              {arrows.map(a => {
                const cx = a.x + 0.5, cy = a.y + 0.5;
                const L = 0.4 + a.mag * 0.5;
                const x2 = cx + Math.cos(a.a) * L;
                const y2 = cy + Math.sin(a.a) * L;
                return <line key={`${a.x},${a.y}`} x1={cx} y1={cy} x2={x2} y2={y2}
                             stroke="var(--ink)" strokeWidth={0.05 + a.mag * 0.08} markerEnd="url(#ah)"/>;
              })}
              {/* density blob being advected */}
              <circle cx={4} cy={7} r={1.5} fill="var(--rgb-r)" opacity="0.35"/>
              <circle cx={10} cy={7.5} r={1.2} fill="var(--rgb-r)" opacity="0.25"/>
              <circle cx={14} cy={8} r={0.9} fill="var(--rgb-r)" opacity="0.18"/>
              <circle cx={17} cy={8.3} r={0.6} fill="var(--rgb-r)" opacity="0.12"/>
            </svg>
          </div>
          <div className="caption" style={{ marginTop: 8 }}>
            φ(x,t) · activation density. Diffusion recruits neighbours; advection drifts the whole field along u.
          </div>
        </div>
      </Window>
    );
  }

  return { LambdaProbe, FeatureSpace, FlowField };
})();
