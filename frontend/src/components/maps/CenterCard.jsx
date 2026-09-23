import React from 'react'
import { MapPin, Phone, Clock, Star, Navigation } from 'lucide-react'

const MATERIAL_COLORS = {
  plastic: 'bg-emerald-400/15 text-emerald-300',
  paper: 'bg-amber-400/15 text-amber-300',
  glass: 'bg-sky-400/15 text-sky-300',
  metal: 'bg-slate-300/15 text-slate-300',
  ewaste: 'bg-violet-400/15 text-violet-300',
  organic: 'bg-lime-300/15 text-lime-300',
}

export default function CenterCard({ center }) {
  const materials = center.accepted_materials.split(',').map((m) => m.trim())
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${center.latitude},${center.longitude}`

  return (
    <div className="glass-panel p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-offwhite">{center.name}</h3>
          <p className="text-xs text-mist flex items-center gap-1 mt-1">
            <MapPin size={12} /> {center.address}, {center.city}
          </p>
        </div>
        {typeof center.distance_km === 'number' && (
          <span className="font-mono text-xs text-emerald-400 shrink-0">{center.distance_km} km</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {materials.map((m) => (
          <span key={m} className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full ${MATERIAL_COLORS[m] || 'bg-white/10 text-mist'}`}>
            {m}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-mist">
        {center.operating_hours && (
          <span className="flex items-center gap-1"><Clock size={12} /> {center.operating_hours}</span>
        )}
        <span className="flex items-center gap-1"><Star size={12} className="text-lime-300" /> {center.rating}</span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        {center.contact ? (
          <span className="text-xs text-mist flex items-center gap-1"><Phone size={12} /> {center.contact}</span>
        ) : <span />}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
        >
          <Navigation size={12} /> Directions
        </a>
      </div>
    </div>
  )
}
