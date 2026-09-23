import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ScanLine, MapPin, LineChart, MessageCircle, Trophy, ShieldCheck, ArrowRight,
} from 'lucide-react'
import ScanningAnimation from '../components/scanner/ScanningAnimation.jsx'
import StorySection from '../components/home/StorySection.jsx'
import { useAuth } from '../hooks/useAuth.jsx'

const FEATURES = [
  {
    icon: ScanLine, title: 'AI Waste Scanner',
    body: 'Upload or capture an image and get an instant material classification with a confidence score and disposal guidance.',
  },
  {
    icon: MessageCircle, title: 'Smart Recycling Assistant',
    body: 'Ask practical disposal questions and get safety-conscious, specific answers in seconds.',
  },
  {
    icon: LineChart, title: 'Sustainability Analytics',
    body: 'Track waste and recycling trends over time with a transparent, configurable scoring engine.',
  },
  {
    icon: MapPin, title: 'Recycling Center Finder',
    body: 'Locate nearby centers filtered by accepted materials, with distance and contact details.',
  },
  {
    icon: Trophy, title: 'Eco Points & Achievements',
    body: 'Build consistent habits with a points system and milestone achievements grounded in real activity.',
  },
  {
    icon: ShieldCheck, title: 'Business Intelligence',
    body: 'Organizations get department-level breakdowns, forecasting, and AI-generated recommendations.',
  },
]

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.6, delay, ease: 'easeOut' },
  }
}

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const dashboardPath = user?.role === 'business' ? '/business-dashboard' : '/dashboard'

  return (
    <div>
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden section-pad pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="absolute inset-0 bg-radial-fade pointer-events-none" />
        <div className="absolute inset-0 bg-grid-lines bg-[length:48px_48px] opacity-[0.15] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="label-mono text-emerald-400 mb-5">Environmental Intelligence Platform</p>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
              TURN WASTE
              <br />
              INTO <span className="text-emerald-400">INTELLIGENCE</span>.
            </h1>
            <p className="text-mist text-base md:text-lg mt-6 max-w-lg">
              RECYcORA AI transforms waste recognition, recycling decisions, and sustainability
              data into actionable environmental intelligence.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to={isAuthenticated ? '/scanner' : '/register'} className="btn-primary">
                Scan Your Waste <ArrowRight size={16} />
              </Link>
              <Link to={isAuthenticated ? dashboardPath : '/scanner'} className="btn-secondary">
                Explore the Platform
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-6 max-w-md">
              {[
                ['96.4%', 'Peak scan confidence'],
                ['8', 'Waste categories tracked'],
                ['24/7', 'AI recommendations'],
              ].map(([stat, label]) => (
                <div key={label}>
                  <p className="font-display text-2xl font-bold text-offwhite">{stat}</p>
                  <p className="text-xs text-mist mt-1">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <ScanningAnimation />
          </motion.div>
        </div>
      </section>

      {/* ---- Story / scroll-driven section ---- */}
      <StorySection />

      {/* ---- Features ---- */}
      <section className="section-pad py-24">
        <motion.div {...fadeUp()} className="max-w-2xl mx-auto text-center mb-16">
          <p className="label-mono text-emerald-400 mb-3">Platform Capabilities</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            One system, full lifecycle
          </h2>
        </motion.div>
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                {...fadeUp(i * 0.06)}
                className="glass-panel p-7 hover:border-emerald-400/30 transition-colors duration-300 group"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 mb-5 group-hover:bg-emerald-400/20 transition-colors">
                  <Icon size={20} />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-mist text-sm leading-relaxed">{f.body}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="section-pad pb-28">
        <motion.div
          {...fadeUp()}
          className="max-w-5xl mx-auto glass-panel p-12 md:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-radial-fade pointer-events-none" />
          <h2 className="relative font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Start turning waste into intelligence today
          </h2>
          <p className="relative text-mist max-w-xl mx-auto mb-8">
            Create a free account, scan your first item, and see your sustainability score
            build from real activity — not guesswork.
          </p>
          <div className="relative flex flex-wrap justify-center gap-4">
            <Link to={isAuthenticated ? '/scanner' : '/register'} className="btn-primary">
              {isAuthenticated ? 'Scan Your Waste' : 'Create Free Account'} <ArrowRight size={16} />
            </Link>
            {!isAuthenticated && (
              <Link to="/login" className="btn-secondary">
                I already have an account
              </Link>
            )}
          </div>
        </motion.div>
      </section>
    </div>
  )
}
