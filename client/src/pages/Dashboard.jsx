import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Users, Bike, UserCheck, CreditCard, AlertTriangle, TrendingUp, Shield, Calendar } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [weekly, setWeekly] = useState([])
  const [monthly, setMonthly] = useState([])

  useEffect(() => {
    axios.get('/api/dashboard/stats').then(r => setStats(r.data))
    axios.get('/api/reports/weekly').then(r => setWeekly(r.data.slice(0,8).reverse()))
    axios.get('/api/reports/monthly').then(r => setMonthly(r.data.slice(0,6).reverse()))
  }, [])

  const StatCard = ({ label, value, icon: Icon, color, sub }) => (
    <div className="card flex items-center gap-4">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon size={26}/></div>
      <div>
        <div className="text-4xl font-black text-navy">{value ?? '—'}</div>
        <div className="text-base font-semibold text-gray-600 mt-0.5">{label}</div>
        {sub && <div className="text-sm text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )

  const Alert = ({ label, value, color }) => value > 0 ? (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-base font-semibold ${color}`}>
      <AlertTriangle size={18}/>{value} {label}
    </div>
  ) : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-navy">Dashboard</h2>
        <p className="text-base text-gray-400 mt-1">Secure Ride Alliance — Overview</p>
      </div>

      {/* Alerts */}
      {stats && (
        <div className="flex flex-wrap gap-3">
          <Alert label="Insurance Expired"     value={stats.insuranceExpired} color="bg-red-50 text-red-700 border border-red-200"/>
          <Alert label="Insurance Expiring Soon" value={stats.insuranceSoon}  color="bg-yellow-50 text-yellow-700 border border-yellow-200"/>
          <Alert label="Authorization Expired" value={stats.authExpired}      color="bg-red-50 text-red-700 border border-red-200"/>
          <Alert label="Authorization Expiring" value={stats.authSoon}        color="bg-orange-50 text-orange-700 border border-orange-200"/>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clients"   value={stats?.totalClients}  icon={Users}     color="bg-blue-50 text-blue-600"/>
        <StatCard label="Total Bikes"     value={stats?.totalBikes}    icon={Bike}      color="bg-indigo-50 text-indigo-600" sub={`${stats?.activeBikes ?? 0} active`}/>
        <StatCard label="Total Riders"    value={stats?.totalRiders}   icon={UserCheck} color="bg-purple-50 text-purple-600" sub={`${stats?.activeRiders ?? 0} active`}/>
        <StatCard label="Total Collected" value={stats ? `${Number(stats.totalAmount).toLocaleString()} RWF` : '—'} icon={CreditCard} color="bg-green-50 text-green-600" sub={`This week: ${Number(stats?.thisWeekAmount||0).toLocaleString()} RWF`}/>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-bold text-navy text-lg mb-4 flex items-center gap-2"><Calendar size={18}/>Weekly Collections (RWF)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="WeekVersement" tick={{fontSize:13}} tickLine={false} axisLine={false} tickFormatter={w=>`W${w}`}/>
              <YAxis tick={{fontSize:13}} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>[`${Number(v).toLocaleString()} RWF`,'Amount']} contentStyle={{fontSize:14,borderRadius:8}}/>
              <Bar dataKey="TotalAmount" fill="#0F2057" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-bold text-navy text-lg mb-4 flex items-center gap-2"><TrendingUp size={18}/>Monthly Collections (RWF)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="Month" tick={{fontSize:13}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fontSize:13}} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>[`${Number(v).toLocaleString()} RWF`,'Amount']} contentStyle={{fontSize:14,borderRadius:8}}/>
              <Line type="monotone" dataKey="TotalAmount" stroke="#F5A623" strokeWidth={2.5} dot={{fill:'#F5A623',r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly summary table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-navy text-lg">Weekly Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Week','Period','Bikes','Riders','Payments','Total Amount'].map(h=>(
                <th key={h} className="text-left py-3.5 px-4 text-sm font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {weekly.slice().reverse().map(row => (
                <tr key={row.WeekVersement} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3.5 px-4 text-base font-bold text-navy">Week {row.WeekVersement}</td>
                  <td className="py-3.5 px-4 text-sm text-gray-500">{row.WeekStart} → {row.WeekEnd}</td>
                  <td className="py-3.5 px-4 text-base">{row.TotalBikes}</td>
                  <td className="py-3.5 px-4 text-base">{row.TotalRiders}</td>
                  <td className="py-3.5 px-4 text-base">{row.TotalPayments}</td>
                  <td className="py-3.5 px-4 text-base font-bold text-green-700">{Number(row.TotalAmount).toLocaleString()} RWF</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
