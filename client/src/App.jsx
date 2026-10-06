import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout        from './components/Layout'
import LoginPage     from './pages/LoginPage'
import Dashboard     from './pages/Dashboard'
import ClientsPage   from './pages/ClientsPage'
import BikesPage     from './pages/BikesPage'
import RidersPage    from './pages/RidersPage'
import VersementPage from './pages/VersementPage'
import ReportsPage   from './pages/ReportsPage'

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin"/></div>
  return user ? children : <Navigate to="/login"/>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/"/> : <LoginPage/>}/>
      <Route path="/" element={<Guard><Layout/></Guard>}>
        <Route index            element={<Dashboard/>}/>
        <Route path="clients"   element={<ClientsPage/>}/>
        <Route path="bikes"     element={<BikesPage/>}/>
        <Route path="riders"    element={<RidersPage/>}/>
        <Route path="versements"element={<VersementPage/>}/>
        <Route path="reports"   element={<ReportsPage/>}/>
      </Route>
    </Routes>
  )
}

export default function App() {
  return <AuthProvider><BrowserRouter><AppRoutes/></BrowserRouter></AuthProvider>
}
