/* ==============================================================
   IT APPLICATIONS — data grounded in a semantic space.
   Agnostic examples: code tokens, log classification, query routing,
   embedding search, config drift — each as a small visual.
   ============================================================== */

window.ITApps = (function () {
  'use strict';
  const { TeX, clamp } = window.SF;
  const { Window } = window.UI;

  // A compact "analogy" card system — each example maps an IT concept
  // onto the semantic-field formalism.
  const ANALOGIES = [
    {
      id: 'embed',
      title: 'Embedding search',
      subtitle: 'vector-space retrieval',
      map: { word: 'query vector q', field: 'corpus embedding space', diffusion: 'kNN recall radius', advection: 'relevance feedback' },
      tex: 'R(q) = \\{\\, d \\in D : \\lVert \\vec{e}(d) - q \\rVert < \\epsilon \\,\\}',
    },
    {
      id: 'logs',
      title: 'Log classification',
      subtitle: 'streaming event triage',
      map: { word: 'log line ℓ', field: 'event taxonomy', diffusion: 'label smoothing across similar lines', advection: 'topic drift over time' },
      tex: '\\chi_{S} = \\lambda \\ell.\\; g(\\vec{f}(\\ell))',
    },
    {
      id: 'routing',
      title: 'Query routing',
      subtitle: 'intent → service',
      map: { word: 'user intent', field: 'service catalog', diffusion: 'fallback cascade', advection: 'session context shift' },
      tex: 'route(q, c) = \\arg\\max_{s \\in S}\\; I(s)(c)',
    },
    {
      id: 'schema',
      title: 'Schema reconciliation',
      subtitle: 'tables ≈ type families',
      map: { word: 'column', field: 'logical schema', diffusion: 'type inference across joined tables', advection: 'migration pressure' },
      tex: 'T \\approx \\bigcup_i T_i,\\quad T_i \\cap T_j \\ne \\varnothing',
    },
    {
      id: 'config',
      title: 'Config drift',
      subtitle: 'infra state over time',
      map: { word: 'config key', field: 'state manifold', diffusion: 'propagation across cluster', advection: 'deploy wave' },
      tex: '\\partial_t\\phi = D\\nabla^2\\phi - \\vec{u}\\cdot\\nabla\\phi',
    },
    {
      id: 'auth',
      title: 'Permissions lattice',
      subtitle: 'role boundaries',
      map: { word: 'grant', field: 'capability space', diffusion: 'role inheritance', advection: 'policy revision' },
      tex: 'R \\preceq R\'\\; \\Leftrightarrow\\; cap(R) \\subseteq cap(R\')',
    },
  ];

  function ITGrid() {
    const [active, setActive] = React.useState('embed');
    const a = ANALOGIES.find(x => x.id === active);
    return (
      <Window title="◇ IT ANALOGIES — data grounded in semantic space" meta="pick a domain" variant="cream"
        statusLeft="λ-formalism is data-agnostic; examples below are illustrative, not exhaustive."
        statusRight={`mapping ${ANALOGIES.findIndex(x=>x.id===active)+1} / ${ANALOGIES.length}`}>
        <div className="window-body pad-0">
          <div className="row" style={{ gap: 0, borderBottom: '2px solid var(--ink)' }}>
            {ANALOGIES.map(it => (
              <button key={it.id}
                className={`tab ${active === it.id ? 'active' : ''}`}
                style={{ flex: 1, borderRight: '1px solid var(--ink)', margin: 0, top: 0, borderBottom: active===it.id ? 'none' : '2px solid var(--ink)', background: active===it.id ? 'var(--paper-pale)' : 'var(--paper-deep)' }}
                onClick={() => setActive(it.id)}>
                {it.title}
              </button>
            ))}
          </div>
          <div style={{ padding: 16 }}>
            <div className="row gap-16" style={{ flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="caption">{a.subtitle}</div>
                <h2 style={{ fontSize: 28, marginTop: 4 }}>{a.title}</h2>
                <div style={{ marginTop: 14 }}>
                  <TeX block>{a.tex}</TeX>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <MappingTable m={a.map} />
              </div>
            </div>

            {/* Tiny visual per mapping */}
            <div style={{ marginTop: 18, borderTop: '2px dashed var(--ink)', paddingTop: 14 }}>
              {active === 'embed' && <EmbedVis />}
              {active === 'logs' && <LogsVis />}
              {active === 'routing' && <RoutingVis />}
              {active === 'schema' && <SchemaVis />}
              {active === 'config' && <ConfigVis />}
              {active === 'auth' && <AuthVis />}
            </div>
          </div>
        </div>
      </Window>
    );
  }

  function MappingTable({ m }) {
    const rows = [
      ['word',      m.word,      'λw.'],
      ['field',     m.field,     'S ⊆ W'],
      ['diffusion', m.diffusion, 'D∇²φ'],
      ['advection', m.advection, 'u·∇φ'],
    ];
    return (
      <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-mono)', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{...thS}}>linguistic</th>
            <th style={{...thS}}>IT mapping</th>
            <th style={{...thS, textAlign:'right'}}>formal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k,v,f]) => (
            <tr key={k}>
              <td style={tdS}><span className="chip">{k}</span></td>
              <td style={{...tdS, fontFamily:'var(--font-serif)', fontSize: 13}}>{v}</td>
              <td style={{...tdS, textAlign:'right', color:'var(--ink-mid)'}}>{f}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  const thS = { textAlign:'left', padding:'5px 6px', borderBottom:'2px solid var(--ink)', fontSize: 10, textTransform:'uppercase', letterSpacing: 1 };
  const tdS = { padding:'6px', borderBottom:'1px dashed var(--ink)', verticalAlign:'middle' };

  // ---- tiny visuals per analogy ----

  function EmbedVis() {
    const pts = Array.from({ length: 80 }, (_, i) => {
      const a = (i * 2.39);
      const r = 0.15 + (i % 7) * 0.05;
      return { x: 0.5 + Math.cos(a) * r, y: 0.5 + Math.sin(a) * r * 1.4, hit: r < 0.22 };
    });
    return (
      <div className="grid-2">
        <div className="canvas-frame px-grid" style={{ aspectRatio: 1.6, background: 'var(--paper-pale)' }}>
          <svg viewBox="0 0 100 62" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
            <circle cx="50" cy="31" r="14" fill="none" stroke="var(--rgb-r)" strokeWidth="0.5" strokeDasharray="1 1"/>
            <circle cx="50" cy="31" r="2.5" fill="var(--ink)"/>
            <text x="53" y="30" style={{ fontFamily:'var(--font-mono)', fontSize: 3 }}>q</text>
            {pts.map((p, i) => (
              <circle key={i} cx={p.x * 100} cy={p.y * 62} r={p.hit ? 1.6 : 1}
                fill={p.hit ? 'var(--rgb-g)' : 'var(--paper-deep)'} stroke="var(--ink)" strokeWidth="0.2"/>
            ))}
          </svg>
        </div>
        <div className="caption" style={{ alignSelf:'center' }}>
          A query is a point; retrieval is a ball of radius ε. Diffusion here ≡ graceful degradation when no exact match exists — the "meaning" of the query is still recoverable from nearby points.
        </div>
      </div>
    );
  }

  function LogsVis() {
    const rows = [
      { t: '09:41:02', lvl: 'INFO',  msg: 'cache miss: key=session/88af', field: 'cache'  },
      { t: '09:41:03', lvl: 'WARN',  msg: 'retry 1/3 after timeout=800ms', field: 'retry' },
      { t: '09:41:03', lvl: 'INFO',  msg: 'cache miss: key=session/88af', field: 'cache' },
      { t: '09:41:04', lvl: 'ERROR', msg: 'upstream 502 svc=payments',     field: 'fault' },
      { t: '09:41:04', lvl: 'WARN',  msg: 'retry 2/3 after timeout=1600ms',field: 'retry' },
      { t: '09:41:05', lvl: 'ERROR', msg: 'circuit open for svc=payments', field: 'fault' },
    ];
    const fieldColor = { cache:'var(--rgb-g)', retry:'var(--mix-y)', fault:'var(--rgb-r)' };
    return (
      <div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize: 12, background:'var(--paper-white)', border:'2px solid var(--ink)', padding: 8 }}>
          {rows.map((r, i) => (
            <div key={i} className="between" style={{ padding: '1px 0', gap: 8 }}>
              <span style={{ color:'var(--ink-mid)' }}>{r.t}</span>
              <span style={{ width: 48, fontWeight: 600 }}>{r.lvl}</span>
              <span style={{ flex: 1 }}>{r.msg}</span>
              <span className="chip" style={{ background: fieldColor[r.field] }}>{r.field}</span>
            </div>
          ))}
        </div>
        <div className="caption" style={{ marginTop: 8 }}>
          Auto-tagging assigns each log line to a semantic field. Neighbouring lines diffuse their labels — bursts of <strong>fault</strong> pull surrounding <strong>retry</strong> tags into an "outage" region.
        </div>
      </div>
    );
  }

  function RoutingVis() {
    const services = [
      { w: 'auth',    x: 0.15, y: 0.3 },
      { w: 'billing', x: 0.35, y: 0.7 },
      { w: 'search',  x: 0.55, y: 0.25 },
      { w: 'ml-rec',  x: 0.75, y: 0.55 },
      { w: 'support', x: 0.88, y: 0.25 },
    ];
    const [intent, setIntent] = React.useState('reset password');
    const intentMap = {
      'reset password': { x: 0.15, y: 0.3 },
      'pay invoice':    { x: 0.35, y: 0.7 },
      'find product':   { x: 0.55, y: 0.25 },
      'recommend':      { x: 0.75, y: 0.55 },
      'talk to human':  { x: 0.88, y: 0.25 },
    };
    const p = intentMap[intent];
    const routed = services.map(s => ({ ...s, d: Math.hypot(s.x-p.x, s.y-p.y) })).sort((a,b)=>a.d-b.d)[0];
    return (
      <div className="grid-2">
        <div>
          <div className="caption">intent</div>
          <div className="row gap-4" style={{ flexWrap:'wrap', marginTop: 4 }}>
            {Object.keys(intentMap).map(k => (
              <button key={k} className={`pbtn tiny ${intent===k?'is-on':''}`} onClick={()=>setIntent(k)}>{k}</button>
            ))}
          </div>
          <div className="caption" style={{ marginTop: 14 }}>→ routed to</div>
          <div className="chip solid" style={{ marginTop: 4, fontSize: 14, padding: '4px 10px' }}>{routed.w}</div>
        </div>
        <div className="canvas-frame px-grid" style={{ aspectRatio: 1.6, background: 'var(--paper-pale)' }}>
          <svg viewBox="0 0 100 62" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
            {services.map(s => (
              <g key={s.w}>
                <rect x={s.x*100-5} y={s.y*62-3} width="10" height="6" fill={s.w===routed.w? 'var(--rgb-g)':'var(--paper-white)'} stroke="var(--ink)" strokeWidth="0.3"/>
                <text x={s.x*100} y={s.y*62+1.2} textAnchor="middle" style={{fontFamily:'var(--font-mono)', fontSize:2.6}}>{s.w}</text>
              </g>
            ))}
            <line x1={p.x*100} y1={p.y*62} x2={routed.x*100} y2={routed.y*62} stroke="var(--ink)" strokeWidth="0.4" strokeDasharray="1 1"/>
            <circle cx={p.x*100} cy={p.y*62} r="1.5" fill="var(--rgb-r)"/>
          </svg>
        </div>
      </div>
    );
  }

  function SchemaVis() {
    const cols = [
      { n: 'user_id',    t: 'uuid',    S: ['users','orders','events'] },
      { n: 'email',      t: 'text',    S: ['users'] },
      { n: 'price',      t: 'decimal', S: ['products','orders'] },
      { n: 'created_at', t: 'time',    S: ['orders','events','logs','users'] },
      { n: 'status',     t: 'enum',    S: ['orders','jobs'] },
    ];
    return (
      <div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize: 12 }}>
          {cols.map(c => (
            <div key={c.n} className="row gap-8" style={{ padding: '3px 0', alignItems:'center', borderBottom:'1px dashed var(--ink)' }}>
              <span style={{ width: 110 }}><strong>{c.n}</strong></span>
              <span className="chip">{c.t}</span>
              <span className="caption" style={{ marginLeft: 'auto' }}>∈</span>
              <span className="row gap-4">
                {c.S.map(s => <span key={s} className="chip">{s}</span>)}
              </span>
            </div>
          ))}
        </div>
        <div className="caption" style={{ marginTop: 8 }}>
          Each column participates in multiple table-fields. <strong>L ≈ ⋃ᵢ Sᵢ</strong> — columns are the intersection points where fields overlap.
        </div>
      </div>
    );
  }

  function ConfigVis() {
    const nodes = 12;
    const [t, setT] = React.useState(0);
    React.useEffect(() => {
      const id = setInterval(() => setT(x => (x + 1) % 180), 80);
      return () => clearInterval(id);
    }, []);
    return (
      <div className="grid-2">
        <div className="canvas-frame" style={{ aspectRatio: 1.6, background:'var(--paper-white)' }}>
          <svg viewBox="0 0 100 62" style={{ width:'100%', height:'100%' }}>
            {Array.from({ length: nodes }).map((_, i) => {
              const cx = 8 + (i % 4) * 28;
              const cy = 10 + Math.floor(i/4) * 18;
              const front = t > i * 10 && t < i * 10 + 50;
              const after = t >= i * 10 + 50;
              return (
                <g key={i}>
                  <rect x={cx-5} y={cy-4} width="10" height="8"
                        fill={after ? 'var(--rgb-g)' : front ? 'var(--mix-y)' : 'var(--paper-deep)'}
                        stroke="var(--ink)" strokeWidth="0.3"/>
                  <text x={cx} y={cy+1} textAnchor="middle" style={{fontFamily:'var(--font-mono)', fontSize: 2.5}}>n{i}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="caption" style={{ alignSelf:'center' }}>
          A config change advects across the cluster over time. The "topic" of the deploy propagates — diffusion from each seed node, advection carrying the wave forward. Nodes turn green as the new state settles.
        </div>
      </div>
    );
  }

  function AuthVis() {
    const roles = [
      { r: 'viewer',  y: 0.85, caps: ['read'] },
      { r: 'editor',  y: 0.55, caps: ['read','write'] },
      { r: 'admin',   y: 0.25, caps: ['read','write','grant','delete'] },
      { r: 'owner',   y: 0.05, caps: ['read','write','grant','delete','transfer'] },
    ];
    return (
      <div className="grid-2">
        <div className="canvas-frame" style={{ aspectRatio: 1.6, background:'var(--paper-pale)', padding: 8 }}>
          <svg viewBox="0 0 100 62" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
            {roles.map((rl, i) => (
              <g key={rl.r}>
                <rect x="8" y={rl.y*62 - 3} width="40" height="6" fill="var(--paper-white)" stroke="var(--ink)" strokeWidth="0.3"/>
                <text x="10" y={rl.y*62+1} style={{fontFamily:'var(--font-mono)', fontSize: 3}}>{rl.r}</text>
                {i < roles.length - 1 && <line x1="28" y1={rl.y*62+3} x2="28" y2={roles[i+1].y*62-3} stroke="var(--ink)" strokeWidth="0.4"/>}
                <g transform={`translate(52, ${rl.y*62 - 3})`}>
                  {rl.caps.map((c,j) => (
                    <g key={c}>
                      <rect x={j*10} y="0" width="9" height="6" fill="var(--rgb-g)" stroke="var(--ink)" strokeWidth="0.2"/>
                      <text x={j*10+1} y={4.5} style={{fontFamily:'var(--font-mono)', fontSize: 2.2}}>{c}</text>
                    </g>
                  ))}
                </g>
              </g>
            ))}
          </svg>
        </div>
        <div className="caption" style={{ alignSelf:'center' }}>
          Roles form a lattice — a lower role's capability set is a subset of the higher. The semantic field here is a <em>directed</em> structure: diffusion is monotone (capabilities flow upward, never down).
        </div>
      </div>
    );
  }

  return { ITGrid, ANALOGIES };
})();
