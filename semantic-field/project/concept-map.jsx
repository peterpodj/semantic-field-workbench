/* ==============================================================
   CONCEPT MAP — rendered from the excalidraw diagram
   Retro-OS-styled node graph showing how the concepts connect.
   ============================================================== */

window.ConceptMap = (function () {
  'use strict';
  const { Window } = window.UI;

  // Nodes translated from the excalidraw source. Positions normalized to 0..1
  // over a 1200x820 canvas. Colors remapped to our palette.
  const W = 1200, H = 820;

  const NODES = [
    { id:'ling',   x:80,  y:140, w:280, h:130, tone:'sky',     title:'Linguistic Foundation',
      bullets:['Shared conceptual domains','Vocabulary organization','Context-dependent meaning'] },
    { id:'lambda', x:460, y:140, w:280, h:130, tone:'violet',  title:'Lambda Calculus Lens',
      bullets:['Words as functions λc. meaning(w,c)','Characteristic functions χ_S','Context parameters'] },
    { id:'fluid',  x:840, y:140, w:280, h:130, tone:'peach',   title:'Fluid Dynamics Metaphor',
      bullets:['Semantic activation flow φ(x,t)','Diffusion of related meanings','Advection by discourse shifts'] },
    { id:'feat',   x:220, y:380, w:300, h:110, tone:'mint',    title:'Feature Space & Classifiers',
      bullets:['Shared feature vectors f⃗(w)','Field as subset S ⊆ W','g(f⃗(w)) classifier'] },
    { id:'act',    x:680, y:380, w:300, h:110, tone:'butter',  title:'Semantic Activation Flow',
      bullets:['∂_t φ = D ∇²φ (diffusion)','u⃗ · ∇φ (advection)','Context-driven shifts'] },
    { id:'ex',     x:450, y:620, w:300, h:110, tone:'sage',    title:'Example: Math Terminology',
      bullets:['add, subtract, multiply, divide','integrate, differentiate',"λ(x,y).x+y   and   λf.f'"] },
  ];

  const EDGES = [
    { from:'ling',   to:'feat', label:null },
    { from:'lambda', to:'feat', label:'formal structure' },
    { from:'lambda', to:'act',  label:null },
    { from:'fluid',  to:'act',  label:'dynamic process' },
    { from:'feat',   to:'ex',   label:'synthesis' },
    { from:'act',    to:'ex',   label:null },
  ];

  const TONES = {
    sky:    { bg:'#BFD8E8', hatchColor:'var(--rgb-b)' },
    violet: { bg:'#D4C4E8', hatchColor:'var(--acc-violet)' },
    peach:  { bg:'#FFD9B0', hatchColor:'var(--acc-peach)' },
    mint:   { bg:'#C7EBDD', hatchColor:'var(--rgb-g)' },
    butter: { bg:'#FFEFA8', hatchColor:'var(--mix-y)' },
    sage:   { bg:'#C4DFB7', hatchColor:'var(--field-data)' },
  };

  function getAnchor(node, side) {
    // side: 'top' | 'bottom' | 'left' | 'right'
    const cx = node.x + node.w / 2, cy = node.y + node.h / 2;
    if (side === 'top')    return { x: cx, y: node.y };
    if (side === 'bottom') return { x: cx, y: node.y + node.h };
    if (side === 'left')   return { x: node.x, y: cy };
    if (side === 'right')  return { x: node.x + node.w, y: cy };
    return { x: cx, y: cy };
  }

  function ConceptMap() {
    const byId = Object.fromEntries(NODES.map(n => [n.id, n]));
    const [hot, setHot] = React.useState(null);
    return (
      <Window title="◈ CONCEPT MAP — semantic_fields.excalidraw" meta="6 nodes · 6 edges · 3 layers" variant="yellow"
        statusLeft="rendered from source diagram — click a node to highlight its edges"
        statusRight={hot ? `◉ ${byId[hot].title}` : 'idle'}>
        <div className="window-body pad-0" style={{ background: 'var(--paper-white)' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', display:'block' }}>
            <defs>
              <marker id="cm-arrow" viewBox="0 0 10 10" refX="8" refY="5"
                      markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)"/>
              </marker>
              <pattern id="cm-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="var(--ink)" opacity="0.15"/>
              </pattern>
            </defs>

            {/* DOT BG */}
            <rect x="0" y="0" width={W} height={H} fill="url(#cm-dots)"/>

            {/* TITLE */}
            <g>
              <rect x="260" y="22" width="680" height="48" fill="var(--ink)"/>
              <text x="600" y="55" textAnchor="middle"
                    style={{ fontFamily:'var(--font-display)', fontSize: 32, fill: 'var(--paper-pale)', letterSpacing: 2 }}>
                SEMANTIC FIELDS — FORMAL &amp; PHYSICAL METAPHORS
              </text>
            </g>

            {/* EDGES (behind boxes) */}
            {EDGES.map((e, i) => {
              const f = byId[e.from], t = byId[e.to];
              const a = getAnchor(f, 'bottom');
              const b = getAnchor(t, 'top');
              const active = hot && (hot === e.from || hot === e.to);
              // slight curve via midpoint offset
              const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
              const d = `M ${a.x} ${a.y} Q ${mx} ${my - 8} ${b.x} ${b.y}`;
              return (
                <g key={i} opacity={hot && !active ? 0.25 : 1}>
                  <path d={d} fill="none"
                        stroke={active ? 'var(--rgb-r)' : 'var(--ink)'}
                        strokeWidth={active ? 3 : 2}
                        strokeDasharray={active ? '0' : '6 4'}
                        markerEnd="url(#cm-arrow)"/>
                  {e.label && (
                    <g transform={`translate(${mx}, ${my - 18})`}>
                      <rect x="-56" y="-10" width="112" height="20" fill="var(--paper-deep)" stroke="var(--ink)" strokeWidth="1.5"/>
                      <text x="0" y="4" textAnchor="middle"
                            style={{ fontFamily:'var(--font-mono)', fontSize: 12, fill:'var(--ink)', letterSpacing: 1, textTransform:'uppercase' }}>
                        {e.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* NODES */}
            {NODES.map(n => {
              const tone = TONES[n.tone];
              const active = hot === n.id;
              return (
                <g key={n.id}
                   onMouseEnter={() => setHot(n.id)}
                   onMouseLeave={() => setHot(null)}
                   style={{ cursor: 'pointer' }}>
                  {/* shadow */}
                  <rect x={n.x + 6} y={n.y + 6} width={n.w} height={n.h} fill="var(--ink)"/>
                  {/* titlebar */}
                  <rect x={n.x} y={n.y} width={n.w} height={26} fill={tone.bg} stroke="var(--ink)" strokeWidth="2"/>
                  {/* body */}
                  <rect x={n.x} y={n.y + 26} width={n.w} height={n.h - 26} fill="var(--paper-white)" stroke="var(--ink)" strokeWidth="2"/>
                  {/* hatched accent strip */}
                  <rect x={n.x + n.w - 10} y={n.y + 26} width="10" height={n.h - 26} fill={tone.bg}/>
                  {/* traffic dots */}
                  <circle cx={n.x + 10} cy={n.y + 13} r="4" fill="var(--rgb-r)" stroke="var(--ink)" strokeWidth="1.5"/>
                  <circle cx={n.x + 22} cy={n.y + 13} r="4" fill="var(--mix-y)" stroke="var(--ink)" strokeWidth="1.5"/>
                  <circle cx={n.x + 34} cy={n.y + 13} r="4" fill="var(--rgb-g)" stroke="var(--ink)" strokeWidth="1.5"/>
                  {/* title — left-anchored past the traffic dots so it never clips */}
                  <text x={n.x + 48} y={n.y + 18} textAnchor="start"
                        style={{ fontFamily:'var(--font-display)', fontSize: 16, fill:'var(--ink)', letterSpacing: 0.5 }}>
                    {n.title}
                  </text>
                  {/* bullets */}
                  {n.bullets.map((b, i) => (
                    <text key={i} x={n.x + 14} y={n.y + 46 + i * 18}
                          style={{ fontFamily:'var(--font-mono)', fontSize: 12, fill:'var(--ink)' }}>
                      › {b}
                    </text>
                  ))}
                  {active && (
                    <rect x={n.x - 3} y={n.y - 3} width={n.w + 6} height={n.h + 6}
                          fill="none" stroke="var(--rgb-r)" strokeWidth="2" strokeDasharray="4 3"/>
                  )}
                </g>
              );
            })}

            {/* layer labels on the left */}
            <g style={{ fontFamily:'var(--font-mono)', fontSize: 11, fill:'var(--ink-mid)', letterSpacing: 2 }}>
              <text x="24" y="210" textAnchor="start" transform="rotate(-90, 24, 210)">PREMISES</text>
              <text x="24" y="450" textAnchor="start" transform="rotate(-90, 24, 450)">STRUCTURE / DYNAMICS</text>
              <text x="24" y="690" textAnchor="start" transform="rotate(-90, 24, 690)">APPLICATION</text>
            </g>
          </svg>
        </div>
      </Window>
    );
  }

  return { ConceptMap };
})();
