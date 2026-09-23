import React from 'react'
import { Award, Lock, ScanLine, Recycle, TrendingDown, Leaf, Trophy } from 'lucide-react'

const ICONS = {
  'scan-line': ScanLine,
  recycle: Recycle,
  'trending-down': TrendingDown,
  leaf: Leaf,
  trophy: Trophy,
}

export default function AchievementsPanel({ achievements, ecoPoints }) {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="label-mono mb-1">Eco Points</p>
          <p className="font-display text-3xl font-bold">{ecoPoints?.toLocaleString?.() ?? ecoPoints}</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-lime-300/10 flex items-center justify-center text-lime-300">
          <Trophy size={20} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {achievements.map((a) => {
          const Icon = ICONS[a.icon] || Award
          return (
            <div
              key={a.id}
              title={a.description}
              className={`rounded-xl p-4 flex flex-col items-center text-center gap-2 border ${
                a.earned ? 'border-emerald-400/30 bg-emerald-400/[0.06]' : 'border-white/[0.06] bg-white/[0.02] opacity-60'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${a.earned ? 'bg-emerald-400/15 text-emerald-400' : 'bg-white/5 text-mist'}`}>
                {a.earned ? <Icon size={16} /> : <Lock size={14} />}
              </div>
              <p className="text-xs font-medium text-offwhite leading-tight">{a.name}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
