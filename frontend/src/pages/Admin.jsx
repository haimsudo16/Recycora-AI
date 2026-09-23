import React, { useEffect, useState } from 'react'
import { Users, ScanLine, Scale, Recycle, Percent, UserCog, ShieldBan, ShieldCheck } from 'lucide-react'
import MetricCard from '../components/dashboard/MetricCard.jsx'
import { SkeletonCard } from '../components/ui/Skeleton.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { adminApi, apiErrorMessage } from '../services/api.js'
import { useToast } from '../components/ui/Toast.jsx'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Admin() {
  const { user: currentUser } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [users, setUsers] = useState([])
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { push } = useToast()

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([adminApi.analytics(), adminApi.users(), adminApi.scans(10)])
      .then(([a, u, s]) => {
        setAnalytics(a.data)
        setUsers(u.data)
        setScans(s.data)
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load admin data.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleUser = async (id) => {
    try {
      await adminApi.toggleUserActive(id)
      push('User status updated.')
      load()
    } catch (err) {
      push(apiErrorMessage(err, 'Could not update this user.'), 'error')
    }
  }

  if (loading) {
    return (
      <div className="section-pad py-12 max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (error) {
    return <div className="section-pad py-16 max-w-xl mx-auto"><ErrorState message={error} onRetry={load} /></div>
  }

  return (
    <div className="section-pad py-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="label-mono text-emerald-400 mb-2 flex items-center gap-2"><UserCog size={13} /> Admin Control Center</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">System Overview</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Total Users" value={analytics.total_users} icon={Users} decimals={0} />
        <MetricCard label="Active Users (30d)" value={analytics.active_users_30d} icon={Users} decimals={0} />
        <MetricCard label="Total Scans" value={analytics.total_scans} icon={ScanLine} decimals={0} />
        <MetricCard label="Total Waste Tracked" value={analytics.total_waste_tracked_kg} suffix="kg" icon={Scale} />
        <MetricCard label="Total Recycled" value={analytics.total_recycled_kg} suffix="kg" icon={Recycle} />
        <MetricCard label="Avg. Recycling Rate" value={analytics.avg_recycling_rate} suffix="%" icon={Percent} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <p className="label-mono mb-4">User Management</p>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm truncate">{u.name}</p>
                  <p className="text-xs text-mist truncate">{u.email} · <span className="capitalize">{u.role}</span></p>
                </div>
                {u.id !== currentUser.id && (
                  <button
                    onClick={() => toggleUser(u.id)}
                    className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-mist hover:text-offwhite hover:border-emerald-400/40 flex items-center gap-1 shrink-0"
                  >
                    <ShieldCheck size={12} /> Toggle Active
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6">
          <p className="label-mono mb-4">Recent Scans (All Users)</p>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {scans.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3">
                <div>
                  <p className="text-sm">{s.detected_object}</p>
                  <p className="text-xs text-mist capitalize">{s.category} · {s.material}</p>
                </div>
                <span className="font-mono text-xs text-emerald-400">{s.confidence.toFixed(1)}%</span>
              </div>
            ))}
            {scans.length === 0 && <p className="text-mist text-sm">No scans recorded yet.</p>}
          </div>
        </div>
      </div>

      <div className="mt-6 glass-panel p-6 flex items-center gap-3 text-sm text-mist">
        <ShieldBan size={16} className="text-emerald-400 shrink-0" />
        Role counts — Users: {analytics.role_counts.user || 0} · Business: {analytics.role_counts.business || 0} · Admin: {analytics.role_counts.admin || 0}
        · Recycling Centers: {analytics.total_recycling_centers} · Recommendations Generated: {analytics.total_recommendations}
      </div>
    </div>
  )
}
