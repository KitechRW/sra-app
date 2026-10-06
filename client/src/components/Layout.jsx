import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, Bike, UserCheck, CreditCard, BarChart3, LogOut, Menu, X, Shield } from 'lucide-react'

const nav = [
  { to:'/',          icon:LayoutDashboard, label:'Dashboard'    },
  { to:'/clients',   icon:Users,           label:'Clients'      },
  { to:'/bikes',     icon:Bike,            label:'Bikes'        },
  { to:'/riders',    icon:UserCheck,       label:'Riders'       },
  { to:'/versements',icon:CreditCard,      label:'Versements'   },
  { to:'/reports',   icon:BarChart3,       label:'Reports'      },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-navy text-white">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-navy"/>
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">Secure Ride Alliance</div>
            <div className="text-gold text-[10px] font-semibold tracking-widest uppercase">Rwanda</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to==='/'} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
               ${isActive ? 'bg-gold text-navy' : 'text-white/70 hover:text-white hover:bg-white/10'}`
            }>
            <Icon size={18}/>{label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2 px-3 py-2 mb-1 bg-white/5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center text-navy font-bold text-xs">{user?.name?.[0]}</div>
          <div className="flex-1 min-w-0"><div className="text-xs font-semibold truncate">{user?.name}</div><div className="text-[10px] text-white/40 capitalize">{user?.role}</div></div>
        </div>
        <button onClick={() => { logout(); navigate('/login') }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all">
          <LogOut size={14}/>Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-gray-200"><SidebarContent/></div>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)}/>
          <div className="absolute left-0 top-0 bottom-0 w-56 z-10"><SidebarContent/></div>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"><Menu size={20}/></button>
            <span className="font-black text-navy text-sm">Secure Ride Alliance</span>
          </div>
          <span className="text-xs text-gray-400 hidden md:block">Bike Monitoring Platform v2.0</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4"><Outlet/></main>
      </div>
    </div>
  )
}
