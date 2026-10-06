import { useState, useEffect } from 'react'
import axios from 'axios'
import Modal from '../components/Modal'
import { Plus, Search, Trash2, CreditCard, Filter } from 'lucide-react'

const currentWeek = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  return Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7)
}

const EMPTY = { BikeID:'', RiderRegistrationID:'', AmountVersement:'', VersementDate: new Date().toISOString().split('T')[0], WeekVersement: currentWeek() }

export default function VersementPage() {
  const [versements, setVersements] = useState([])
  const [bikes, setBikes]           = useState([])
  const [riders, setRiders]         = useState([])
  const [filteredRiders, setFilteredRiders] = useState([])
  const [search, setSearch]         = useState('')
  const [weekFilter, setWeekFilter] = useState('')
  const [modal, setModal]           = useState(false)
  const [form, setForm]             = useState(EMPTY)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    axios.get('/api/versements').then(r => setVersements(r.data))
    axios.get('/api/bikes').then(r => setBikes(r.data))
    axios.get('/api/riders').then(r => setRiders(r.data))
  }, [])

  // Filter riders by selected bike
  useEffect(() => {
    if (form.BikeID) setFilteredRiders(riders.filter(r=>r.BikeID==form.BikeID && r.Status==='active'))
    else setFilteredRiders([])
    setForm(f=>({...f, RiderRegistrationID:''}))
  }, [form.BikeID, riders])

  const openModal = () => { setForm(EMPTY); setError(''); setModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const {data} = await axios.post('/api/versements', form)
      setVersements(p=>[data,...p])
      setModal(false)
    } catch(err) { setError(err.response?.data?.error||'Error') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this versement?')) return
    await axios.delete(`/api/versements/${id}`)
    setVersements(p=>p.filter(v=>v.VersementID!==id))
  }

  const fetch = async () => {
    const params = {}
    if (weekFilter) params.week = weekFilter
    const {data} = await axios.get('/api/versements', { params })
    setVersements(data)
  }
  useEffect(() => { fetch() }, [weekFilter])

  const filtered = versements.filter(v => {
    const s = search.toLowerCase()
    return v.BikePlate?.toLowerCase().includes(s) || v.RiderName?.toLowerCase().includes(s) || v.BikeModel?.toLowerCase().includes(s)
  })

  const totalAmount = filtered.reduce((s,v)=>s+Number(v.AmountVersement),0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-black text-navy">Versements</h2><p className="text-xs text-gray-400">Rider payment records</p></div>
        <button onClick={openModal} className="btn-navy"><Plus size={15}/>Record Payment</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center"><div className="text-2xl font-black text-navy">{filtered.length}</div><div className="text-xs text-gray-400 mt-1">Total Records</div></div>
        <div className="card text-center"><div className="text-2xl font-black text-green-700">{totalAmount.toLocaleString()}</div><div className="text-xs text-gray-400 mt-1">Total RWF</div></div>
        <div className="card text-center"><div className="text-2xl font-black text-navy">{[...new Set(filtered.map(v=>v.BikeID))].length}</div><div className="text-xs text-gray-400 mt-1">Bikes Paying</div></div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Search plate, rider, model..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400 flex-shrink-0"/>
          <input className="input w-36" type="number" placeholder="Week number" value={weekFilter} onChange={e=>setWeekFilter(e.target.value)} min="1" max="53"/>
          {weekFilter && <button onClick={()=>setWeekFilter('')} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['#','Bike Plate','Model','Rider','Amount (RWF)','Week','Versement Date','DateTime','Actions'].map(h=><th key={h} className="th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.VersementID} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="td text-xs font-mono text-gray-400">#{v.VersementID}</td>
                  <td className="td font-bold text-navy">{v.BikePlate}</td>
                  <td className="td text-xs text-gray-500">{v.BikeModel}</td>
                  <td className="td text-sm">{v.RiderName}</td>
                  <td className="td font-bold text-green-700">{Number(v.AmountVersement).toLocaleString()}</td>
                  <td className="td"><span className="bg-navy/10 text-navy text-xs font-bold px-2 py-0.5 rounded-full">W{v.WeekVersement}</span></td>
                  <td className="td text-xs text-gray-500">{v.VersementDate?.split('T')[0]}</td>
                  <td className="td text-xs text-gray-400">{v.DateTime ? new Date(v.DateTime).toLocaleString() : '—'}</td>
                  <td className="td"><button onClick={()=>del(v.VersementID)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button></td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr><td className="td text-xs font-bold text-gray-500" colSpan="4">TOTAL ({filtered.length} records)</td><td className="td font-black text-green-700">{totalAmount.toLocaleString()}</td><td colSpan="4"/></tr>
              </tfoot>
            )}
          </table>
          {filtered.length===0 && <div className="text-center py-12 text-gray-400"><CreditCard size={32} className="mx-auto mb-2 opacity-30"/><p className="text-sm">No versements found</p></div>}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <Modal title="Record Payment" subtitle="Versement entry" onClose={()=>setModal(false)}>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Bike *</label>
              <select className="input" value={form.BikeID} onChange={e=>setForm({...form,BikeID:e.target.value})} required>
                <option value="">Select bike...</option>
                {bikes.map(b=><option key={b.BikeID} value={b.BikeID}>{b.BikePlate} — {b.BikeModel} ({b.OwnerName})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Rider *</label>
              <select className="input" value={form.RiderRegistrationID} onChange={e=>setForm({...form,RiderRegistrationID:e.target.value})} required disabled={!form.BikeID}>
                <option value="">{form.BikeID ? 'Select rider...' : 'Select bike first'}</option>
                {filteredRiders.map(r=><option key={r.RiderRegistrationID} value={r.RiderRegistrationID}>{r.Name} — {r.NationalID}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Amount (RWF) *</label><input className="input" type="number" placeholder="15000" value={form.AmountVersement} onChange={e=>setForm({...form,AmountVersement:e.target.value})} required min="1"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Versement Date *</label><input className="input" type="date" value={form.VersementDate} onChange={e=>setForm({...form,VersementDate:e.target.value})} required/></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Week Number *</label><input className="input" type="number" placeholder="e.g. 28" value={form.WeekVersement} onChange={e=>setForm({...form,WeekVersement:e.target.value})} required min="1" max="53"/></div>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button type="button" onClick={()=>setModal(false)} className="btn-outline">Cancel</button>
              <button type="submit" disabled={loading} className="btn-navy">{loading?'Saving...':'Record Payment'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
