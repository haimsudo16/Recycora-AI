import React, { useEffect, useState } from 'react'
import { Scale, Recycle, Percent, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import MetricCard from '../components/dashboard/MetricCard.jsx'
import RecommendationsList from '../components/dashboard/RecommendationsList.jsx'
import CategoryDonutChart from '../components/charts/CategoryDonutChart.jsx'
import { SkeletonCard } from '../components/ui/Skeleton.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { businessApi, apiErrorMessage } from '../services/api.js'

const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus }
const TREND_COLOR = { up: 'text-amber-400', down: 'text-emerald-400', flat: 'text-mist' }

function MonthlyHistoryChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#c9d1c7', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
        <YAxis tick={{ fill: '#c9d1c7', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={{ background: '#101412', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#c9d1c7' }}
        />
        <Bar dataKey="total" name="Total (kg)" fill="#28312b" radius={[6, 6, 0, 0]} />
        <Bar dataKey="recycled" name="Recycled (kg)" fill="#4fd68f" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function BusinessDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    businessApi.dashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load the business dashboard.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="section-pad py-12 max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (error) {
    return <div className="section-pad py-16 max-w-xl mx-auto"><ErrorState message={error} onRetry={load} /></div>
  }

  const { organization_name, metrics, monthly_history, category_breakdown, forecast, recommendations } = data

  return (
    <div className="section-pad py-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="label-mono text-emerald-400 mb-2">Business Dashboard</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">{organization_name}</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Waste" value={metrics.total_waste_kg} suffix="kg" icon={Scale} />
        <MetricCard label="Recycled" value={metrics.recycled_kg} suffix="kg" icon={Recycle} />
        <MetricCard label="Recycling Rate" value={metrics.recycling_rate} suffix="%" icon={Percent} />
        <MetricCard
          label="Monthly Change"
          value={metrics.monthly_change_pct}
          suffix="%"
          icon={metrics.monthly_change_pct >= 0 ? TrendingUp : TrendingDown}
          accent={metrics.monthly_change_pct >= 0 ? 'text-amber-400' : 'text-emerald-400'}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 glass-panel p-6">
          <p className="label-mono mb-4">Monthly Waste vs. Recycled</p>
          <MonthlyHistoryChart data={monthly_history} />
        </div>
        <div className="glass-panel p-6">
          <p className="label-mono mb-1">Projected Next Month</p>
          <p className="font-display text-3xl font-bold mb-4">{metrics.projected_next_month_kg} <span className="text-lg text-mist">kg</span></p>
          <p className="text-xs text-mist mb-6">Based on a linear trend projection over your logged records — an estimate, not a guarantee.</p>
          {category_breakdown.length > 0 && (
            <CategoryDonutChart data={category_breakdown.map((c) => ({ category: c.category, quantity: c.total_kg }))} />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="label-mono">AI Waste Forecast (Next {forecast.horizon_days} Days)</p>
          </div>
          {!forecast.sufficient_data ? (
            <p className="text-mist text-sm">{forecast.message}</p>
          ) : (
            <div className="space-y-3">
              {forecast.categories.map((c) => {
                const Icon = TREND_ICON[c.trend]
                return (
                  <div key={c.category} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3">
                    <span className="capitalize text-sm text-offwhite">{c.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-mist">confidence {c.confidence_pct}%</span>
                      <span className={`flex items-center gap-1 font-mono text-sm ${TREND_COLOR[c.trend]}`}>
                        <Icon size={14} /> {c.projected_change_pct > 0 ? '+' : ''}{c.projected_change_pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-mist pt-2">{forecast.methodology}</p>
            </div>
          )}
        </div>

        <div className="glass-panel p-6">
          <p className="label-mono mb-4">AI Recommendations</p>
          <RecommendationsList recommendations={recommendations} />
        </div>
      </div>
    </div>
  )
}
