import React, { useEffect, useState } from 'react'
import { MapPin, LocateFixed } from 'lucide-react'
import CenterCard from '../components/maps/CenterCard.jsx'
import StaticMapPreview from '../components/maps/StaticMapPreview.jsx'
import { SkeletonCard } from '../components/ui/Skeleton.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { centersApi, apiErrorMessage } from '../services/api.js'

const CATEGORIES = ['all', 'plastic', 'paper', 'glass', 'metal', 'ewaste', 'organic']

export default function RecyclingCenters() {
  const [centers, setCenters] = useState([])
  const [category, setCategory] = useState('all')
  const [coords, setCoords] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const load = (params = {}) => {
    setLoading(true)
    setError(null)
    centersApi.list(params)
      .then((res) => setCenters(res.data))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load recycling centers.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const params = category !== 'all' ? { category } : {}
    if (coords) Object.assign(params, coords)
    load(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, coords])

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords({ lat: 31.5204, lng: 74.3587 }) // graceful fallback (Lahore) if permission denied
    )
  }

  return (
    <div className="section-pad py-10 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="label-mono text-emerald-400 mb-2 flex items-center gap-2">
            <MapPin size={13} /> Recycling Center Finder
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Find where to recycle</h1>
        </div>
        <button onClick={useMyLocation} className="btn-secondary text-sm">
          <LocateFixed size={15} /> Use my location
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`text-xs uppercase tracking-wide px-4 py-2 rounded-full border transition-colors ${
              category === c ? 'border-emerald-400 text-emerald-300 bg-emerald-400/10' : 'border-white/10 text-mist hover:border-white/20'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr,1.4fr] gap-6">
        <StaticMapPreview centers={centers} selectedId={selectedId} onSelect={setSelectedId} />

        <div>
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={() => load(category !== 'all' ? { category } : {})} />
          ) : centers.length === 0 ? (
            <EmptyState icon={MapPin} title="No centers found" description="Try a different category filter." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 max-h-[560px] overflow-y-auto pr-1">
              {centers.map((c) => (
                <div key={c.id} onMouseEnter={() => setSelectedId(c.id)}>
                  <CenterCard center={c} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
