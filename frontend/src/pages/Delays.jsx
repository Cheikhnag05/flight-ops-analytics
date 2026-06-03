import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { api } from '../api'
import { Loader, PageHeader, Select, CockpitTooltip, CAUSE_COLORS } from '../components/Shared'

const CAUSE_LABELS = { carrier:'CARRIER', weather:'WEATHER', nas:'NAS / ATC', security:'SECURITY', late_aircraft:'LATE AIRCRAFT' }

export default function Delays() {
  const [causes,  setCauses]  = useState([])
  const [monthly, setMonthly] = useState([])
  const [year,    setYear]    = useState(2026)
  const [airport, setAirport] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.delayCauses({ year, airport: airport || undefined }),
      api.delays({ year, airport: airport || undefined }),
    ]).then(([c, m]) => { setCauses(c); setMonthly(m) })
      .finally(() => setLoading(false))
  }, [year, airport])

  const monthlyPivot = {}
  monthly.forEach(r => {
    const k = r.month
    if (!monthlyPivot[k]) monthlyPivot[k] = { month: r.month }
    monthlyPivot[k][r.delay_cause] = r.avg_delay
  })
  const monthlyArr = Object.values(monthlyPivot).sort((a,b)=>a.month-b.month)
    .map(r => ({ ...r, month: ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][r.month-1] }))

  if (loading) return <><PageHeader title="DELAY ANALYSIS" /><Loader text="ANALYZING DELAYS..." /></>

  const totalDelays = causes.reduce((s,c) => s+c.count, 0)

  return (
    <div className="animate-fade-in">
      <PageHeader title="▸ DELAY ANALYSIS · ROOT CAUSE BREAKDOWN" subtitle="BTS DELAY CATEGORIES · AVG MINUTES · MONTHLY DISTRIBUTION">
        <Select value={airport} onChange={setAirport} options={[['','ALL'],['IAH','IAH'],['HOU','HOU']]} />
        <Select value={year} onChange={v=>setYear(+v)} options={[2022,2023,2024,2025,2026].map(y=>[y,y])} />
      </PageHeader>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {/* Pie chart causes */}
          <div className="panel p-4">
            <p className="font-mono text-xs text-slate-400 tracking-widest mb-3">DELAY CAUSES · {year}</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={causes} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="count">
                    {causes.map((e,i) => (
                      <Cell key={i} fill={CAUSE_COLORS[e.delay_cause]||'#00D4FF'}
                        style={{ filter:`drop-shadow(0 0 6px ${CAUSE_COLORS[e.delay_cause]||'#00D4FF'})` }} />
                    ))}
                  </Pie>
                  <Tooltip content={<CockpitTooltip />} formatter={v=>[v?.toLocaleString(),'Delays']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {causes.map(c => (
                  <div key={c.delay_cause} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: CAUSE_COLORS[c.delay_cause], boxShadow:`0 0 4px ${CAUSE_COLORS[c.delay_cause]}` }} />
                      <span className="font-mono text-[10px] text-slate-400">{CAUSE_LABELS[c.delay_cause]||c.delay_cause}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold" style={{ color: CAUSE_COLORS[c.delay_cause] }}>{c.pct}%</span>
                      <span className="font-mono text-[10px] text-slate-600 ml-2">{c.avg_delay?.toFixed(0)}m avg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar chart avg delay */}
          <div className="panel p-4">
            <p className="font-mono text-xs text-slate-400 tracking-widest mb-3">AVG DELAY BY CAUSE (MIN) · {year}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={causes} margin={{ left:0, right:20 }}>
                <XAxis dataKey="delay_cause" tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }}
                  axisLine={false} tickLine={false} tickFormatter={v=>CAUSE_LABELS[v]?.split('/')[0].trim()||v} />
                <YAxis tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} tickFormatter={v=>v+'m'} />
                <Tooltip content={<CockpitTooltip />} formatter={v=>[+v?.toFixed(1)+'min','Avg Delay']} />
                <Bar dataKey="avg_delay" radius={[3,3,0,0]} name="Avg Delay">
                  {causes.map((e,i) => (
                    <Cell key={i} fill={CAUSE_COLORS[e.delay_cause]||'#00D4FF'}
                      style={{ filter:`drop-shadow(0 0 4px ${CAUSE_COLORS[e.delay_cause]||'#00D4FF'})` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly breakdown */}
        <div className="panel p-4">
          <p className="font-mono text-xs text-slate-400 tracking-widest mb-3">MONTHLY DELAY INTENSITY · AVG MIN BY CAUSE · {year}</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyArr} margin={{ left:0, right:10 }}>
              <XAxis dataKey="month" tick={{ fill:'#475569', fontSize:10, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#475569', fontSize:9, fontFamily:'monospace' }} axisLine={false} tickLine={false} tickFormatter={v=>v+'m'} />
              <Tooltip content={<CockpitTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={v=><span className="font-mono text-[10px] text-slate-400">{CAUSE_LABELS[v]||v}</span>} />
              {Object.keys(CAUSE_COLORS).map(cause => (
                <Bar key={cause} dataKey={cause} stackId="a" fill={CAUSE_COLORS[cause]} name={cause} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { title:'CARRIER DELAY', pct: causes.find(c=>c.delay_cause==='carrier')?.pct||0, insight:'Airline operational issues — maintenance, crew, late pushback. Primary area for internal improvement.', color:'border-amber-DEFAULT/30 bg-amber-DEFAULT/5 text-amber-DEFAULT' },
            { title:'WEATHER IMPACT', pct: causes.find(c=>c.delay_cause==='weather')?.pct||0, insight:'IAH susceptible to severe thunderstorms (Apr-Sep). HOU fog events in winter. Unavoidable but predictable.', color:'border-cyan-DEFAULT/30 bg-cyan-DEFAULT/5 text-cyan-DEFAULT' },
            { title:'LATE AIRCRAFT', pct: causes.find(c=>c.delay_cause==='late_aircraft')?.pct||0, insight:'Downstream propagation — tight rotations amplify initial delays across the day. Key turnaround metric.', color:'border-alert-DEFAULT/30 bg-alert-DEFAULT/5 text-alert-DEFAULT' },
          ].map(({title,pct,insight,color}) => (
            <div key={title} className={`panel p-4 border ${color}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-mono text-[10px] tracking-widest font-bold`}>{title}</span>
                <span className="font-mono text-lg font-bold">{pct}%</span>
              </div>
              <p className="text-slate-500 text-[10px] font-mono leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
