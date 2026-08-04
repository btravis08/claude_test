/*
  The Studio dashboard skin (styled after the approved reference,
  2026-08-03), shared by every custom tool pane: dark shell with the
  site wordmark and a segmented tool nav, an oversized light hero
  title with an optional glass chip, then warm light-gray stat cards
  — thin numbers, hairline meters, dot legends, bar charts, gauges.
  Accent is SDR orange; good values render in ink, attention in
  accent. All styling is self-contained (scoped class names in one
  style block) so the Studio theme doesn't reach inside the panes.
*/

export const ACCENT = "#f2622e";
export const CARD_INK = "#1c1c1a";
export const CARD_MUTED = "#8b8a85";
export const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

import designops from "../../../designops.config.json";

const CSS = `
.ovw-root{min-height:100%;background:#0e0e0d;color:#eceae5;font-family:inherit;padding:0 0 48px}
.ovw-shell{max-width:1240px;margin:0 auto;padding:28px 32px 0}
.ovw-shell-wide{max-width:1400px}
.ovw-top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.ovw-mark{font-size:11px;letter-spacing:.22em;font-weight:600;color:#eceae5}
.ovw-mark span{color:#7c7b76;font-weight:400}
.ovw-seg{display:flex;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:4px}
.ovw-seg a,.ovw-seg button{font-size:12.5px;padding:7px 18px;border-radius:9px;color:#b9b7b1;text-decoration:none;background:none;border:0;cursor:pointer;font-family:inherit}
.ovw-seg a.is-active,.ovw-seg button.is-active{background:rgba(255,255,255,.12);color:#fff}
.ovw-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin:44px 0 36px;flex-wrap:wrap}
.ovw-hero h1{font-size:clamp(34px,4.4vw,54px);font-weight:300;letter-spacing:-.01em;line-height:1.04;margin:0;color:#f4f2ed}
.ovw-hero .ovw-sub{margin-top:10px;font-size:12.5px;color:#8a8984;max-width:56ch}
.ovw-glass{min-width:220px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px 18px;backdrop-filter:blur(12px)}
.ovw-glass .ovw-glass-label{font-size:12px;color:#b9b7b1}
.ovw-glass .ovw-glass-value{font-size:30px;font-weight:300;margin-top:2px;color:#f4f2ed}
.ovw-glass .ovw-glass-note{font-size:11.5px;color:#8a8984;margin-top:8px}
.ovw-glass.is-warn .ovw-glass-value{color:${ACCENT}}
.ovw-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:14px;align-items:start}
.ovw-card{grid-column:span 3;background:#edebe6;border-radius:18px;padding:20px 20px 18px;color:${CARD_INK};min-width:0}
.ovw-card-wide{grid-column:span 6}
.ovw-card-full{grid-column:span 12}
@media(max-width:1100px){.ovw-card{grid-column:span 6}.ovw-card-wide{grid-column:span 12}}
@media(max-width:640px){.ovw-card,.ovw-card-wide{grid-column:span 12}}
.ovw-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
.ovw-card-head h3{font-size:12.5px;font-weight:500;color:${CARD_INK};margin:0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ovw-card-head a{color:${CARD_INK};text-decoration:none;font-size:14px;flex:none}
.ovw-big{font-size:44px;font-weight:300;letter-spacing:-.01em;line-height:1;margin:6px 0 14px}
.ovw-big small{font-size:14px;color:${CARD_MUTED};font-weight:400;margin-left:6px}
.ovw-meter{position:relative;height:26px;margin-top:4px}
.ovw-meter:before{content:"";position:absolute;inset-inline:0;top:6px;height:2px;background:#d9d7d1}
.ovw-meter-fill{position:absolute;top:5px;height:4px;border-radius:2px}
.ovw-meter-scale{position:absolute;inset-inline:0;top:14px;display:flex;justify-content:space-between;font-size:10.5px;color:${CARD_MUTED}}
.ovw-dotrow{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #dedcd6;font-size:12.5px}
.ovw-dotrow:last-child{border-bottom:0}
.ovw-dot{width:6px;height:6px;border-radius:50%;flex:none}
.ovw-dotrow-label{color:${CARD_INK};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ovw-dotrow-value{margin-left:auto;color:${CARD_INK};font-variant-numeric:tabular-nums;flex:none}
.ovw-bars{display:flex;align-items:flex-end;gap:5px;height:60px;margin-top:14px}
.ovw-bar{width:4px;border-radius:2px}
.ovw-gauge{position:relative;width:128px;margin:6px auto 0}
.ovw-gauge-value{position:absolute;inset-inline:0;bottom:0;text-align:center;font-size:26px;font-weight:300}
.ovw-gauge-label{text-align:center;font-size:11.5px;color:${CARD_MUTED};margin-top:6px}
.ovw-foot{margin-top:22px;font-size:11.5px;color:#7c7b76}
.ovw-alert-list{margin:0;padding:0;list-style:none;font-size:12.5px}
.ovw-alert-list li{padding:6px 0;border-bottom:1px solid #dedcd6}
.ovw-alert-list li:last-child{border-bottom:0}
.ovw-mono{font-family:${MONO}}
.ovw-input{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:#eceae5;font-size:13px;padding:10px 14px;font-family:inherit;outline:none}
.ovw-input::placeholder{color:#8a8984}
.ovw-input:focus{border-color:rgba(255,255,255,.3)}
.ovw-table-row{display:flex;gap:14px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #dedcd6;font-size:12.5px;min-width:0}
.ovw-table-row:last-child{border-bottom:0}
.ovw-table-head{color:${CARD_MUTED};font-size:10.5px;letter-spacing:.08em;border-bottom:1px solid #d0cec8}
.ovw-cell-name{width:230px;flex:none;min-width:0}
.ovw-cell{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.ovw-muted{color:${CARD_MUTED}}
.ovw-swatch{display:inline-block;width:13px;height:13px;flex:none;border-radius:3px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18);vertical-align:-2px;margin-right:7px}
`;

