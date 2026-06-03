import { Plane, Activity } from 'lucide-react'

const TABS = [
  { id:'flightboard', label:'FLIGHT BOARD',  code:'FB' },
  { id:'otp',         label:'ON-TIME PERF',  code:'OTP'},
  { id:'delays',      label:'DELAY ANALYSIS',code:'DLY'},
  { id:'turnaround',  label:'TURNAROUND',    code:'TAT'},
  { id:'routes',      label:'ROUTES',        code:'RTE'},
  { id:'passenger',   label:'PASSENGER EXP', code:'PAX'},
]

export default function Navbar({ current, onChange, health }) {
  const now = new Date().toUTCString().slice(0,25).toUpperCase()
  return (
    <header className="bg-cockpit-deep border-b border-cockpit-border flex-shrink-0">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-cockpit-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-DEFAULT/10 border border-cyan-DEFAULT/30 flex items-center justify-center glow-cyan">
            <Plane className="w-4 h-4 text-cyan-DEFAULT" />
          </div>
          <div>
            <span className="font-mono text-cyan-DEFAULT text-sm font-semibold tracking-widest">FLIGHT OPS ANALYTICS</span>
            <span className="text-cockpit-border text-xs ml-3">·</span>
            <span className="text-slate-500 text-xs ml-3 font-mono">HOUSTON IAH & HOU · 2022–2026</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${health ? 'bg-lime-DEFAULT animate-pulse' : 'bg-alert-DEFAULT animate-blink'}`} />
            <span className={health ? 'text-lime-DEFAULT' : 'text-alert-DEFAULT'}>
              {health ? 'API ONLINE' : 'API OFFLINE'}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">{now} UTC</span>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Activity className="w-3 h-3" />
            <span>2M+ RECORDS</span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center px-4 gap-0.5">
        {TABS.map(tab => {
          const active = current === tab.id
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3 text-xs font-mono font-semibold tracking-widest transition-all ${
                active
                  ? 'text-cyan-DEFAULT border-b-2 border-cyan-DEFAULT bg-cyan-DEFAULT/5'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-cockpit-dim/30 border-b-2 border-transparent'
              }`}>
              <span className={`text-[10px] px-1 py-0.5 rounded font-bold ${active ? 'bg-cyan-DEFAULT/20 text-cyan-DEFAULT' : 'bg-cockpit-dim text-slate-600'}`}>
                {tab.code}
              </span>
              {tab.label}
              {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-DEFAULT" />}
            </button>
          )
        })}
      </div>
    </header>
  )
}
