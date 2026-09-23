import React from 'react'
import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center section-pad gap-4">
      <Compass size={36} className="text-emerald-400" />
      <h1 className="font-display text-3xl font-bold">Page not found</h1>
      <p className="text-mist max-w-md">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className="btn-primary mt-2">Back to Home</Link>
    </div>
  )
}
