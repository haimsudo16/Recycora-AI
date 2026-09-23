import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Loader2, Sprout } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { apiErrorMessage } from '../services/api.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'business' ? '/business-dashboard' : from, { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to log in. Check your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role) => {
    if (role === 'user') setForm({ email: 'amara.demo@demo.recycora.ai', password: 'Demo1234!' })
    if (role === 'business') setForm({ email: 'business.demo@demo.recycora.ai', password: 'Demo1234!' })
    if (role === 'admin') setForm({ email: 'admin@demo.recycora.ai', password: 'Admin123!' })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center section-pad py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel p-8 md:p-10"
      >
        <div className="flex items-center gap-2 font-display font-bold text-lg mb-8">
          <span className="w-9 h-9 rounded-lg bg-emerald-400/15 flex items-center justify-center text-emerald-400">
            <Sprout size={18} />
          </span>
          RECYcORA AI
        </div>

        <h1 className="font-display text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-mist text-sm mb-7">Log in to continue tracking your impact.</p>

        {error && (
          <div className="mb-5 rounded-lg border border-red-400/30 bg-red-400/10 text-red-300 text-sm px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-mono block mb-2">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-offwhite focus:border-emerald-400/60 outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label-mono block mb-2">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-offwhite focus:border-emerald-400/60 outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/[0.06]">
          <p className="label-mono mb-3">Try a demo account</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => fillDemo('user')} className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-mist hover:text-offwhite hover:border-emerald-400/40">
              Personal
            </button>
            <button onClick={() => fillDemo('business')} className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-mist hover:text-offwhite hover:border-emerald-400/40">
              Business
            </button>
            <button onClick={() => fillDemo('admin')} className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-mist hover:text-offwhite hover:border-emerald-400/40">
              Admin
            </button>
          </div>
        </div>

        <p className="text-sm text-mist mt-7 text-center">
          Don't have an account? <Link to="/register" className="text-emerald-400 hover:underline">Create one</Link>
        </p>
      </motion.div>
    </div>
  )
}
