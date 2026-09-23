import React, { useMemo } from 'react'
import { MapPin } from 'lucide-react'

/**
 * Lightweight, dependency-free spatial preview: projects center
 * coordinates onto a stylized panel so the page communicates real
 * geographic distribution without requiring a paid maps API key. Swap
 * for a Leaflet/Google Maps embed by providing an API key later.
 */
export default function StaticMapPreview({ centers, selectedId, onSelect }) {
  const points = useMemo(() => {
    if (!centers.length) return []
    const lats = centers.map((c) => c.latitude)
    const lngs = centers.map((c) => c.longitude)
    const minLat = Math.min(...lats), maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
    const latRange = maxLat - minLat || 1
    const lngRange = maxLng - minLng || 1

    return centers.map((c) => ({
      ...c,
      x: 8 + ((c.longitude - minLng) / lngRange) * 84,
      y: 8 + (1 - (c.latitude - minLat) / latRange) * 84,
    }))
  }, [centers])

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl glass-panel overflow-hidden">
      <div className="absolute inset-0 bg-grid-lines bg-[length:28px_28px] opacity-30" />
      <div className="absolute inset-0 bg-radial-fade" />
      {points.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect?.(p.id)}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-full group"
          title={p.name}
        >
          <MapPin
            size={selectedId === p.id ? 26 : 20}
            className={`transition-all drop-shadow ${selectedId === p.id ? 'text-lime-300' : 'text-emerald-400'}`}
            fill="currentColor"
            fillOpacity={0.2}
          />
        </button>
      ))}
      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-mist text-sm">
          No centers match this filter yet.
        </div>
      )}
    </div>
  )
}
