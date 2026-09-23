import React from 'react'
import { Link } from 'react-router-dom'
import { ScanLine } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import { scanImageUrl } from '../../services/api.js'

export default function RecentScansList({ scans }) {
  if (!scans?.length) {
    return (
      <EmptyState
        icon={ScanLine}
        title="No scans yet"
        description="Scan your first item to see it appear here."
        action={<Link to="/scanner" className="btn-primary text-sm mt-1">Open Scanner</Link>}
      />
    )
  }

  return (
    <div className="space-y-3">
      {scans.map((s) => (
        <div key={s.id} className="flex items-center gap-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-3">
          <img
            src={scanImageUrl(s)}
            alt={s.detected_object}
            className="w-12 h-12 rounded-lg object-cover border border-white/10"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{s.detected_object}</p>
            <p className="text-xs text-mist capitalize">{s.material}</p>
          </div>
          <span className="font-mono text-xs text-emerald-400">{s.confidence.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}
