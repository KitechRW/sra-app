import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try { await login(form.email, form.password); navigate('/') }
    catch (err) { setError(err.response?.data?.error || 'Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy to-navy-mid flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',backgroundSize:'44px 44px'}}/>
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><Shield size={32} className="text-navy"/></div>
          <h1 className="text-2xl font-black text-white">Secure Ride Alliance</h1>
          <p className="text-gold text-xs font-semibold tracking-widest mt-1">RWANDA · PLATFORM v2.0</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-navy mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-5">Sign in to your account</p>
          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-4 text-sm"><AlertCircle size={15}/>{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
              <input className="input" type="email" placeholder="john.doe@akadomo.rw" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPwd?'text':'password'} placeholder="••••••••" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
                <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPwd?<EyeOff size={15}/>:<Eye size={15}/>}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-navy text-white font-bold py-2.5 rounded-lg hover:bg-navy-mid transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          {/* <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-2">Demo credentials</p>
            <button onClick={()=>setForm({email:'admin@secureridealliance.rw',password:'admin123'})}
              className="w-full text-xs bg-navy/5 hover:bg-navy/10 text-navy font-semibold py-2 rounded-lg transition-all">
              Admin → admin@secureridealliance.rw / admin123
            </button>
          </div> */}
        </div>
      </div>
    </div>
  )
}
