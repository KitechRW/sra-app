import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'
import { BarChart3, Calendar, Bike, Download, TrendingUp } from 'lucide-react'

const COLORS = ['#0F2057','#F5A623','#22c55e','#3b82f6','#a855f7','#ef4444']

export default function ReportsPage() {
  const [tab, setTab]       = useState('weekly')
  const [weekly, setWeekly] = useState([])
  const [monthly, setMonthly] = useState([])
  const [bikeReport, setBikeReport] = useState([])

  useEffect(() => {
    axios.get('/api/reports/weekly').then(r  => setWeekly(r.data))
    axios.get('/api/reports/monthly').then(r => setMonthly(r.data))
    axios.get('/api/reports/bikes').then(r   => setBikeReport(r.data))
  }, [])

  const exportCSV = (data, filename) => {
    if (!data.length) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(r => Object.values(r).join(',')).join('\n')
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  }

  const totalWeekly  = weekly.reduce((s,r)=>s+Number(r.TotalAmount),0)
  const totalMonthly = monthly.reduce((s,r)=>s+Number(r.TotalAmount),0)
  const totalBike    = bikeReport.reduce((s,r)=>s+Number(r.TotalCollected),0)

  const tabs = [
    { id:'weekly',  label:'Weekly Report',  icon:Calendar },
    { id:'monthly', label:'Monthly Report', icon:TrendingUp },
    { id:'bikes',   label:'Per Bike Report',icon:Bike },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-black text-navy">Reports</h2><p className="text-xs text-gray-400">Financial and operational summaries</p></div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={()=>setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px
              ${tab===id ? 'border-navy text-navy' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <Icon size={15}/>{label}
          </button>
        ))}
      </div>

      {/* WEEKLY REPORT */}
      {tab==='weekly' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-navy">Total: {totalWeekly.toLocaleString()} RWF across {weekly.length} weeks</div>
            <button onClick={()=>exportCSV(weekly,'weekly-report.csv')} className="btn-outline"><Download size={14}/>Export CSV</button>
          </div>
          <div className="card">
            <h3 className="font-bold text-navy text-sm mb-4">Weekly Collections (RWF)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...weekly].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="WeekVersement" tick={{fontSize:11}} tickFormatter={w=>`W${w}`} tickLine={false} axisLine={false}/>
                <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={v=>[`${Number(v).toLocaleString()} RWF`,'Amount']} contentStyle={{fontSize:12,borderRadius:8}}/>
                <Bar dataKey="TotalAmount" fill="#0F2057" radius={[4,4,0,0]} name="Total RWF"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100"><tr>{['Week','Period','Bikes','Riders','Payments','Total Amount (RWF)'].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {weekly.map(r=>(
                  <tr key={r.WeekVersement} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="td"><span className="bg-navy text-white text-xs font-bold px-2 py-0.5 rounded-full">W{r.WeekVersement}</span></td>
                    <td className="td text-xs text-gray-500">{r.WeekStart} → {r.WeekEnd}</td>
                    <td className="td">{r.TotalBikes}</td>
                    <td className="td">{r.TotalRiders}</td>
                    <td className="td">{r.TotalPayments}</td>
                    <td className="td font-black text-green-700">{Number(r.TotalAmount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr><td className="td font-bold text-gray-500 text-xs" colSpan="5">GRAND TOTAL</td><td className="td font-black text-green-700 text-base">{totalWeekly.toLocaleString()} RWF</td></tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* MONTHLY REPORT */}
      {tab==='monthly' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-navy">Total: {totalMonthly.toLocaleString()} RWF across {monthly.length} months</div>
            <button onClick={()=>exportCSV(monthly,'monthly-report.csv')} className="btn-outline"><Download size={14}/>Export CSV</button>
          </div>
          <div className="card">
            <h3 className="font-bold text-navy text-sm mb-4">Monthly Collections (RWF)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={[...monthly].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="Month" tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={v=>[`${Number(v).toLocaleString()} RWF`,'Amount']} contentStyle={{fontSize:12,borderRadius:8}}/>
                <Line type="monotone" dataKey="TotalAmount" stroke="#F5A623" strokeWidth={2.5} dot={{fill:'#F5A623',r:4}} name="Total RWF"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100"><tr>{['Month','Bikes','Riders','Payments','Total Amount (RWF)'].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {monthly.map(r=>(
                  <tr key={r.Month} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="td font-bold text-navy">{r.Month}</td>
                    <td className="td">{r.TotalBikes}</td>
                    <td className="td">{r.TotalRiders}</td>
                    <td className="td">{r.TotalPayments}</td>
                    <td className="td font-black text-green-700">{Number(r.TotalAmount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr><td className="td font-bold text-gray-500 text-xs" colSpan="4">GRAND TOTAL</td><td className="td font-black text-green-700 text-base">{totalMonthly.toLocaleString()} RWF</td></tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* PER BIKE REPORT */}
      {tab==='bikes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-navy">Total: {totalBike.toLocaleString()} RWF across {bikeReport.length} bikes</div>
            <button onClick={()=>exportCSV(bikeReport,'bike-report.csv')} className="btn-outline"><Download size={14}/>Export CSV</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-4">Top Bikes by Collection</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bikeReport.slice(0,8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} tickLine={false} axisLine={false}/>
                  <YAxis type="category" dataKey="BikePlate" tick={{fontSize:10}} tickLine={false} axisLine={false} width={70}/>
                  <Tooltip formatter={v=>[`${Number(v).toLocaleString()} RWF`]} contentStyle={{fontSize:12,borderRadius:8}}/>
                  <Bar dataKey="TotalCollected" fill="#F5A623" radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="font-bold text-navy text-sm mb-4">Distribution by Bike</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={bikeReport.slice(0,6)} dataKey="TotalCollected" nameKey="BikePlate" cx="50%" cy="50%" outerRadius={70} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {bikeReport.slice(0,6).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v=>[`${Number(v).toLocaleString()} RWF`]} contentStyle={{fontSize:12,borderRadius:8}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100"><tr>{['Bike Plate','Model','Type','Owner','Current Rider','Payments','Total Collected (RWF)','Last Payment'].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {bikeReport.map(r=>(
                  <tr key={r.BikeID} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="td font-bold text-navy">{r.BikePlate}</td>
                    <td className="td text-xs text-gray-500">{r.BikeModel||'—'}</td>
                    <td className="td text-xs text-gray-500">{r.BikeType||'—'}</td>
                    <td className="td text-sm">{r.OwnerName}</td>
                    <td className="td text-sm">{r.CurrentRider||'—'}</td>
                    <td className="td">{r.TotalPayments}</td>
                    <td className="td font-black text-green-700">{Number(r.TotalCollected).toLocaleString()}</td>
                    <td className="td text-xs text-gray-400">{r.LastPayment?.split('T')[0]||'—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr><td className="td font-bold text-gray-500 text-xs" colSpan="6">GRAND TOTAL</td><td className="td font-black text-green-700 text-base">{totalBike.toLocaleString()} RWF</td><td/></tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
