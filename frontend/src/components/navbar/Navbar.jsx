import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sprout, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'

const PUBLIC_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/scanner', label: 'AI Scanner' },
  { to: '/assistant', label: 'Assistant' },
  { to: '/recycling-centers', label: 'Recycling Centers' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <nav className="section-pad flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg tracking-tight">
          <span className="w-8 h-8 rounded-lg bg-emerald-400/15 flex items-center justify-center text-emerald-400">
            <Sprout size={18} />
          </span>
          RECYcORA <span className="text-emerald-400">AI</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {PUBLIC_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? 'text-emerald-400' : 'text-mist hover:text-offwhite'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <NavLink
              to={user.role === 'business' ? '/business-dashboard' : '/dashboard'}
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? 'text-emerald-400' : 'text-mist hover:text-offwhite'}`
              }
            >
              Dashboard
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? 'text-emerald-400' : 'text-mist hover:text-offwhite'}`
              }
            >
              Admin
            </NavLink>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-white/10 pl-1.5 pr-3 py-1.5 hover:border-emerald-400/50 transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center text-xs font-semibold">
                  {user.name?.charAt(0)?.toUpperCase()}
                </span>
                <span className="text-sm text-offwhite">{user.name?.split(' ')[0]}</span>
                <ChevronDown size={14} className="text-mist" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 glass-panel p-2 shadow-card"
                  >
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-offwhite hover:bg-white/5"
                    >
                      <LayoutDashboard size={14} /> Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-white/5"
                    >
                      <LogOut size={14} /> Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm text-mist hover:text-offwhite transition-colors">
                Log in
              </Link>
              <Link to="/register" className="btn-primary text-sm px-5 py-2.5">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-offwhite" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-white/[0.06]"
          >
            <div className="section-pad py-4 flex flex-col gap-4">
              {PUBLIC_LINKS.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="text-mist hover:text-offwhite">
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link to={user.role === 'business' ? '/business-dashboard' : '/dashboard'} onClick={() => setOpen(false)} className="text-mist hover:text-offwhite">
                    Dashboard
                  </Link>
                  <Link to="/profile" onClick={() => setOpen(false)} className="text-mist hover:text-offwhite">
                    Profile
                  </Link>
                  <button onClick={() => { setOpen(false); handleLogout() }} className="text-left text-red-300">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="text-mist hover:text-offwhite">
                    Log in
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn-primary w-fit text-sm">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
