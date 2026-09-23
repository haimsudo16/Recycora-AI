import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanLine, History, RotateCcw } from 'lucide-react'
import UploadDropzone from '../components/scanner/UploadDropzone.jsx'
import ScanResultCard from '../components/scanner/ScanResultCard.jsx'
import { scanApi, scanImageUrl, apiErrorMessage } from '../services/api.js'
import { useToast } from '../components/ui/Toast.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

const PROCESSING_STEPS = [
  'Initializing vision model',
  'Analyzing color & texture signatures',
  'Matching material category',
  'Generating recommendation',
]

export default function Scanner() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('idle') // idle | processing | done | error
  const [processingStep, setProcessingStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const { push } = useToast()

  const loadHistory = () => {
    setHistoryLoading(true)
    scanApi.list(8)
      .then((res) => setHistory(res.data))
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }

  useEffect(() => { loadHistory() }, [])

  useEffect(() => {
    if (status !== 'processing') return undefined
    setProcessingStep(0)
    const interval = setInterval(() => {
      setProcessingStep((s) => Math.min(s + 1, PROCESSING_STEPS.length - 1))
    }, 500)
    return () => clearInterval(interval)
  }, [status])

  const handleFile = (f) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError(null)
  }

  const runScan = async () => {
    if (!file) return
    setStatus('processing')
    setError(null)
    try {
      const res = await scanApi.create(file)
      await new Promise((r) => setTimeout(r, 1600)) // let the processing animation read naturally
      setResult(res.data)
      setStatus('done')
      push('Scan complete — classification added to your history.')
      loadHistory()
    } catch (err) {
      setError(apiErrorMessage(err, 'The scan could not be completed.'))
      setStatus('error')
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setStatus('idle')
    setError(null)
  }

  return (
    <div className="section-pad py-16 max-w-5xl mx-auto">
      <div className="mb-10">
        <p className="label-mono text-emerald-400 mb-3">AI Waste Scanner</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Scan any item for instant classification
        </h1>
        <p className="text-mist max-w-xl">
          Upload a photo of a waste item and RECYcORA AI's computer-vision engine will identify
          its material, recyclability, and the recommended disposal action.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div key="idle" exit={{ opacity: 0 }}>
            <UploadDropzone onFileSelected={handleFile} />
            {preview && (
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-5 glass-panel p-5">
                <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-white/10" />
                <div className="flex-1 text-sm text-mist">{file?.name}</div>
                <div className="flex gap-3">
                  <button onClick={reset} className="btn-secondary text-sm">Clear</button>
                  <button onClick={runScan} className="btn-primary text-sm">
                    <ScanLine size={16} /> Scan Item
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-panel p-10 text-center">
            <p className="label-mono text-emerald-400 mb-6">Analyzing Waste...</p>
            {preview && (
              <div className="relative w-40 h-40 mx-auto mb-8 rounded-2xl overflow-hidden border border-white/10">
                <img src={preview} alt="Scanning" className="w-full h-full object-cover" />
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute left-0 right-0 h-[2px] bg-emerald-300 shadow-[0_0_16px_3px_rgba(79,214,143,0.6)]"
                />
              </div>
            )}
            <p className="font-mono text-sm text-offwhite mb-4">{PROCESSING_STEPS[processingStep]}</p>
            <div className="max-w-xs mx-auto h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: '10%' }}
                animate={{ width: `${((processingStep + 1) / PROCESSING_STEPS.length) * 100}%` }}
                transition={{ duration: 0.4 }}
                className="h-full bg-gradient-to-r from-emerald-400 to-lime-300"
              />
            </div>
          </motion.div>
        )}

        {status === 'done' && result && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ScanResultCard result={result} imagePreview={preview} />
            <div className="mt-6 text-center">
              <button onClick={reset} className="btn-secondary text-sm">
                <RotateCcw size={14} /> Scan another item
              </button>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-panel p-8 text-center">
            <p className="text-red-300 mb-4">{error}</p>
            <button onClick={runScan} className="btn-secondary text-sm">Try again</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- History ---- */}
      <div className="mt-16">
        <div className="flex items-center gap-2 mb-5">
          <History size={16} className="text-emerald-400" />
          <p className="label-mono">Recent Scans</p>
        </div>

        {historyLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={ScanLine}
            title="No scans yet"
            description="Your scan history will appear here once you analyze your first item."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {history.map((s) => (
              <div key={s.id} className="glass-panel p-4 flex gap-3">
                <img
                  src={scanImageUrl(s)}
                  alt={s.detected_object}
                  className="w-16 h-16 object-cover rounded-lg border border-white/10 shrink-0"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.detected_object}</p>
                  <p className="text-xs text-mist capitalize">{s.recyclability.replace('_', ' ')}</p>
                  <p className="text-xs font-mono text-emerald-400 mt-1">{s.confidence.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
