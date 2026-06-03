export function Loader({ text = 'LOADING...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-8 h-8 border-2 border-cyan-DEFAULT/20 border-t-cyan-DEFAULT rounded-full animate-spin" />
      <p className="font-mono text-cyan-dim text-xs tracking-widest animate-blink">{text}</p>
    </div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-cockpit-border">
      <div>
        <h2 className="font-mono text-white font-semibold tracking-wider text-sm">{title}</h2>
        {subtitle && <p className="text-slate-500 text-xs mt-0.5 font-mono">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}

export function Select({ value, onChange, options, className = '' }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`bg-cockpit-panel border border-cockpit-border text-slate-300 text-xs font-mono rounded px-3 py-1.5 focus:outline-none focus:border-cyan-DEFAULT ${className}`}>
      {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
    </select>
  )
}

export function InstrumentCard({ label, value, unit = '', color = 'cyan', sub }) {
  const colors = {
    cyan:  'text-cyan-DEFAULT border-cyan-DEFAULT/30 bg-cyan-DEFAULT/5',
    amber: 'text-amber-DEFAULT border-amber-DEFAULT/30 bg-amber-DEFAULT/5',
    lime:  'text-lime-DEFAULT border-lime-DEFAULT/30 bg-lime-DEFAULT/5',
    alert: 'text-alert-DEFAULT border-alert-DEFAULT/30 bg-alert-DEFAULT/5',
  }
  return (
    <div className={`panel p-4 border ${colors[color]}`}>
      <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-2">{label}</p>
      <p className={`font-mono text-3xl font-bold tabular-nums ${colors[color].split(' ')[0]}`} style={{ textShadow: `0 0 12px currentColor` }}>
        {value}<span className="text-lg ml-1 opacity-70">{unit}</span>
      </p>
      {sub && <p className="text-slate-600 text-[10px] font-mono mt-1">{sub}</p>}
    </div>
  )
}

export const AIRLINE_COLORS = {
  'UA':'#00D4FF','AA':'#FF3B3B','WN':'#FFB800','DL':'#B45EFF',
  'B6':'#00FF88','NK':'#FF8C00','F9':'#00CCFF','AS':'#4488FF',
}
export const CAUSE_COLORS = {
  carrier:'#FFB800', weather:'#00D4FF', nas:'#B45EFF', security:'#FF3B3B', late_aircraft:'#FF8C00'
}

export const CockpitTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-cockpit-deep border border-cockpit-border rounded px-3 py-2 text-xs font-mono shadow-xl">
      <p className="text-cyan-DEFAULT mb-1 tracking-wider">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || p.fill || '#00D4FF' }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}
