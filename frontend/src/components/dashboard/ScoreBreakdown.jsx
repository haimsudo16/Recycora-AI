import React from 'react'
import { motion } from 'framer-motion'

const ROWS = [
  { key: 'reduction_score', label: 'Waste Reduction' },
  { key: 'recycling_score', label: 'Recycling' },
  { key: 'consistency_score', label: 'Consistency' },
  { key: 'disposal_score', label: 'Responsible Disposal' },
]

export default function ScoreBreakdown({ score }) {
  if (!score) return null
  return (
    <div className="glass-panel p-6">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="label-mono mb-1">Sustainability Score</p>
          <p className="font-display text-4xl font-bold">
            {score.score}<span className="text-lg text-mist">/100</span>
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {ROWS.map((row) => (
          <div key={row.key}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-mist">{row.label}</span>
              <span className="font-mono text-offwhite">{score[row.key]}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score[row.key]}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-400 to-lime-300"
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-mist mt-6">
        Estimated from your logged activity — recycling rate, waste-reduction trend, logging
        consistency, and scan outcomes.
      </p>
    </div>
  )
}
