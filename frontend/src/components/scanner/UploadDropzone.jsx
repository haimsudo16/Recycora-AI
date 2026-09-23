import React, { useCallback, useRef, useState } from 'react'
import { UploadCloud, ImageUp } from 'lucide-react'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
const MAX_BYTES = 8 * 1024 * 1024

export default function UploadDropzone({ onFileSelected, disabled }) {
  const [dragActive, setDragActive] = useState(false)
  const [localError, setLocalError] = useState(null)
  const inputRef = useRef(null)

  const validateAndEmit = useCallback((file) => {
    if (!file) return
    if (!ACCEPTED.includes(file.type)) {
      setLocalError('Please upload a JPG, PNG, or WEBP image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setLocalError('Image exceeds the 8MB limit.')
      return
    }
    setLocalError(null)
    onFileSelected(file)
  }, [onFileSelected])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    validateAndEmit(file)
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' && !disabled) inputRef.current?.click() }}
        className={`relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center text-center py-16 px-8 ${
          dragActive ? 'border-emerald-400 bg-emerald-400/5' : 'border-white/15 hover:border-white/25'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          disabled={disabled}
          onChange={(e) => validateAndEmit(e.target.files?.[0])}
        />
        <div className="w-14 h-14 rounded-full bg-emerald-400/10 flex items-center justify-center text-emerald-400 mb-4">
          <UploadCloud size={26} />
        </div>
        <p className="font-display font-semibold text-offwhite mb-1">
          Drag & drop a waste image, or click to upload
        </p>
        <p className="text-mist text-sm flex items-center gap-1.5 justify-center">
          <ImageUp size={14} /> JPG, PNG, or WEBP — up to 8MB
        </p>
      </div>
      {localError && <p className="text-red-300 text-sm mt-3">{localError}</p>}
    </div>
  )
}
