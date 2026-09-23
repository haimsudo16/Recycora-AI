import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { wasteApi, apiErrorMessage } from '../../services/api.js'
import { useToast } from '../ui/Toast.jsx'

const CATEGORIES = ['plastic', 'paper', 'glass', 'metal', 'organic', 'ewaste']

export default function LogWasteModal({ open, onClose, onLogged }) {
  const [form, setForm] = useState({ category: 'plastic', quantity: '', unit: 'kg', recycled: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { push } = useToast()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    const quantity = parseFloat(form.quantity)
    if (!quantity || quantity <= 0) {
      setError('Enter a quantity greater than zero.')
      return
    }
    setLoading(true)
    try {
      await wasteApi.create({ ...form, quantity })
      push('Waste record logged successfully.')
      setForm({ category: 'plastic', quantity: '', unit: 'kg', recycled: true })
      onLogged()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not log this record.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-full max-w-md p-7"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold">Log a Waste Record</h3>
              <button onClick={onClose} className="text-mist hover:text-offwhite"><X size={18} /></button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-300 text-sm px-4 py-2.5">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label-mono block mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setForm({ ...form, category: c })}
                      className={`text-xs rounded-lg border px-3 py-2 capitalize transition-colors ${
                        form.category === c ? 'border-emerald-400 text-emerald-300 bg-emerald-400/10' : 'border-white/10 text-mist hover:border-white/20'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-mono block mb-2">Quantity (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-emerald-400/60"
                    placeholder="1.5"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-mist cursor-pointer select-none py-2.5">
                    <input
                      type="checkbox"
                      checked={form.recycled}
                      onChange={(e) => setForm({ ...form, recycled: e.target.checked })}
                      className="w-4 h-4 rounded accent-emerald-400"
                    />
                    Recycled
                  </label>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Logging...' : 'Log Record'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
