import React from 'react'

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="glass-panel p-10 flex flex-col items-center text-center gap-3">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-emerald-400/10 flex items-center justify-center text-emerald-400">
          <Icon size={22} />
        </div>
      )}
      <h3 className="font-display text-lg text-offwhite">{title}</h3>
      {description && <p className="text-mist text-sm max-w-sm">{description}</p>}
      {action}
    </div>
  )
}
