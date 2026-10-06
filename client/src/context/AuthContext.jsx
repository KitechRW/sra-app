import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
const Ctx = createContext()
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = localStorage.getItem('sra_token'), u = localStorage.getItem('sra_user')
    if (t && u) { setUser(JSON.parse(u)); axios.defaults.headers.common['Authorization'] = `Bearer ${t}` }
    setLoading(false)
  }, [])
  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password })
    localStorage.setItem('sra_token', data.token)
    localStorage.setItem('sra_user', JSON.stringify(data.user))
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user); return data.user
  }
  const logout = () => {
    localStorage.removeItem('sra_token'); localStorage.removeItem('sra_user')
    delete axios.defaults.headers.common['Authorization']; setUser(null)
  }
  return <Ctx.Provider value={{ user, login, logout, loading }}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx)
