import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Plane, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts'
import { api } from '../api'
import { InstrumentCard, Loader, PageHeader, Select, CockpitTooltip, AIRLINE_COLORS } from '../components/Shared'

export default function FlightBoard() {
  const [overview, setOverview] = useState(null)
  const [trends,   setTrends]   = useState([])
  const [hourly,   setHourly]   = useState([])
  const [year,     setYear]     = useState(2026)
  const [airport,  setAirport]  = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.overview({ year, airport: airport || undefined }),
      api.trends({ metric:'otp_rate', airport: airport || undefined }),
      api.hourly({ year, airport: airport || undefined }),
    ]).then(([ov, tr, hr]) => { setOverview(ov); setTrends(tr); setHourly(hr) })
      .finally(() => setLoading(false))
  }, [year, airport])

  // Trend data pour sparkline
  const trendData = trends.map(r => ({
    label: `${r.year}-${String(r.month).padStart(2,'0')}`,
    otp:   +r.otp_rate?.toFixed(1),
    delay: +r.delay_rate?.toFixed(1),
    cancel: +r.cancellation_rate?.toFixed(2),
  }))

  if (loading) return <><PageHeader title="FLIGHT BOARD · OPERATIONS CENTER" /><Loader text="LOADING FLIGHT DATA..." /></>

  const otp = overview?.otp_rate_pct || 0
  const otpColor = otp >= 85 ? 'lime' : otp >= 75 ? 'amber' : 'alert'

  return (
    <div className="animate-fade-in">
      <PageHeader title="▸ FLIGHT BOARD · OPERATIONS CENTER" subtitle={`HOUSTON ${airport || 'IAH+HOU'} · ${year} · BTS FORMAT`}>
        <Select value={airport} onChange={setAirport} options={[['','ALL AIRPORTS'],['IAH','IAH — BUSH'],['HOU','HOU — HOBBY']]} />
        <Select value={year}    onChange={v => setYear(+v)} options={[2022,2023,2024,2025,2026].map(y=>[y,y])} />
      </PageHeader>

      <div className="p-5 space-y-5">
        {/* Instruments row */}
        <div className="grid grid-cols-5 gap-3">
          <InstrumentCard label="ON-TIME RATE"     value={otp.toFixed(1)}   unit="%" color={otpColor} sub={`TARGET: 85.0%`} />
          <InstrumentCard label="TOTAL FLIGHTS"    value={(overview?.total_flights/1000)?.toFixed(0)} unit="K" color="cyan"  sub="SCHEDULED" />
          <InstrumentCard label="CANCELLED"        value={overview?.cancellation_rate_pct?.toFixed(2)} unit="%" color="alert" sub={`${overview?.cancelled_flights?.toLocaleString()} FLT`} />
          <InstrumentCard label="AVG DEP DELAY"    value={overview?.avg_dep_delay_min?.toFixed(0)} unit="MIN" color="amber" sub="WHEN DELAYED" />
          <InstrumentCard label="AVG TURNAROUND"   value={overview?.avg_turnaround_min?.toFixed(0)} unit="MIN" color="cyan"  sub="GATE TIME" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-4">
          {/* OTP Trend */}
          <div className="col-span-2 panel p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-slate-400 tracking-widest">OTP TREND 2022–{year}</span>
              <span className="font-mono text-cyan-DEFAULT text-xs">{otp.toFixed(1)}% CURRENT</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="otpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00D4FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} interval={5} />
                <YAxis domain={[70,95]} tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} tickFormatter={v=>v+'%'} />
                <Tooltip content={<CockpitTooltip />} formatter={v=>[v+'%']} />
                <Area type="monotone" dataKey="otp" stroke="#00D4FF" fill="url(#otpGrad)" strokeWidth={2} name="OTP %" dot={false} />
                <Line type="monotone" dataKey="cancel" stroke="#FF3B3B" strokeWidth={1.5} strokeDasharray="4 2" name="Cancel %" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly pattern */}
          <div className="panel p-4">
            <span className="font-mono text-xs text-slate-400 tracking-widest block mb-3">HOURLY DELAY PATTERN</span>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hourly} margin={{ left: -10 }}>
                <defs>
                  <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#FFB800" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FFB800" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="dep_hour" tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} tickFormatter={v=>v+'H'} />
                <YAxis tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} tickFormatter={v=>v+'%'} />
                <Tooltip content={<CockpitTooltip />} formatter={v=>[+v?.toFixed(1)+'%','Delay Rate']} />
                <Area type="monotone" dataKey="otp_rate" stroke="#FFB800" fill="url(#hourGrad)" strokeWidth={1.5} name="OTP%" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-slate-600 text-[10px] font-mono mt-1">← EARLY MORNING BETTER · EVENING WORST →</p>
          </div>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'OPERATED', val: overview?.operated_flights?.toLocaleString(), icon: Plane, color:'text-lime-DEFAULT', border:'border-lime-DEFAULT/20 bg-lime-DEFAULT/5' },
            { label:'DELAYED',  val: overview?.delayed_flights?.toLocaleString(),  icon: Clock, color:'text-amber-DEFAULT', border:'border-amber-DEFAULT/20 bg-amber-DEFAULT/5' },
            { label:'CANCELLED',val: overview?.cancelled_flights?.toLocaleString(),icon: XCircle, color:'text-alert-DEFAULT', border:'border-alert-DEFAULT/20 bg-alert-DEFAULT/5' },
          ].map(({ label, val, icon: Icon, color, border }) => (
            <div key={label} className={`panel p-4 border ${border} flex items-center gap-4`}>
              <Icon className={`w-6 h-6 ${color} flex-shrink-0`} />
              <div>
                <p className="text-slate-500 text-[10px] font-mono tracking-widest">{label}</p>
                <p className={`font-mono text-2xl font-bold ${color} tabular-nums`}>{val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
