import { useEffect, useState } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, BarChart, Bar } from 'recharts'
import { api } from '../api'
import { Loader, PageHeader, Select, CockpitTooltip, AIRLINE_COLORS } from '../components/Shared'

export default function Routes() {
  const [routes,   setRoutes]   = useState([])
  const [airport,  setAirport]  = useState('IAH')
  const [fltType,  setFltType]  = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    setLoading(true)
    api.routes({ airport: airport||undefined, flight_type: fltType||undefined, limit:40 })
      .then(setRoutes).finally(() => setLoading(false))
  }, [airport, fltType])

  const top10 = [...routes].sort((a,b)=>b.total_flights-a.total_flights).slice(0,10)
  const worstOTP = [...routes].sort((a,b)=>a.otp_rate-b.otp_rate).slice(0,8)

  if (loading) return <><PageHeader title="ROUTE PERFORMANCE" /><Loader text="MAPPING ROUTES..." /></>

  return (
    <div className="animate-fade-in">
      <PageHeader title="▸ ROUTE PERFORMANCE · ORIGIN-DESTINATION ANALYSIS" subtitle="TOP ROUTES · OTP · DISTANCE vs DELAY CORRELATION">
        <Select value={airport}  onChange={setAirport}  options={[['IAH','IAH — BUSH'],['HOU','HOU — HOBBY'],['','ALL']]} />
        <Select value={fltType}  onChange={setFltType}  options={[['','ALL'],['Domestic','DOMESTIC'],['International','INTL']]} />
      </PageHeader>

      <div className="p-5 space-y-5">
        {/* Scatter plot distance vs delay */}
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-xs text-slate-400 tracking-widest">DISTANCE vs AVG ARRIVAL DELAY · BUBBLE = FLIGHT VOLUME</p>
            <div className="flex gap-4 text-[10px] font-mono">
              {['Domestic','International'].map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: t==='Domestic'?'#00D4FF':'#FFB800' }} />
                  <span className="text-slate-500">{t.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top:5, right:20, left:0, bottom:5 }}>
              <XAxis dataKey="distance_mi" type="number" name="Distance" tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }}
                axisLine={false} tickLine={false} tickFormatter={v=>v+'mi'} label={{ value:'DISTANCE (MI)', position:'insideBottom', fill:'#475569', fontSize:9, fontFamily:'monospace' }} />
              <YAxis dataKey="avg_arr_delay" type="number" name="Avg Delay" tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }}
                axisLine={false} tickLine={false} tickFormatter={v=>v+'m'} />
              <Tooltip cursor={{ strokeDasharray:'3 3', stroke:'#1A2840' }}
                content={({ payload }) => {
                  if (!payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div className="bg-cockpit-deep border border-cockpit-border rounded px-3 py-2 text-[10px] font-mono">
                      <p className="text-cyan-DEFAULT font-bold">{d?.origin} → {d?.dest}</p>
                      <p className="text-slate-400">{d?.airline_name?.split(' ')[0]}</p>
                      <p className="text-amber-DEFAULT">Avg Delay: {d?.avg_arr_delay?.toFixed(1)}min</p>
                      <p className="text-slate-300">OTP: {d?.otp_rate?.toFixed(1)}%</p>
                      <p className="text-slate-500">{d?.total_flights?.toLocaleString()} flights</p>
                    </div>
                  )
                }} />
              <Scatter data={routes} name="Routes">
                {routes.map((r, i) => (
                  <Cell key={i} fill={r.flight_type==='International'?'#FFB800':'#00D4FF'} fillOpacity={0.7}
                    style={{ filter:`drop-shadow(0 0 3px ${r.flight_type==='International'?'#FFB800':'#00D4FF'})` }} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Top routes by volume */}
          <div className="panel p-4">
            <p className="font-mono text-xs text-slate-400 tracking-widest mb-3">TOP 10 ROUTES BY VOLUME</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={top10} layout="vertical" margin={{ left:5, right:30 }}>
                <XAxis type="number" tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} tickFormatter={v=>(v/1000).toFixed(0)+'K'} />
                <YAxis type="category" dataKey="origin" width={60} tick={{ fill:'#94A3B8', fontSize:9, fontFamily:'monospace' }}
                  axisLine={false} tickLine={false} tickFormatter={(v,i) => `${top10[i]?.origin||v}→${top10[i]?.dest||''}`} />
                <Tooltip content={<CockpitTooltip />} formatter={v=>[v?.toLocaleString(),'Flights']} />
                <Bar dataKey="total_flights" radius={[0,3,3,0]} name="Flights">
                  {top10.map((r,i) => <Cell key={i} fill={AIRLINE_COLORS[r.carrier]||'#00D4FF'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Worst OTP routes */}
          <div className="panel p-0 overflow-hidden">
            <p className="font-mono text-xs text-slate-400 tracking-widest p-3 border-b border-cockpit-border">WORST OTP ROUTES ⚠️</p>
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="bg-cockpit-dim/30 border-b border-cockpit-border">
                  {['ROUTE','TYPE','CARRIER','OTP','AVG DLY','FLIGHTS'].map(h=>(
                    <th key={h} className="px-3 py-2 text-left text-slate-500 tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {worstOTP.map((r,i)=>(
                  <tr key={i} className="border-b border-cockpit-border/40 hover:bg-cockpit-dim/20">
                    <td className="px-3 py-2 text-cyan-DEFAULT font-bold">{r.origin}→{r.dest}</td>
                    <td className="px-3 py-2 text-slate-500">{r.flight_type==='International'?'INTL':'DOM'}</td>
                    <td className="px-3 py-2" style={{ color:AIRLINE_COLORS[r.carrier]||'#00D4FF' }}>{r.carrier}</td>
                    <td className="px-3 py-2 text-alert-DEFAULT font-bold">{r.otp_rate?.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-amber-DEFAULT">{r.avg_arr_delay?.toFixed(0)}m</td>
                    <td className="px-3 py-2 text-slate-400">{r.total_flights?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
