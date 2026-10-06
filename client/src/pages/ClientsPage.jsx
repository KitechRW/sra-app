import { useState, useEffect } from 'react'
import axios from 'axios'
import Modal from '../components/Modal'
import { Plus, Search, Pencil, Trash2, Eye, Users, Building } from 'lucide-react'

const EMPTY = { OwnerName:'', TIN:'', OwnerPhone:'', OwnerEmail:'', OwnerAddress:'', RegistrationNo:'' }

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // 'add'|'edit'|'view'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetch() }, [])
  const fetch = () => axios.get('/api/clients').then(r => setClients(r.data))

  const openAdd  = () => { setForm(EMPTY); setError(''); setModal('add') }
  const openEdit = (c) => { setForm({ OwnerName:c.OwnerName, TIN:c.TIN||'', OwnerPhone:c.OwnerPhone||'', OwnerEmail:c.OwnerEmail||'', OwnerAddress:c.OwnerAddress||'', RegistrationNo:c.RegistrationNo||'' }); setSelected(c); setError(''); setModal('edit') }
  const openView = (c) => { setSelected(c); setModal('view') }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      if (modal === 'add') { const {data} = await axios.post('/api/clients', form); setClients(p=>[data,...p]) }
      else { const {data} = await axios.patch(`/api/clients/${selected.ClientID}`, form); setClients(p=>p.map(c=>c.ClientID===selected.ClientID?{...c,...data}:c)) }
      setModal(null)
    } catch(err) { setError(err.response?.data?.error||'Error occurred') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this client and all their bikes?')) return
    await axios.delete(`/api/clients/${id}`)
    setClients(p=>p.filter(c=>c.ClientID!==id))
  }

  const filtered = clients.filter(c =>
    c.OwnerName?.toLowerCase().includes(search.toLowerCase()) ||
    c.TIN?.includes(search) || c.OwnerPhone?.includes(search)
  )


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-black text-navy">Clients</h2><p className="text-xs text-gray-400">Bike owners registered with SRA</p></div>
        <button onClick={openAdd} className="btn-navy"><Plus size={15}/>Add Client</button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Search by name, TIN, phone..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Owner Name','TIN','Phone','Email','Address','Reg No','Bikes','Actions'].map(h=><th key={h} className="th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.ClientID} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="td"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{c.OwnerName?.[0]}</div><span className="font-semibold text-navy">{c.OwnerName}</span></div></td>
                  <td className="td text-xs text-gray-500 font-mono">{c.TIN||'—'}</td>
                  <td className="td text-xs">{c.OwnerPhone||'—'}</td>
                  <td className="td text-xs text-gray-500">{c.OwnerEmail||'—'}</td>
                  <td className="td text-xs text-gray-500">{c.OwnerAddress||'—'}</td>
                  <td className="td text-xs">{c.RegistrationNo||'—'}</td>
                  <td className="td"><span className="badge-active">{c.BikeCount||0} bikes</span></td>
                  <td className="td"><div className="flex gap-1">
                    <button onClick={()=>openView(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={14}/></button>
                    <button onClick={()=>openEdit(c)} className="p-1.5 text-navy hover:bg-navy/5 rounded-lg"><Pencil size={14}/></button>
                    <button onClick={()=>del(c.ClientID)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && <div className="text-center py-12 text-gray-400"><Users size={32} className="mx-auto mb-2 opacity-30"/><p className="text-sm">No clients found</p></div>}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal==='add'||modal==='edit') && (
        <Modal title={modal==='add'?'Add New Client':'Edit Client'} subtitle="Bike owner information" onClose={()=>setModal(null)} size="lg">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Owner Name *</label><input className="input" placeholder="Jean Paul Niyonzima" value={form.OwnerName} onChange={e=>setForm({...form,OwnerName:e.target.value})} required/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">TIN</label><input className="input" placeholder="101234567" value={form.TIN} onChange={e=>setForm({...form,TIN:e.target.value})}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Registration No</label><input className="input" placeholder="REG-001" value={form.RegistrationNo} onChange={e=>setForm({...form,RegistrationNo:e.target.value})}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label><input className="input" placeholder="+250 7XX XXX XXX" value={form.OwnerPhone} onChange={e=>setForm({...form,OwnerPhone:e.target.value})}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Email</label><input className="input" type="email" placeholder="owner@email.com" value={form.OwnerEmail} onChange={e=>setForm({...form,OwnerEmail:e.target.value})}/></div>
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Address</label><input className="input" placeholder="Kimironko, Kigali" value={form.OwnerAddress} onChange={e=>setForm({...form,OwnerAddress:e.target.value})}/></div>
            <div className="sm:col-span-2 flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button type="button" onClick={()=>setModal(null)} className="btn-outline">Cancel</button>
              <button type="submit" disabled={loading} className="btn-navy">{loading?'Saving...':modal==='add'?'Add Client':'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Modal */}
      {modal==='view' && selected && (
        <Modal title={selected.OwnerName} subtitle={`ClientID: ${selected.ClientID}`} onClose={()=>setModal(null)}>
          <div className="space-y-2">
            {[['TIN',selected.TIN],['Registration No',selected.RegistrationNo],['Phone',selected.OwnerPhone],['Email',selected.OwnerEmail],['Address',selected.OwnerAddress],['Number of Bikes',selected.BikeCount]].map(([l,v])=>(
              <div key={l} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400 font-semibold">{l}</span>
                <span className="text-sm font-semibold text-navy">{v||'—'}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button onClick={()=>openEdit(selected)} className="btn-navy flex-1 justify-center"><Pencil size={14}/>Edit</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
