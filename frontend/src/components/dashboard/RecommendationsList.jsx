import React from 'react'
import { Lightbulb } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'

const PRIORITY_STYLES = {
  high: 'border-amber-400/30 text-amber-300',
  medium: 'border-emerald-400/30 text-emerald-300',
  low: 'border-white/15 text-mist',
}

export default function RecommendationsList({ recommendations }) {
  if (!recommendations?.length) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="No recommendations yet"
        description="Log a few waste records or scans and personalized AI recommendations will appear here."
      />
    )
  }

  return (
    <div className="space-y-4">
      {recommendations.map((r) => (
        <div key={r.id} className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.05]">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-sm text-offwhite">{r.title}</p>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[r.priority] || PRIORITY_STYLES.low}`}>
              {r.priority}
            </span>
          </div>
          <p className="text-sm text-mist leading-relaxed">{r.description}</p>
        </div>
      ))}
    </div>
  )
}
