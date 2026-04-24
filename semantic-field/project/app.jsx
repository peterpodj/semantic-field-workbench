/* APP — top-level composition. */
(function () {
  'use strict';
  const { TeX } = window.SF;
  const { Slider } = window.UI;
  const { Sandbox } = window.Sandbox;
  const { LambdaProbe, FeatureSpace, FlowField } = window.Sections;
  const { ITGrid } = window.ITApps;
  const { ConceptMap } = window.ConceptMap;

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "diffusion": 0.12,
    "advX": 0.15,
    "advY": 0.0,
    "decay": 0.004,
    "showGrid": true
  }/*EDITMODE-END*/;

  function App() {
    const [t, setT] = window.useTweaks(TWEAK_DEFAULTS);

    return (
      <div className="desktop">
        <TopBar />
        <header style={{ padding: '40px 32px 16px', borderBottom: '2px solid var(--ink)' }}>
          <div className="row between" style={{ alignItems:'flex-end', flexWrap:'wrap', gap: 24 }}>
            <div>
              <div className="lbl">Semantic Field Workbench · v0.4.26</div>
              <h1 style={{ marginTop: 6 }}>SEMANTIC<br/>FIELDS<span className="blink" style={{ color:'var(--rgb-r)' }}></span></h1>
              <div className="prose" style={{ marginTop: 14, maxWidth: '52ch' }}>
                A hands-on workbench for reasoning about meaning as <em>structure + flow</em> —
                through the lenses of lambda calculus and fluid dynamics.
                The same formalism grounds any system where <strong>data is represented and linked
                in a mathematical space</strong>: embeddings, schemas, logs, routing tables, permission lattices.
              </div>
            </div>
            <div className="col" style={{ gap: 10, minWidth: 300 }}>
              <div className="window window-tight">
                <div className="titlebar" style={{ background:'var(--ink)', color:'var(--paper-pale)' }}>
                  <div className="dots-set">
                    <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
                  </div>
                  <span className="title" style={{ fontSize: 14 }}>CORE DEFINITION</span>
                </div>
                <div className="window-body" style={{ background:'var(--paper-white)' }}>
                  <TeX block>{`F \\;=\\; \\lambda A.\\; \\{\\, w : w \\text{ instantiates } A \\,\\}`}</TeX>
                  <div className="caption" style={{ marginTop: 8 }}>
                    a semantic field is a function from shared attributes to the words that realize them.
                  </div>
                </div>
              </div>
              <div className="legend" style={{ justifyContent:'center' }}>
                <div className="legend-item"><span className="legend-sw" style={{ background:'var(--rgb-r)' }}></span>R · temp</div>
                <div className="legend-item"><span className="legend-sw" style={{ background:'var(--rgb-g)' }}></span>G · data</div>
                <div className="legend-item"><span className="legend-sw" style={{ background:'var(--rgb-b)' }}></span>B · motion</div>
                <div className="legend-item"><span className="legend-sw" style={{ background:'var(--mix-y)' }}></span>R+G</div>
                <div className="legend-item"><span className="legend-sw" style={{ background:'var(--mix-c)' }}></span>G+B</div>
                <div className="legend-item"><span className="legend-sw" style={{ background:'var(--mix-m)' }}></span>R+B · math</div>
              </div>
            </div>
          </div>
        </header>

        <section className="section" id="s01">
          <span className="section-label">§ 01 · sandbox</span>
          <SectionHeader num="01" title="Sandbox" lede="Place a word. Watch activation diffuse. Push it with flow."/>
          <Sandbox D={t.diffusion} advX={t.advX} advY={t.advY} decay={t.decay} showGrid={t.showGrid}/>
          <div className="grid-3" style={{ marginTop: 18 }}>
            <ExplainCard n="A" label="Word → point">
              Each word lands in a 2D conceptual space at coordinates determined by its shared attributes with other words in the field. "Sprint" sits near "dash" because <em>speed</em> and <em>grace</em> are close.
            </ExplainCard>
            <ExplainCard n="B" label="Activation → density">
              Every placed word deposits ink of its field's color. This density φ(x,t) represents <em>which meanings are currently relevant</em> to the discourse.
            </ExplainCard>
            <ExplainCard n="C" label="Time → transport">
              Diffusion (D∇²φ) recruits neighbouring meanings. Advection (u·∇φ) drifts the conversation deliberately. RGB channels record which semantic families are active, and their mixes reveal hybrid regions.
            </ExplainCard>
          </div>
        </section>

        <section className="section" id="s02">
          <span className="section-label">§ 02 · lambda lens</span>
          <SectionHeader num="02" title="Lambda Calculus Lens" lede="Words as functions of context. β-reduce to pick the right one."/>
          <div className="grid-2">
            <div className="prose">
              <p>A word is not a label but a <strong>function</strong>. Reading <TeX>{'I(w) = \\lambda c.\\, h(c, p_w)'}</TeX>, a word's meaning is an anonymous function from a context <TeX>{'c'}</TeX> to a referent or truth value.</p>
              <p>Two words in the same field differ only in their parameter <TeX>{'p_w'}</TeX> — intensity, formality, scale. Retrieving the "right" word is <em>β-reduction</em> over the context, picking the one whose parameter best matches the current discourse state.</p>
              <p>The field itself is a <strong>characteristic function</strong> <TeX>{'\\chi_S = \\lambda w.\\, g(\\vec{f}(w))'}</TeX> — given a word, return 1 if it belongs to the field. Many fields overlap; <TeX>{' L \\approx \\bigcup_i S_i '}</TeX> is the whole vocabulary as a union of fields.</p>
            </div>
            <LambdaProbe />
          </div>
        </section>

        <section className="section" id="s03">
          <span className="section-label">§ 03 · feature space</span>
          <SectionHeader num="03" title="Feature Space" lede="Words as vectors of shared attributes. Classification as membership."/>
          <div className="grid-2">
            <FeatureSpace />
            <div className="prose">
              <p>If each word is a vector <TeX>{'\\vec{f}(w) \\in \\mathbb{R}^n'}</TeX> of shared features (<code>+temperature</code>, <code>+motion</code>, <code>+discrete</code>…), a semantic field becomes a <em>region</em> of vector space — the subset <TeX>{'S \\subseteq W'}</TeX> on which a classifier <TeX>{'g'}</TeX> returns 1.</p>
              <p>Words with similar vectors overlap: <em>stream</em> and <em>river</em> share <code>+motion, +continuous</code>. This is the same geometry that underwrites <strong>embedding search</strong>, <strong>topic modeling</strong>, and <strong>k-nearest-neighbour retrieval</strong> across any IT domain.</p>
            </div>
          </div>
        </section>

        <section className="section" id="s04">
          <span className="section-label">§ 04 · flow</span>
          <SectionHeader num="04" title="Fluid Dynamics Metaphor" lede="Meaning moves. The PDE of discourse."/>
          <div className="grid-2">
            <div className="prose">
              <p>In a fluid, density evolves by diffusion (<em>things spread</em>) and advection (<em>things are carried</em>). A conversation does the same: activation <TeX>{'\\phi(x,t)'}</TeX> diffuses to related concepts, and intent advects the whole field toward a new topic.</p>
              <TeX block>{'\\partial_t \\phi = D\\nabla^2\\phi - \\vec{u}\\cdot\\nabla\\phi'}</TeX>
              <p>Same equation as heat conduction with wind. Same equation that governs how a new term propagates through a codebase, how a deploy wave advects across a cluster, or how a topic migrates through a channel.</p>
              <div className="row gap-8" style={{ flexWrap:'wrap' }}>
                <Slider label="diffusion D" value={t.diffusion} min={0} max={0.5} step={0.01} onChange={v=>setT('diffusion', v)}/>
                <Slider label="velocity uₓ" value={t.advX} min={-0.5} max={0.5} step={0.01} onChange={v=>setT('advX', v)}/>
                <Slider label="velocity u_y" value={t.advY} min={-0.5} max={0.5} step={0.01} onChange={v=>setT('advY', v)}/>
              </div>
              <div className="caption" style={{ marginTop: 6 }}>These parameters control the sandbox above too.</div>
            </div>
            <FlowField ux={t.advX + 0.25} uy={t.advY} D={t.diffusion}/>
          </div>
        </section>

        <section className="section" id="s05">
          <span className="section-label">§ 05 · map</span>
          <SectionHeader num="05" title="Concept Map" lede="How the pieces fit together (rendered from the excalidraw source)."/>
          <ConceptMap />
        </section>

        <section className="section" id="s06">
          <span className="section-label">§ 06 · IT applications</span>
          <SectionHeader num="06" title="Data Grounded in Semantic Space" lede="The same math, six different IT domains."/>
          <div className="prose" style={{ marginBottom: 18, maxWidth:'72ch' }}>
            The λ-calculus + fluid-dynamics formalism is data-agnostic. Anywhere you represent entities as points in a mathematical space and their relationships as distances, gradients, or flows, the same operators apply. Below: six common IT patterns, each as a concrete instance of a semantic field.
          </div>
          <ITGrid />
        </section>

        <section className="section" id="s07">
          <span className="section-label">§ 07 · worked example</span>
          <SectionHeader num="07" title="A worked example — math operations as a field" lede="Fluid-dynamic operators as a sub-family."/>
          <div className="grid-2">
            <div className="prose">
              <p>Consider the field <strong>{'{ add, subtract, multiply, divide, integrate, differentiate }'}</strong>. Each maps cleanly to a lambda expression:</p>
              <div className="stack" style={{ marginTop: 12 }}>
                <TeX block>{`\\text{add}\\; :=\\; \\lambda (x,y).\\; x + y`}</TeX>
                <TeX block>{`\\text{differentiate}\\; :=\\; \\lambda f.\\; f'`}</TeX>
                <TeX block>{`\\text{gradient}\\; :=\\; \\lambda f.\\; \\nabla f`}</TeX>
                <TeX block>{`\\text{divergence}\\; :=\\; \\lambda \\vec{u}.\\; \\nabla \\cdot \\vec{u}`}</TeX>
              </div>
            </div>
            <div className="prose">
              <p>Observe that <code>gradient</code>, <code>divergence</code>, <code>curl</code>, <code>Laplacian</code> sit together as a sub-field of <em>differential operators</em> — a semantic neighbourhood inside the larger math-operations field. Its characteristic function is exactly:</p>
              <TeX block>{`\\chi_{\\text{diff-op}} = \\lambda f.\\; [\\; f \\text{ is linear and local} \\;]`}</TeX>
              <p>This is the recursion the workbench makes visible — fields contain fields, and the <em>same</em> apparatus (λ for membership, PDE for propagation) describes every level. Whether the atoms are words, tokens, table columns, log lines, or API endpoints is irrelevant. The space is what matters.</p>
            </div>
          </div>
        </section>

        <footer style={{ padding: '28px 32px', background:'var(--ink)', color:'var(--paper-pale)' }}>
          <div className="between" style={{ flexWrap:'wrap', gap: 16 }}>
            <div className="caption" style={{ color:'var(--paper-pale)', letterSpacing: 2 }}>SEMANTIC FIELD WORKBENCH · RGB+λ build · ∂_t φ = D∇²φ − u·∇φ</div>
            <div className="caption" style={{ color:'var(--paper-pale)', letterSpacing: 2 }}>6 fields · 4 metaphors · 1 equation</div>
          </div>
        </footer>

        <window.TweaksPanel title="Tweaks">
          <window.TweakSection label="Simulation" />
          <window.TweakSlider label="Diffusion D" value={t.diffusion} min={0} max={0.5} step={0.01} onChange={(v)=>setT('diffusion', v)}/>
          <window.TweakSlider label="Velocity uX" value={t.advX} min={-0.5} max={0.5} step={0.01} onChange={(v)=>setT('advX', v)}/>
          <window.TweakSlider label="Velocity uY" value={t.advY} min={-0.5} max={0.5} step={0.01} onChange={(v)=>setT('advY', v)}/>
          <window.TweakSlider label="Decay" value={t.decay} min={0} max={0.05} step={0.001} onChange={(v)=>setT('decay', v)}/>
          <window.TweakSection label="Display" />
          <window.TweakToggle label="Pixel grid" value={t.showGrid} onChange={(v)=>setT('showGrid', v)}/>
        </window.TweaksPanel>
      </div>
    );
  }

  function SectionHeader({ num, title, lede }) {
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display:'grid', gridTemplateColumns:'96px 1fr', columnGap: 16, alignItems:'start' }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize: 64, lineHeight: 0.85, alignSelf:'start' }}>{num}</span>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 44, lineHeight: 1.02, margin: 0, textWrap:'balance' }}>{title}</h2>
            <div className="caption" style={{ marginTop: 8, fontSize: 12 }}>{lede}</div>
          </div>
        </div>
        <div className="divider-dash" style={{ marginTop: 14 }}></div>
      </div>
    );
  }

  function ExplainCard({ n, label, children }) {
    return (
      <div className="window window-tight" style={{ background:'var(--paper-pale)' }}>
        <div className="titlebar" style={{ background:'var(--mix-y)' }}>
          <span className="chip solid" style={{ fontSize: 10, padding:'1px 5px' }}>{n}</span>
          <span className="title" style={{ fontSize: 14 }}>{label}</span>
        </div>
        <div className="window-body">
          <div className="prose" style={{ fontSize: 13.5 }}>{children}</div>
        </div>
      </div>
    );
  }

  function TopBar() {
    const linkS = { color:'var(--ink)', textDecoration:'none', padding:'2px 6px' };
    return (
      <div className="between" style={{
        padding:'6px 10px', background:'var(--paper-deep)', borderBottom:'2px solid var(--ink)',
        fontFamily:'var(--font-mono)', fontSize: 11, letterSpacing: 1.2, textTransform:'uppercase',
        position:'sticky', top: 0, zIndex: 50
      }}>
        <div className="row gap-8" style={{ alignItems:'center', flexWrap:'wrap' }}>
          <span className="chip solid">⌂ start</span>
          <span className="sep">│</span>
          <a href="#s01" style={linkS}>01 sandbox</a>
          <a href="#s02" style={linkS}>02 λ</a>
          <a href="#s03" style={linkS}>03 features</a>
          <a href="#s04" style={linkS}>04 flow</a>
          <a href="#s05" style={linkS}>05 map</a>
          <a href="#s06" style={linkS}>06 IT</a>
          <a href="#s07" style={linkS}>07 ex</a>
        </div>
        <div className="row gap-8" style={{ alignItems:'center' }}>
          <span className="blink">◉</span>
          <span>λ-ctx idle</span>
          <span className="sep">│</span>
          <span>rgb</span>
        </div>
      </div>
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App/>);
})();
