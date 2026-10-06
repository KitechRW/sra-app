import { useState, useEffect } from 'react'
import axios from 'axios'
import Modal from '../components/Modal'
import { Plus, Search, Pencil, Trash2, UserCheck } from 'lucide-react'

const EMPTY = { BikeID:'', Name:'', NationalID:'', Phone:'', PermitNumber:'' }

export default function RidersPage() {
  const [riders, setRiders] = useState([])
  const [bikes, setBikes]   = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]     = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    axios.get('/api/riders').then(r => setRiders(r.data))
    axios.get('/api/bikes').then(r => setBikes(r.data))
  }, [])

  const openAdd  = () => { setForm(EMPTY); setError(''); setModal('add') }
  const openEdit = (r) => { setForm({ BikeID:r.BikeID, Name:r.Name, NationalID:r.NationalID, Phone:r.Phone||'', PermitNumber:r.PermitNumber||'' }); setSelected(r); setError(''); setModal('edit') }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      if (modal==='add') { const {data} = await axios.post('/api/riders', form); setRiders(p=>[data,...p]) }
      else { const {data} = await axios.patch(`/api/riders/${selected.RiderRegistrationID}`, form); setRiders(p=>p.map(r=>r.RiderRegistrationID===selected.RiderRegistrationID?{...r,...data}:r)) }
      setModal(null)
    } catch(err) { setError(err.response?.data?.error||'Error') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this rider?')) return
    await axios.delete(`/api/riders/${id}`)
    setRiders(p=>p.filter(r=>r.RiderRegistrationID!==id))
  }

  const toggleStatus = async (r) => {
    const newStatus = r.Status==='active'?'inactive':'active'
    await axios.patch(`/api/riders/${r.RiderRegistrationID}`, { Status: newStatus })
    setRiders(p=>p.map(x=>x.RiderRegistrationID===r.RiderRegistrationID?{...x,Status:newStatus}:x))
  }

  const filtered = riders.filter(r => {
    const s = search.toLowerCase()
    return r.Name?.toLowerCase().includes(s) || r.NationalID?.includes(s) || r.Phone?.includes(s) || r.BikePlate?.toLowerCase().includes(s) || r.PermitNumber?.toLowerCase().includes(s)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-black text-navy">Rider Registration</h2><p className="text-xs text-gray-400">Who rides each bike</p></div>
        <button onClick={openAdd} className="btn-navy"><Plus size={15}/>Register Rider</button>
      </div>

      <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Search name, ID, phone, plate, permit..." value={search} onChange={e=>setSearch(e.target.value)}/></div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Reg ID','Name','National ID','Phone','Permit No','Bike Plate','Bike Model','Owner','Status','Actions'].map(h=><th key={h} className="th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.RiderRegistrationID} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="td text-xs font-mono text-gray-400">#{r.RiderRegistrationID}</td>
                  <td className="td"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{r.Name?.[0]}</div><span className="font-semibold text-navy">{r.Name}</span></div></td>
                  <td className="td text-xs font-mono text-gray-500">{r.NationalID}</td>
                  <td className="td text-xs">{r.Phone||'—'}</td>
                  <td className="td text-xs">{r.PermitNumber||'—'}</td>
                  <td className="td font-bold text-navy">{r.BikePlate}</td>
                  <td className="td text-xs text-gray-500">{r.BikeModel||'—'}</td>
                  <td className="td text-xs text-gray-500">{r.OwnerName}</td>
                  <td className="td">
                    <button onClick={()=>toggleStatus(r)} className={r.Status==='active'?'badge-active cursor-pointer hover:opacity-80':'badge-inactive cursor-pointer hover:opacity-80'}>
                      {r.Status}
                    </button>
                  </td>
                  <td className="td"><div className="flex gap-1">
                    <button onClick={()=>openEdit(r)} className="p-1.5 text-navy hover:bg-navy/5 rounded-lg"><Pencil size={14}/></button>
                    <button onClick={()=>del(r.RiderRegistrationID)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && <div className="text-center py-12 text-gray-400"><UserCheck size={32} className="mx-auto mb-2 opacity-30"/><p className="text-sm">No riders found</p></div>}
        </div>
      </div>

      {(modal==='add'||modal==='edit') && (
        <Modal title={modal==='add'?'Register Rider':'Edit Rider'} onClose={()=>setModal(null)}>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Bike *</label>
              <select className="input" value={form.BikeID} onChange={e=>setForm({...form,BikeID:e.target.value})} required>
                <option value="">Select bike...</option>
                {bikes.map(b=><option key={b.BikeID} value={b.BikeID}>{b.BikePlate} — {b.BikeModel} ({b.OwnerName})</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label><input className="input" placeholder="Alice Uwimana" value={form.Name} onChange={e=>setForm({...form,Name:e.target.value})} required/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">National ID *</label><input className="input" placeholder="1199880012345678" value={form.NationalID} onChange={e=>setForm({...form,NationalID:e.target.value})} required/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label><input className="input" placeholder="+250 7XX XXX XXX" value={form.Phone} onChange={e=>setForm({...form,Phone:e.target.value})}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Permit Number</label><input className="input" placeholder="PERM-001" value={form.PermitNumber} onChange={e=>setForm({...form,PermitNumber:e.target.value})}/></div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button type="button" onClick={()=>setModal(null)} className="btn-outline">Cancel</button>
              <button type="submit" disabled={loading} className="btn-navy">{loading?'Saving...':modal==='add'?'Register':'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
