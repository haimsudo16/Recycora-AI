import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanLine, CheckCircle2 } from 'lucide-react'

const STEPS = [
  { label: 'PLASTIC BOTTLE', tone: 'text-offwhite' },
  { label: 'RECYCLABLE', tone: 'text-emerald-400' },
  { label: 'MATERIAL: PET', tone: 'text-offwhite' },
  { label: 'RECOMMENDED ACTION', tone: 'text-lime-300' },
  { label: 'RECYCLING COLLECTION', tone: 'text-emerald-400' },
]

/**
 * Cinematic hero visualization: a scan-line sweeps over a stylized waste
 * object silhouette while classification labels resolve in sequence,
 * looping to feel like a live AI product rather than a static graphic.
 */
export default function ScanningAnimation() {
  const [step, setStep] = useState(0)
  const [scanning, setScanning] = useState(true)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    const timers = []
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(i + 1), 900 + i * 650))
    })
    timers.push(setTimeout(() => setScanning(false), 900))
    timers.push(setTimeout(() => {
      setStep(0)
      setScanning(true)
      setCycle((c) => c + 1)
    }, 900 + STEPS.length * 650 + 1800))
    return () => timers.forEach(clearTimeout)
  }, [cycle])

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="relative aspect-[4/5] rounded-3xl glass-panel overflow-hidden shadow-glow">
        {/* backdrop grid */}
        <div className="absolute inset-0 bg-grid-lines bg-[length:24px_24px] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950/80" />

        {/* silhouette */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-28 h-44 rounded-b-[3rem] rounded-t-2xl bg-gradient-to-b from-emerald-400/30 to-forest-700/40 border border-emerald-300/20"
          />
        </div>

        {/* scan line */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ top: '0%' }}
              animate={{ top: '100%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
              className="absolute left-0 right-0 h-[2px] bg-emerald-300 shadow-[0_0_20px_4px_rgba(79,214,143,0.6)]"
            />
          )}
        </AnimatePresence>

        <div className="absolute top-4 left-4 flex items-center gap-2 label-mono text-emerald-300">
          <ScanLine size={14} className={scanning ? 'animate-pulse' : ''} />
          {scanning ? 'ANALYZING' : 'COMPLETE'}
        </div>
      </div>

      {/* classification readout */}
      <div className="mt-5 glass-panel p-5 font-mono text-sm space-y-2 min-h-[168px]">
        {STEPS.slice(0, step).map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center justify-between"
          >
            <span className={s.tone}>{s.label}</span>
            {i === STEPS.length - 1 && step === STEPS.length && (
              <CheckCircle2 size={14} className="text-emerald-400" />
            )}
          </motion.div>
        ))}
        {step === 0 && <span className="text-mist">Waiting for scan...</span>}
      </div>
    </div>
  )
}