/* tools registered in sanity.config.ts, in nav order */
const TOOLS: [name: string, label: string][] = [
  ["overview", "Overview"],
  ["performance", "Performance"],
  ["sections", "Sections"],
  ["tokens", "Tokens"],
  ...(designops.features.blog
    ? ([["calendar", "Calendar"]] as [string, string][])
    : []),
];

export function Shell({
  active,
  title,
  sub,
  chip,
  wide,
  children,
}: {
  active: string;
  title?: string;
  sub?: React.ReactNode;
  chip?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="ovw-root">
      <style>{CSS}</style>
      <div className={`ovw-shell${wide ? " ovw-shell-wide" : ""}`}>
        <div className="ovw-top">
          <div className="ovw-mark">
            {designops.site.name.toUpperCase()} <span>/ DESIGN OPS</span>
          </div>
          <nav className="ovw-seg">
            {TOOLS.map(([name, label]) => (
              <a key={name} className={name === active ? "is-active" : undefined} href={`/studio/${name}`}>
                {label}
              </a>
            ))}
          </nav>
        </div>
        {title ? (
          <div className="ovw-hero">
            <div>
              <h1>{title}</h1>
              {sub ? <div className="ovw-sub">{sub}</div> : null}
            </div>
            {chip}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function GlassChip({
  label,
  value,
  note,
  warn,
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div className={`ovw-glass${warn ? " is-warn" : ""}`}>
      <div className="ovw-glass-label">{label}</div>
      <div className="ovw-glass-value">{value}</div>
      {note ? <div className="ovw-glass-note">{note}</div> : null}
    </div>
  );
}

export function StatCard({
  title,
  href,
  size,
  children,
}: {
  title: React.ReactNode;
  href?: string;
  size?: "wide" | "full";
  children: React.ReactNode;
}) {
  return (
    <section className={`ovw-card${size === "wide" ? " ovw-card-wide" : size === "full" ? " ovw-card-full" : ""}`}>
      <header className="ovw-card-head">
        <h3>{title}</h3>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" aria-label="Open">
            ↗
          </a>
        ) : null}
      </header>
      {children}
    </section>
  );
}

/* hairline meter, 0..max — ink when passing, accent when not */
export function Meter({ value, max = 100, pass = 90 }: { value: number; max?: number; pass?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="ovw-meter">
      <div
        className="ovw-meter-fill"
        style={{ width: `${pct}%`, background: value >= pass ? CARD_INK : ACCENT }}
      />
      <div className="ovw-meter-scale">
        <span>0</span>
        <span>{Math.round(max / 2)}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

/* quarter-gauge arc */
export function Gauge({ value, max = 100, warn }: { value: number; max?: number; warn?: boolean }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const R = 52;
  const C = Math.PI * R;
  return (
    <div className="ovw-gauge">
      <svg viewBox="0 0 128 72" width="128" height="72" aria-hidden>
        <path d={`M 12 66 A ${R} ${R} 0 0 1 116 66`} fill="none" stroke="#dcdad4" strokeWidth="6" strokeLinecap="round" />
        <path
          d={`M 12 66 A ${R} ${R} 0 0 1 116 66`}
          fill="none"
          stroke={warn ? ACCENT : CARD_INK}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${C * pct} ${C}`}
        />
      </svg>
      <div className="ovw-gauge-value">{Math.round(value)}</div>
    </div>
  );
}

/* mini bar chart of a score series */
export function Bars({ series, pass = 90 }: { series: number[]; pass?: number }) {
  if (!series.length) return null;
  return (
    <div className="ovw-bars" aria-hidden>
      {series.map((value, i) => (
        <div
          key={i}
          className="ovw-bar"
          style={{
            height: `${Math.max(12, value * 0.56)}px`,
            background: value >= pass ? CARD_INK : ACCENT,
          }}
        />
      ))}
    </div>
  );
}

export function DotRow({
  label,
  value,
  tone,
  title,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: "accent" | "muted";
  title?: string;
}) {
  return (
    <div className="ovw-dotrow" title={title}>
      <span
        className="ovw-dot"
        style={{ background: tone === "accent" ? ACCENT : tone === "muted" ? "#c4c2bc" : CARD_INK }}
      />
      <span className="ovw-dotrow-label">{label}</span>
      <span className="ovw-dotrow-value">{value}</span>
    </div>
  );
}
