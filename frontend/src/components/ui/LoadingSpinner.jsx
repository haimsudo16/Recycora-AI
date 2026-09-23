import React from 'react'
import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ label = 'Loading...', size = 20 }) {
  return (
    <div className="flex items-center gap-3 text-mist">
      <Loader2 size={size} className="animate-spin text-emerald-400" />
      <span className="label-mono">{label}</span>
    </div>
  )
}
