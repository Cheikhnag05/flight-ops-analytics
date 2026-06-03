import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts'
import { api } from '../api'
import { Loader, PageHeader, Select, CockpitTooltip, AIRLINE_COLORS } from '../components/Shared'

const SAT_COLORS = { Excellent:'#00FF88', Good:'#00D4FF', Fair:'#FFB800', Poor:'#FF3B3B' }

export default function Passenger() {
  const [byAirline, setByAirline] = useState([])
  const [trends,    setTrends]    = useState([])
  const [year,      setYear]      = useState(2026)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.otpByAirline({ year }),
      api.trends({ metric:'otp_rate' }),
    ]).then(([al, tr]) => { setByAirline(al); setTrends(tr) })
      .finally(() => setLoading(false))
  }, [year])

  // Satisfaction proxy: based on OTP + cancellation
  const satData = byAirline.map(a => {
    const score = (a.otp_rate * 0.6) + ((100 - (a.cancel_rate||0)*10) * 0.4)
    const cat   = score >= 85 ? 'Excellent' : score >= 78 ? 'Good' : score >= 70 ? 'Fair' : 'Poor'
    return { ...a, sat_score: +score.toFixed(1), category: cat }
  }).sort((a,b) => b.sat_score - a.sat_score)

  // Monthly trend
  const monthlyTrend = trends.map(r => ({
    label: `${r.year}-${String(r.month).padStart(2,'0')}`,
    otp: +r.otp_rate?.toFixed(1),
    cancel: +r.cancellation_rate?.toFixed(2),
    sat: +((r.otp_rate*0.6) + ((100 - (r.cancellation_rate||0)*10)*0.4)).toFixed(1),
  }))

  if (loading) return <><PageHeader title="PASSENGER EXPERIENCE" /><Loader text="COMPUTING PAX METRICS..." /></>

  const avgSat = satData.length ? (satData.reduce((s,r)=>s+r.sat_score,0)/satData.length).toFixed(1) : '--'

  return (
    <div className="animate-fade-in">
      <PageHeader title="▸ PASSENGER EXPERIENCE · SATISFACTION PROXY" subtitle="OTP-BASED SCORE · CANCELLATION IMPACT · RELIABILITY INDEX">
        <Select value={year} onChange={v=>setYear(+v)} options={[2022,2023,2024,2025,2026].map(y=>[y,y])} />
      </PageHeader>

      <div className="p-5 space-y-5">
        {/* Score cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:'AVG SATISFACTION SCORE', val: avgSat, unit:'/100', color:'text-cyan-DEFAULT', note:'OTP + Reliability index' },
            { label:'BEST AIRLINE',   val: satData[0]?.carrier||'--', unit:'', color:'text-lime-DEFAULT', note:`${satData[0]?.sat_score} score` },
            { label:'WORST AIRLINE',  val: satData[satData.length-1]?.carrier||'--', unit:'', color:'text-alert-DEFAULT', note:`${satData[satData.length-1]?.sat_score} score` },
            { label:'PAX IMPACTED', val: byAirline.reduce((s,a)=>s+(a.cancelled||0),0)?.toLocaleString(), unit:'', color:'text-amber-DEFAULT', note:'By cancellations' },
          ].map(({label,val,unit,color,note}) => (
            <div key={label} className="panel p-4">
              <p className="text-slate-500 text-[10px] font-mono tracking-widest mb-2">{label}</p>
              <p className={`font-mono text-3xl font-bold tabular-nums ${color}`} style={{textShadow:'0 0 10px currentColor'}}>
                {val}<span className="text-lg ml-1 opacity-70">{unit}</span>
              </p>
              <p className="text-slate-600 text-[10px] font-mono mt-1">{note}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Satisfaction bar */}
          <div className="panel p-4">
            <p className="font-mono text-xs text-slate-400 tracking-widest mb-3">PASSENGER SATISFACTION SCORE BY AIRLINE · {year}</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={satData} margin={{ left:0, right:10 }}>
                <XAxis dataKey="carrier" tick={{ fill:'#94A3B8', fontSize:10, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
                <YAxis domain={[60,100]} tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CockpitTooltip />} formatter={v=>[+v?.toFixed(1),'Sat Score']} />
                <Bar dataKey="sat_score" radius={[4,4,0,0]} name="Satisfaction">
                  {satData.map((e,i) => (
                    <Cell key={i} fill={SAT_COLORS[e.category]||'#00D4FF'}
                      style={{ filter:`drop-shadow(0 0 5px ${SAT_COLORS[e.category]||'#00D4FF'})` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trend */}
          <div className="panel p-4">
            <p className="font-mono text-xs text-slate-400 tracking-widest mb-3">SATISFACTION TREND 2022–2026</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyTrend}>
                <XAxis dataKey="label" tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} interval={7} />
                <YAxis tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CockpitTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={v=><span className="font-mono text-[10px] text-slate-400">{v}</span>} />
                <Line type="monotone" dataKey="sat"  stroke="#00FF88" strokeWidth={2.5} dot={false} name="Sat Score" />
                <Line type="monotone" dataKey="otp"  stroke="#00D4FF" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="OTP %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Airline scorecard */}
        <div className="panel p-0 overflow-hidden">
          <p className="font-mono text-xs text-slate-400 tracking-widest p-4 border-b border-cockpit-border">AIRLINE SCORECARD · {year}</p>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-cockpit-dim/30 border-b border-cockpit-border">
                {['RANK','CARRIER','AIRLINE','SAT SCORE','RATING','OTP','CANCEL RATE','TOTAL FLT'].map(h=>(
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] text-slate-500 tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {satData.map((a,i) => (
                <tr key={i} className="border-b border-cockpit-border/40 hover:bg-cockpit-dim/20">
                  <td className="px-4 py-3 text-slate-600 font-bold">#{i+1}</td>
                  <td className="px-4 py-3 font-bold" style={{ color:AIRLINE_COLORS[a.carrier]||'#00D4FF', textShadow:`0 0 6px ${AIRLINE_COLORS[a.carrier]||'#00D4FF'}` }}>{a.carrier}</td>
                  <td className="px-4 py-3 text-slate-400 text-[10px]">{a.airline_name?.split(' ').slice(0,2).join(' ')}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-base" style={{ color:SAT_COLORS[a.category], textShadow:`0 0 6px ${SAT_COLORS[a.category]}` }}>{a.sat_score}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold`} style={{ background:`${SAT_COLORS[a.category]}20`, color:SAT_COLORS[a.category], border:`1px solid ${SAT_COLORS[a.category]}40` }}>
                      {a.category.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-cyan-DEFAULT font-bold">{a.otp_rate?.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-alert-DEFAULT">{a.cancel_rate?.toFixed(3)}%</td>
                  <td className="px-4 py-3 text-slate-500">{(a.total/1000)?.toFixed(0)}K</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
