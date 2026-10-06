import { useState, useEffect } from 'react'
import axios from 'axios'
import Modal from '../components/Modal'
import { Plus, Search, Pencil, Trash2, Bike, AlertTriangle } from 'lucide-react'

const EMPTY = { OwnerBikeID:'', BikeModel:'', BikeType:'', BikeChassis:'', BikePlate:'', AuthorizationStartDate:'', AuthorizationEndDate:'', InsuranceStartDate:'', InsuranceEndDate:'' }

const statusBadge = (s) => s==='active' ? <span className="badge-active">Active</span> : s==='inactive' ? <span className="badge-inactive">Inactive</span> : <span className="badge-expired">Suspended</span>
const docBadge = (s) => s==='valid' ? <span className="badge-valid">Valid</span> : s==='expiring' ? <span className="badge-expiring">Expiring</span> : <span className="badge-expired">Expired</span>

export default function BikesPage() {
  const [bikes, setBikes]     = useState([])
  const [clients, setClients] = useState([])
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [modal, setModal]     = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    axios.get('/api/bikes').then(r => setBikes(r.data))
    axios.get('/api/clients').then(r => setClients(r.data))
  }, [])

  const openAdd  = () => { setForm(EMPTY); setError(''); setModal('add') }
  const openEdit = (b) => {
    setForm({
      OwnerBikeID: b.OwnerBikeID, BikeModel: b.BikeModel||'', BikeType: b.BikeType||'',
      BikeChassis: b.BikeChassis||'', BikePlate: b.BikePlate||'',
      AuthorizationStartDate: b.AuthorizationStartDate?.split('T')[0]||'',
      AuthorizationEndDate:   b.AuthorizationEndDate?.split('T')[0]||'',
      InsuranceStartDate:     b.InsuranceStartDate?.split('T')[0]||'',
      InsuranceEndDate:       b.InsuranceEndDate?.split('T')[0]||'',
    })
    setSelected(b); setError(''); setModal('edit')
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      if (modal==='add') { const {data} = await axios.post('/api/bikes', form); setBikes(p=>[data,...p]) }
      else { const {data} = await axios.patch(`/api/bikes/${selected.BikeID}`, form); setBikes(p=>p.map(b=>b.BikeID===selected.BikeID?{...b,...data}:b)) }
      setModal(null)
    } catch(err) { setError(err.response?.data?.error||'Error occurred') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this bike?')) return
    await axios.delete(`/api/bikes/${id}`)
    setBikes(p=>p.filter(b=>b.BikeID!==id))
  }

  const filtered = bikes.filter(b => {
    const s = search.toLowerCase()
    const match = b.BikePlate?.toLowerCase().includes(s) || b.BikeModel?.toLowerCase().includes(s) || b.OwnerName?.toLowerCase().includes(s) || b.BikeChassis?.toLowerCase().includes(s)
    return match && (filter==='all' || b.Status===filter)
  })

  const inp = (label, name, type='text', placeholder='', required=false) => (
    <div key={name}>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}{required && ' *'}</label>
      <input className="input" type={type} placeholder={placeholder} value={form[name]||''} onChange={e=>setForm({...form,[name]:e.target.value})} required={required}/>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-black text-navy">Bikes</h2><p className="text-xs text-gray-400">All registered motorcycles</p></div>
        <button onClick={openAdd} className="btn-navy"><Plus size={15}/>Add Bike</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Search plate, model, owner..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="flex gap-1.5">
          {['all','active','inactive'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter===f?'bg-navy text-white':'bg-white border border-gray-200 text-gray-600'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Plate','Model','Type','Chassis','Owner','Auth Period','Insurance Period','Auth Status','Ins Status','Status','Actions'].map(h=><th key={h} className="th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.BikeID} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="td font-bold text-navy">{b.BikePlate}</td>
                  <td className="td text-sm">{b.BikeModel||'—'}</td>
                  <td className="td text-xs text-gray-500">{b.BikeType||'—'}</td>
                  <td className="td text-xs font-mono text-gray-500">{b.BikeChassis||'—'}</td>
                  <td className="td text-sm">{b.OwnerName}</td>
                  <td className="td text-xs text-gray-500 whitespace-nowrap">{b.AuthorizationStartDate?.split('T')[0]||'—'} → {b.AuthorizationEndDate?.split('T')[0]||'—'}</td>
                  <td className="td text-xs text-gray-500 whitespace-nowrap">{b.InsuranceStartDate?.split('T')[0]||'—'} → {b.InsuranceEndDate?.split('T')[0]||'—'}</td>
                  <td className="td">{docBadge(b.AuthorizationStatus)}</td>
                  <td className="td">{docBadge(b.InsuranceStatus)}</td>
                  <td className="td">{statusBadge(b.Status)}</td>
                  <td className="td"><div className="flex gap-1">
                    <button onClick={()=>openEdit(b)} className="p-1.5 text-navy hover:bg-navy/5 rounded-lg"><Pencil size={14}/></button>
                    <button onClick={()=>del(b.BikeID)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && <div className="text-center py-12 text-gray-400"><Bike size={32} className="mx-auto mb-2 opacity-30"/><p className="text-sm">No bikes found</p></div>}
        </div>
      </div>

      {(modal==='add'||modal==='edit') && (
        <Modal title={modal==='add'?'Add New Bike':'Edit Bike'} onClose={()=>setModal(null)} size="lg">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Owner */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Owner (Client) *</label>
              <select className="input" value={form.OwnerBikeID} onChange={e=>setForm({...form,OwnerBikeID:e.target.value})} required>
                <option value="">Select client...</option>
                {clients.map(c=><option key={c.ClientID} value={c.ClientID}>{c.OwnerName}</option>)}
              </select>
            </div>
            {/* Bike info */}
            <div className="grid sm:grid-cols-3 gap-3">
              {inp('Bike Model','BikeModel','text','Spiro E3')}
              {inp('Bike Type','BikeType','text','Electric / Petrol')}
              {inp('Bike Plate *','BikePlate','text','RAB XXX X',true)}
            </div>
            <div>{inp('Chassis Number','BikeChassis','text','CH-SRA-001')}</div>
            {/* Authorization */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Authorization Period</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {inp('Start Date','AuthorizationStartDate','date')}
                {inp('End Date','AuthorizationEndDate','date')}
              </div>
            </div>
            {/* Insurance */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Insurance Period</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {inp('Start Date','InsuranceStartDate','date')}
                {inp('End Date','InsuranceEndDate','date')}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button type="button" onClick={()=>setModal(null)} className="btn-outline">Cancel</button>
              <button type="submit" disabled={loading} className="btn-navy">{loading?'Saving...':modal==='add'?'Add Bike':'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
