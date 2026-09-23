import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, Loader2, Sprout } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { apiErrorMessage } from '../services/api.js'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'user', organization_name: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const payload = { ...form }
      if (payload.role !== 'business') delete payload.organization_name
      const user = await register(payload)
      navigate(user.role === 'business' ? '/business-dashboard' : '/dashboard', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to create account.'))
    } finally {
      setLoading(false)
    }
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

        <h1 className="font-display text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-mist text-sm mb-7">Start building your sustainability profile.</p>

        {error && (
          <div className="mb-5 rounded-lg border border-red-400/30 bg-red-400/10 text-red-300 text-sm px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {[
              { key: 'user', label: 'Personal' },
              { key: 'business', label: 'Business' },
            ].map((opt) => (
              <button
                type="button"
                key={opt.key}
                onClick={() => setForm({ ...form, role: opt.key })}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                  form.role === opt.key
                    ? 'border-emerald-400 text-emerald-300 bg-emerald-400/10'
                    : 'border-white/10 text-mist hover:border-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <label className="label-mono block mb-2">Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-offwhite focus:border-emerald-400/60 outline-none transition-colors"
              placeholder="Jordan Ahmed"
            />
          </div>

          {form.role === 'business' && (
            <div>
              <label className="label-mono block mb-2">Organization name</label>
              <input
                value={form.organization_name}
                onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-offwhite focus:border-emerald-400/60 outline-none transition-colors"
                placeholder="Northfield Logistics Park"
              />
            </div>
          )}

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
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-offwhite focus:border-emerald-400/60 outline-none transition-colors"
              placeholder="At least 8 characters"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-mist mt-7 text-center">
          Already have an account? <Link to="/login" className="text-emerald-400 hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
