import React from 'react'
import { Link } from 'react-router-dom'
import { Sprout } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-24">
      <div className="section-pad py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 font-display font-bold text-lg mb-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-400/15 flex items-center justify-center text-emerald-400">
              <Sprout size={18} />
            </span>
            RECYcORA AI
          </div>
          <p className="text-mist text-sm max-w-xs">
            See waste differently. Turn data into impact — waste recognition, recycling guidance,
            and sustainability intelligence in one platform.
          </p>
        </div>
        <div>
          <p className="label-mono mb-4">Platform</p>
          <ul className="space-y-2 text-sm text-mist">
            <li><Link to="/scanner" className="hover:text-offwhite">AI Waste Scanner</Link></li>
            <li><Link to="/assistant" className="hover:text-offwhite">Recycling Assistant</Link></li>
            <li><Link to="/recycling-centers" className="hover:text-offwhite">Recycling Centers</Link></li>
            <li><Link to="/dashboard" className="hover:text-offwhite">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <p className="label-mono mb-4">Company</p>
          <ul className="space-y-2 text-sm text-mist">
            <li><Link to="/register" className="hover:text-offwhite">Get Started</Link></li>
            <li><Link to="/login" className="hover:text-offwhite">Sign In</Link></li>
          </ul>
        </div>
        <div>
          <p className="label-mono mb-4">Status</p>
          <p className="text-sm text-mist">
            Built as a functioning demo platform. Environmental estimates are approximations —
            see the methodology notes on the Analytics page.
          </p>
        </div>
      </div>
      <div className="section-pad py-6 border-t border-white/[0.06] text-xs text-mist flex flex-col sm:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} RECYcORA AI. All rights reserved.</span>
        <span>Waste Management · Recycling · Sustainability Analytics · Environmental Intelligence</span>
      </div>
    </footer>
  )
}
