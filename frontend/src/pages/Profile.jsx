import React, { useEffect, useState } from 'react'
import { User, Mail, Shield, Calendar, ScanLine, Award } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { scanApi, analyticsApi, scanImageUrl, apiErrorMessage } from '../services/api.js'
import { SkeletonCard } from '../components/ui/Skeleton.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import AchievementsPanel from '../components/dashboard/AchievementsPanel.jsx'

export default function Profile() {
  const { user } = useAuth()
  const [scans, setScans] = useState([])
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([scanApi.list(20), analyticsApi.achievements()])
      .then(([s, a]) => {
        setScans(s.data)
        setAchievements(a.data)
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your profile.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="section-pad py-10 max-w-5xl mx-auto">
      <div className="glass-panel p-8 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <div className="w-20 h-20 rounded-full bg-emerald-400/15 text-emerald-300 flex items-center justify-center text-3xl font-display font-bold shrink-0">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{user?.name}</h1>
          <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 mt-3 text-sm text-mist">
            <span className="flex items-center gap-1.5"><Mail size={13} /> {user?.email}</span>
            <span className="flex items-center gap-1.5 capitalize"><Shield size={13} /> {user?.role}</span>
            <span className="flex items-center gap-1.5">
              <Calendar size={13} /> Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="font-display text-3xl font-bold text-emerald-400">{user?.eco_points}</p>
          <p className="label-mono">Eco Points</p>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <SkeletonCard /><SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-panel p-6">
            <p className="label-mono mb-4 flex items-center gap-2"><ScanLine size={14} /> Scan History</p>
            {scans.length === 0 ? (
              <EmptyState icon={ScanLine} title="No scans yet" description="Your AI scan history will appear here." />
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {scans.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-3">
                    <img
                      src={scanImageUrl(s)}
                      alt={s.detected_object}
                      className="w-10 h-10 rounded-lg object-cover border border-white/10"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{s.detected_object}</p>
                      <p className="text-xs text-mist">{new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="font-mono text-xs text-emerald-400">{s.confidence.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="label-mono mb-4 flex items-center gap-2"><Award size={14} /> Achievements</p>
            <AchievementsPanel achievements={achievements} ecoPoints={user?.eco_points} />
          </div>
        </div>
      )}
    </div>
  )
}
