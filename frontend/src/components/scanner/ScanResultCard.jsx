import React from 'react'
import { motion } from 'framer-motion'
import { Recycle, AlertTriangle, HelpCircle, Ban, Leaf } from 'lucide-react'

const RECYCLABILITY_META = {
  recyclable: { label: 'Recyclable', icon: Recycle, color: 'text-emerald-400', ring: 'ring-emerald-400/30' },
  conditional: { label: 'Conditional', icon: HelpCircle, color: 'text-lime-300', ring: 'ring-lime-300/30' },
  hazardous: { label: 'Hazardous / Special Handling', icon: AlertTriangle, color: 'text-amber-400', ring: 'ring-amber-400/30' },
  not_recyclable: { label: 'Not Recyclable', icon: Ban, color: 'text-red-300', ring: 'ring-red-300/30' },
}

export default function ScanResultCard({ result, imagePreview }) {
  const meta = RECYCLABILITY_META[result.recyclability] || RECYCLABILITY_META.conditional
  const Icon = meta.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-6 md:p-8"
    >
      <p className="label-mono text-emerald-400 mb-6">AI Analysis</p>

      <div className="grid md:grid-cols-[160px,1fr] gap-6 mb-8">
        {imagePreview && (
          <img src={imagePreview} alt="Scanned item" className="w-full h-40 md:h-full object-cover rounded-xl border border-white/10" />
        )}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-mist mb-1">Object</p>
              <p className="font-display text-xl font-bold">{result.detected_object}</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ${meta.ring} ${meta.color} text-sm font-medium`}>
              <Icon size={16} /> {meta.label}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-mist mb-1">Material</p>
              <p className="font-mono text-sm">{result.material}</p>
            </div>
            <div>
              <p className="text-xs text-mist mb-1">Category</p>
              <p className="font-mono text-sm capitalize">{result.detected_category}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-mist mb-1.5">Confidence</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-lime-300"
                />
              </div>
              <span className="font-mono text-sm text-emerald-300">{result.confidence.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
          <p className="label-mono mb-2 text-emerald-400">Recommended Action</p>
          <p className="text-sm text-offwhite leading-relaxed">{result.recommendation}</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
          <p className="label-mono mb-2 text-lime-300 flex items-center gap-1.5">
            <Leaf size={12} /> Environmental Insight
          </p>
          <p className="text-sm text-offwhite leading-relaxed">{result.environmental_insight}</p>
        </div>
      </div>

      <p className="text-xs text-mist mt-6">
        Classified by RECYcORA's {result.model_version} computer-vision engine.
      </p>
    </motion.div>
  )
}
