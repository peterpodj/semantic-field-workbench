/* ==============================================================
   Reusable UI atoms for the Semantic Field Workbench
   ============================================================== */

window.UI = (function () {
  'use strict';
  const { TeX } = window.SF;

  // ----- Titlebar w/ traffic dots ----------
  function Titlebar({ title, meta, right, variant = 'yellow', children }) {
    const bg = variant === 'yellow' ? 'var(--paper-deep)'
             : variant === 'cream' ? 'var(--paper-pale)'
             : variant === 'black' ? 'var(--ink)'
             : 'var(--paper-deep)';
    const fg = variant === 'black' ? 'var(--paper-pale)' : 'var(--ink)';
    return (
      <div className="titlebar" style={{ background: bg, color: fg }}>
        <div className="dots-set">
          <span className="dot r"></span>
          <span className="dot y"></span>
          <span className="dot g"></span>
        </div>
        <span className="title">{title}</span>
        {meta && <span className="meta">{meta}</span>}
        {right}
        {children}
      </div>
    );
  }

  function Window({ title, meta, variant, children, statusLeft, statusRight, style, className, tight }) {
    return (
      <div className={`window ${tight ? 'window-tight' : ''} ${className || ''}`} style={style}>
        <Titlebar title={title} meta={meta} variant={variant} />
        {children}
        {(statusLeft || statusRight) && (
          <div className="statusbar">
            <span>{statusLeft}</span>
            <span>{statusRight}</span>
          </div>
        )}
      </div>
    );
  }

  // ----- Labeled field ----------
  function Labeled({ label, hint, children }) {
    return (
      <div className="col" style={{ gap: 4 }}>
        <div className="between">
          <span className="lbl">{label}</span>
          {hint && <span className="caption">{hint}</span>}
        </div>
        {children}
      </div>
    );
  }

  // ----- Slider w/ value readout ----------
  function Slider({ label, value, onChange, min = 0, max = 1, step = 0.01, unit = '', format }) {
    const v = format ? format(value) : value.toFixed(step < 1 ? 2 : 0);
    return (
      <Labeled label={label} hint={<><span className="tab-num">{v}</span>{unit}</>}>
        <input type="range" className="pslider" min={min} max={max} step={step} value={value}
               onChange={(e) => onChange(parseFloat(e.target.value))} />
      </Labeled>
    );
  }

  // ----- Segmented buttons ----------
  function Segmented({ options, value, onChange }) {
    return (
      <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
        {options.map(opt => {
          const v = typeof opt === 'string' ? opt : opt.value;
          const l = typeof opt === 'string' ? opt : opt.label;
          return (
            <button key={v}
              className={`pbtn tiny ${value === v ? 'is-on' : ''}`}
              onClick={() => onChange(v)}>
              {l}
            </button>
          );
        })}
      </div>
    );
  }

  // ----- Field legend ----------
  function FieldLegend({ fieldId }) {
    const { FIELDS } = window.SF;
    return (
      <div className="legend">
        {Object.values(FIELDS).map(f => (
          <div key={f.id} className="legend-item" style={{ opacity: fieldId && fieldId !== f.id ? 0.35 : 1 }}>
            <span className="legend-sw" style={{ background: f.colorRaw }}></span>
            <span>{f.title}</span>
          </div>
        ))}
      </div>
    );
  }

  // ----- Split "display" heading — big pixel font ----------
  function Display({ children, sub }) {
    return (
      <div>
        <h1>{children}</h1>
        {sub && <div className="lbl" style={{ marginTop: 6 }}>{sub}</div>}
      </div>
    );
  }

  // ----- Small section marker ----------
  function SectionMark({ num, title }) {
    return (
      <div className="section-header">
        <span className="lbl" style={{ fontSize: 11, background: 'var(--ink)', color: 'var(--paper)', padding: '2px 8px' }}>
          § {num}
        </span>
        <h2>{title}</h2>
      </div>
    );
  }

  // ----- Formula card ----------
  function FormulaCard({ title, tex, note }) {
    return (
      <Window title={title} variant="cream" tight>
        <div className="window-body">
          <TeX block>{tex}</TeX>
          {note && <div className="caption" style={{ marginTop: 8 }}>{note}</div>}
        </div>
      </Window>
    );
  }

  return { Titlebar, Window, Labeled, Slider, Segmented, FieldLegend, Display, SectionMark, FormulaCard };
})();
