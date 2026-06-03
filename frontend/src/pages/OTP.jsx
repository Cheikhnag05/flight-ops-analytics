import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts'
import { api } from '../api'
import { Loader, PageHeader, Select, CockpitTooltip, AIRLINE_COLORS } from '../components/Shared'

function OTPGauge({ value, label }) {
  const color = value >= 85 ? '#00FF88' : value >= 75 ? '#FFB800' : '#FF3B3B'
  const pct = Math.min(value, 100)
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 70" className="w-36">
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#1A2840" strokeWidth="10" strokeLinecap="round" />
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${pct * 1.57} 157`} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        <text x="60" y="52" textAnchor="middle" fill={color} fontSize="14" fontWeight="700" fontFamily="monospace">{value?.toFixed(1)}%</text>
      </svg>
      <p className="font-mono text-slate-500 text-[10px] tracking-widest text-center">{label}</p>
    </div>
  )
}

export default function OTP() {
  const [byAirline, setByAirline] = useState([])
  const [trends,    setTrends]    = useState([])
  const [year,      setYear]      = useState(2026)
  const [airport,   setAirport]   = useState('')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.otpByAirline({ year, airport: airport || undefined }),
      api.trends({ metric:'otp_rate', airport: airport || undefined }),
    ]).then(([al, tr]) => { setByAirline(al); setTrends(tr) })
      .finally(() => setLoading(false))
  }, [year, airport])

  // Pivot trends by carrier
  const carrierTrends = {}
  trends.forEach(r => {
    if (!carrierTrends[r.year]) carrierTrends[r.year] = { year: r.year }
  })

  const trendArr = Object.values(carrierTrends).sort((a,b)=>a.year-b.year)

  if (loading) return <><PageHeader title="ON-TIME PERFORMANCE" /><Loader text="COMPUTING OTP..." /></>

  return (
    <div className="animate-fade-in">
      <PageHeader title="▸ ON-TIME PERFORMANCE · OTP ANALYSIS" subtitle="AIRLINE RANKING · MONTHLY TRENDS · BENCHMARKS">
        <Select value={airport} onChange={setAirport} options={[['','ALL'],['IAH','IAH'],['HOU','HOU']]} />
        <Select value={year} onChange={v=>setYear(+v)} options={[2022,2023,2024,2025,2026].map(y=>[y,y])} />
      </PageHeader>

      <div className="p-5 space-y-5">
        {/* OTP Gauges */}
        <div className="panel p-5">
          <p className="font-mono text-xs text-slate-400 tracking-widest mb-4">OTP GAUGE · BY AIRLINE · {year}</p>
          <div className="flex items-start justify-around flex-wrap gap-4">
            {byAirline.map(a => <OTPGauge key={a.carrier} value={a.otp_rate} label={a.carrier} />)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Bar chart ranking */}
          <div className="panel p-4">
            <p className="font-mono text-xs text-slate-400 tracking-widest mb-3">OTP RANKING · {year}</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byAirline} layout="vertical" margin={{ left:5, right:30 }}>
                <XAxis type="number" domain={[60,100]} tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }}
                  axisLine={false} tickLine={false} tickFormatter={v=>v+'%'} />
                <YAxis type="category" dataKey="carrier" tick={{ fill:'#94A3B8', fontSize:10, fontFamily:'monospace' }}
                  width={35} axisLine={false} tickLine={false} />
                <Tooltip content={<CockpitTooltip />} formatter={v=>[+v?.toFixed(1)+'%','OTP']} />
                <Bar dataKey="otp_rate" radius={[0,3,3,0]} name="OTP %">
                  {byAirline.map((e,i) => (
                    <Cell key={i} fill={AIRLINE_COLORS[e.carrier]||'#00D4FF'}
                      style={{ filter:`drop-shadow(0 0 4px ${AIRLINE_COLORS[e.carrier]||'#00D4FF'})` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed table */}
          <div className="panel p-0 overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-cockpit-border bg-cockpit-dim/30">
                  {['CARRIER','AIRLINE','OTP','CANCEL','DELAY','FLIGHTS'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] text-slate-500 tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byAirline.map((a, i) => {
                  const color = a.otp_rate >= 85 ? '#00FF88' : a.otp_rate >= 75 ? '#FFB800' : '#FF3B3B'
                  return (
                    <tr key={i} className="border-b border-cockpit-border/40 hover:bg-cockpit-dim/20 transition-colors">
                      <td className="px-3 py-2">
                        <span className="font-bold" style={{ color: AIRLINE_COLORS[a.carrier]||'#00D4FF',
                          textShadow:`0 0 8px ${AIRLINE_COLORS[a.carrier]||'#00D4FF'}` }}>{a.carrier}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-400 text-[10px]">{a.airline_name?.split(' ').slice(0,2).join(' ')}</td>
                      <td className="px-3 py-2 font-bold" style={{ color, textShadow:`0 0 6px ${color}` }}>{a.otp_rate?.toFixed(1)}%</td>
                      <td className="px-3 py-2 text-alert-DEFAULT">{a.cancel_rate?.toFixed(2)}%</td>
                      <td className="px-3 py-2 text-amber-DEFAULT">{a.avg_delay?.toFixed(1)}m</td>
                      <td className="px-3 py-2 text-slate-400">{(a.total/1000)?.toFixed(0)}K</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Benchmark */}
        <div className="panel p-4">
          <p className="font-mono text-xs text-slate-400 tracking-widest mb-3">INDUSTRY BENCHMARKS</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              {label:'FAA TARGET',     val:'85.0%', note:'Minimum acceptable', color:'text-lime-DEFAULT'},
              {label:'INDUSTRY AVG',   val:'80.2%', note:'US market 2024',     color:'text-cyan-DEFAULT'},
              {label:'LEGACY CARRIERS',val:'82.4%', note:'AA/UA/DL/AS avg',    color:'text-amber-DEFAULT'},
              {label:'LCC/ULCC',       val:'77.8%', note:'WN/NK/F9/B6 avg',    color:'text-amber-dim'},
            ].map(({label,val,note,color}) => (
              <div key={label} className="bg-cockpit-dim/30 rounded p-3 border border-cockpit-border/50">
                <p className="text-slate-500 text-[10px] font-mono tracking-widest">{label}</p>
                <p className={`font-mono text-2xl font-bold mt-1 ${color}`} style={{textShadow:'0 0 8px currentColor'}}>{val}</p>
                <p className="text-slate-600 text-[10px] font-mono mt-1">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
