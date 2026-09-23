import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf
    const start = performance.now()
    const from = 0
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (target - from) * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

export default function MetricCard({ label, value, suffix = '', icon: Icon, accent = 'text-emerald-400', decimals = 1 }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0)
  const display = typeof value === 'number' ? animated.toFixed(decimals) : value

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="label-mono">{label}</p>
        {Icon && <Icon size={16} className={accent} />}
      </div>
      <p className="font-display text-3xl font-bold text-offwhite">
        {display}<span className="text-lg text-mist ml-1">{suffix}</span>
      </p>
    </motion.div>
  )
}
