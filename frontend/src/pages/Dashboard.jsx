import React, { useEffect, useState } from 'react'
import { Scale, Recycle, Percent, Award, Info } from 'lucide-react'
import MetricCard from '../components/dashboard/MetricCard.jsx'
import ScoreBreakdown from '../components/dashboard/ScoreBreakdown.jsx'
import RecentScansList from '../components/dashboard/RecentScansList.jsx'
import RecommendationsList from '../components/dashboard/RecommendationsList.jsx'
import AchievementsPanel from '../components/dashboard/AchievementsPanel.jsx'
import WeeklyTrendChart from '../components/charts/WeeklyTrendChart.jsx'
import MonthlyRateChart from '../components/charts/MonthlyRateChart.jsx'
import CategoryDonutChart from '../components/charts/CategoryDonutChart.jsx'
import { SkeletonCard } from '../components/ui/Skeleton.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { analyticsApi, apiErrorMessage } from '../services/api.js'
import { useAuth } from '../hooks/useAuth.jsx'
import LogWasteModal from '../components/dashboard/LogWasteModal.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      analyticsApi.dashboard(),
      analyticsApi.recommendations(),
      analyticsApi.achievements(),
    ])
      .then(([d, r, a]) => {
        setDashboard(d.data)
        setRecommendations(r.data)
        setAchievements(a.data)
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your dashboard.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="section-pad py-12 max-w-7xl mx-auto space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
      </div>
    )
  }

  if (error) {
    return (
      <div className="section-pad py-16 max-w-xl mx-auto">
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  const { metrics, weekly_chart, monthly_trend, category_distribution, recent_scans, sustainability_breakdown, is_demo_data } = dashboard

  return (
    <div className="section-pad py-10 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="label-mono text-emerald-400 mb-2">Personal Dashboard</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h1>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary text-sm">
          Log Waste Record
        </button>
      </div>

      {is_demo_data && (
        <div className="mb-8 flex items-center gap-2 text-xs text-mist glass-panel px-4 py-2.5 w-fit">
          <Info size={13} className="text-emerald-400" /> This account is seeded with demo data for exploration.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Waste Tracked" value={metrics.total_waste_kg} suffix="kg" icon={Scale} />
        <MetricCard label="Waste Recycled" value={metrics.recycled_kg} suffix="kg" icon={Recycle} />
        <MetricCard label="Recycling Rate" value={metrics.recycling_rate} suffix="%" icon={Percent} />
        <MetricCard label="Sustainability Score" value={metrics.sustainability_score} suffix="/100" icon={Award} decimals={0} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 glass-panel p-6">
          <p className="label-mono mb-4">This Week's Waste</p>
          <WeeklyTrendChart data={weekly_chart} />
        </div>
        <div className="glass-panel p-6">
          <p className="label-mono mb-4">Category Distribution</p>
          {category_distribution.length ? (
            <CategoryDonutChart data={category_distribution} />
          ) : (
            <EmptyState title="No data yet" description="Log waste records to see your category breakdown." />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 glass-panel p-6">
          <p className="label-mono mb-4">Monthly Recycling Rate</p>
          <MonthlyRateChart data={monthly_trend} />
        </div>
        <ScoreBreakdown score={sustainability_breakdown} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6">
          <p className="label-mono mb-4">Recent AI Scans</p>
          <RecentScansList scans={recent_scans} />
        </div>
        <div className="glass-panel p-6">
          <p className="label-mono mb-4">AI Recommendations</p>
          <RecommendationsList recommendations={recommendations} />
        </div>
        <AchievementsPanel achievements={achievements} ecoPoints={metrics.eco_points} />
      </div>

      <LogWasteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onLogged={() => { setModalOpen(false); load() }}
      />
    </div>
  )
}
