import { useState } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@cafe.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('email', res.data.email)
      navigate('/admin')
    } catch (e) {
      setError(e?.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-cream to-coffee-50">
      <div className="w-full max-w-md card animate-fade">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-coffee-600 text-white flex items-center justify-center">☕</div>
          <h1 className="text-2xl font-semibold">CafeConnect Admin</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="admin@cafe.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <div className="text-red-600">{error}</div>}
          <button className="btn w-full">Login</button>
        </form>
      </div>
    </div>
  )
}
