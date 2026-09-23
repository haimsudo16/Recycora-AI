import React from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="glass-panel p-8 flex flex-col items-center text-center gap-4">
      <AlertTriangle className="text-lime-400" size={28} />
      <p className="text-mist max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm">
          <RotateCw size={14} /> Try again
        </button>
      )}
    </div>
  )
}
