import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts'
import { api } from '../api'
import { Loader, PageHeader, Select, CockpitTooltip, AIRLINE_COLORS } from '../components/Shared'

export default function Turnaround() {
  const [data,    setData]    = useState([])
  const [hourly,  setHourly]  = useState([])
  const [airport, setAirport] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.turnaround({ airport: airport || undefined }),
      api.hourly({ year:2026, airport: airport || undefined }),
    ]).then(([t,h]) => { setData(t); setHourly(h) })
      .finally(() => setLoading(false))
  }, [airport])

  // 2026 data only
  const data2026 = data.filter(r => r.year === 2026)
    .sort((a,b) => a.avg_turnaround - b.avg_turnaround)

  // Trend by year (average all carriers)
  const byYear = {}
  data.forEach(r => {
    if (!byYear[r.year]) byYear[r.year] = { year: r.year, tat:[], taxi:[] }
    byYear[r.year].tat.push(r.avg_turnaround)
    byYear[r.year].taxi.push(r.avg_taxi_out)
  })
  const trendArr = Object.values(byYear).map(r => ({
    year: r.year,
    avg_turnaround: +(r.tat.reduce((s,v)=>s+v,0)/r.tat.length).toFixed(1),
    avg_taxi_out:   +(r.taxi.reduce((s,v)=>s+v,0)/r.taxi.length).toFixed(1),
  })).sort((a,b)=>a.year-b.year)

  if (loading) return <><PageHeader title="TURNAROUND EFFICIENCY" /><Loader text="COMPUTING ROTATION TIMES..." /></>

  return (
    <div className="animate-fade-in">
      <PageHeader title="▸ TURNAROUND EFFICIENCY · GATE & TAXI ANALYSIS" subtitle="AVG GATE TIME · TAXI OUT · TAXI IN · BLOCK TIME">
        <Select value={airport} onChange={setAirport} options={[['','ALL'],['IAH','IAH'],['HOU','HOU']]} />
      </PageHeader>

      <div className="p-5 space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:'AVG GATE TURNAROUND', val: data2026.length ? (data2026.reduce((s,r)=>s+r.avg_turnaround,0)/data2026.length).toFixed(0) : '--', unit:'MIN', color:'text-cyan-DEFAULT', note:'Industry target: 45 min' },
            { label:'AVG TAXI-OUT',         val: data2026.length ? (data2026.reduce((s,r)=>s+r.avg_taxi_out,0)/data2026.length).toFixed(0) : '--',   unit:'MIN', color:'text-amber-DEFAULT', note:'FAA standard: 15-20 min' },
            { label:'AVG TAXI-IN',          val: data2026.length ? (data2026.reduce((s,r)=>s+r.avg_taxi_in,0)/data2026.length).toFixed(0) : '--',    unit:'MIN', color:'text-amber-DEFAULT', note:'Typically 8-12 min' },
            { label:'BEST PERFORMER',       val: data2026[0]?.carrier || '--', unit:'', color:'text-lime-DEFAULT', note:`${data2026[0]?.avg_turnaround?.toFixed(0)} min avg TAT` },
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
          {/* TAT by airline */}
          <div className="panel p-4">
            <p className="font-mono text-xs text-slate-400 tracking-widest mb-3">GATE TURNAROUND BY AIRLINE · 2026 (MIN)</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data2026} margin={{ left:0, right:10 }}>
                <XAxis dataKey="carrier" tick={{ fill:'#94A3B8', fontSize:10, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} tickFormatter={v=>v+'m'} />
                <Tooltip content={<CockpitTooltip />} formatter={v=>[+v?.toFixed(1)+'min']} />
                <Bar dataKey="avg_turnaround" radius={[3,3,0,0]} name="TAT min">
                  {data2026.map((e,i) => (
                    <Cell key={i} fill={AIRLINE_COLORS[e.carrier]||'#00D4FF'}
                      style={{ filter:`drop-shadow(0 0 4px ${AIRLINE_COLORS[e.carrier]||'#00D4FF'})` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trend */}
          <div className="panel p-4">
            <p className="font-mono text-xs text-slate-400 tracking-widest mb-3">TAT & TAXI-OUT TREND 2022–2026</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendArr}>
                <XAxis dataKey="year" tick={{ fill:'#475569', fontSize:10, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} tickFormatter={v=>v+'m'} />
                <Tooltip content={<CockpitTooltip />} formatter={v=>[+v?.toFixed(1)+'min']} />
                <Legend iconType="circle" iconSize={8} formatter={v=><span className="font-mono text-[10px] text-slate-400">{v}</span>} />
                <Line type="monotone" dataKey="avg_turnaround" stroke="#00D4FF" strokeWidth={2.5} dot={{ r:3, fill:'#00D4FF' }} name="Gate TAT" />
                <Line type="monotone" dataKey="avg_taxi_out"   stroke="#FFB800" strokeWidth={2} strokeDasharray="5 3" dot={{ r:3, fill:'#FFB800' }} name="Taxi-Out" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown table */}
        <div className="panel p-0 overflow-hidden">
          <p className="font-mono text-xs text-slate-400 tracking-widest p-4 border-b border-cockpit-border">DETAILED METRICS BY AIRLINE · 2026</p>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-cockpit-dim/30 border-b border-cockpit-border">
                {['CARRIER','AIRLINE','GATE TAT','TAXI OUT','TAXI IN','BLOCK TIME','FLIGHTS'].map(h=>(
                  <th key={h} className="px-4 py-2 text-left text-[10px] text-slate-500 tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data2026.map((r,i) => (
                <tr key={i} className="border-b border-cockpit-border/40 hover:bg-cockpit-dim/20 transition-colors">
                  <td className="px-4 py-2.5 font-bold" style={{ color:AIRLINE_COLORS[r.carrier]||'#00D4FF', textShadow:`0 0 6px ${AIRLINE_COLORS[r.carrier]||'#00D4FF'}` }}>{r.carrier}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-[10px]">{r.airline_name?.split(' ').slice(0,2).join(' ')}</td>
                  <td className="px-4 py-2.5 text-cyan-DEFAULT font-bold">{r.avg_turnaround?.toFixed(0)}m</td>
                  <td className="px-4 py-2.5 text-amber-DEFAULT">{r.avg_taxi_out?.toFixed(0)}m</td>
                  <td className="px-4 py-2.5 text-amber-DEFAULT">{r.avg_taxi_in?.toFixed(0)}m</td>
                  <td className="px-4 py-2.5 text-slate-400">{r.avg_flight_time?.toFixed(0)}m</td>
                  <td className="px-4 py-2.5 text-slate-400">{(r.total_flights/1000)?.toFixed(0)}K</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
