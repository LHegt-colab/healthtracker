import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Activity, Heart, Scale, BarChart2, Home, Menu, X, UserCircle } from 'lucide-react'
import ProfileModal from '../ui/ProfileModal'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/activiteiten', label: 'Activiteiten', icon: Activity },
  { to: '/bloeddruk', label: 'Bloeddruk & Hartslag', icon: Heart },
  { to: '/gewicht-voeding', label: 'Gewicht & Voeding', icon: Scale },
  { to: '/rapporten', label: 'Rapporten', icon: BarChart2 },
]

const linkClass = (isActive) =>
  `flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors border-b-2 ${
    isActive
      ? 'border-navy-700 text-navy-700'
      : 'border-transparent text-gray-600 hover:text-navy-700 hover:border-gray-300'
  }`

const mobileLinkClass = (isActive) =>
  `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
    isActive
      ? 'bg-navy-700 text-white'
      : 'text-gray-700 hover:bg-navy-50 hover:text-navy-700'
  }`

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        {/* Top bar */}
        <div className="bg-navy-700 text-white py-2 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <span className="text-teal-400 font-bold text-lg">+</span>
            <span className="font-semibold text-sm tracking-wide">Gezondheid Tracker</span>
            <span className="ml-auto text-xs text-blue-200 hidden sm:block">
              Persoonlijk gezondheidsoverzicht
            </span>
            {/* Profile icon — top bar on mobile */}
            <button
              onClick={() => { closeMenu(); setShowProfile(true) }}
              className="sm:hidden ml-2 p-1 rounded hover:bg-navy-600 transition-colors"
              title="Mijn profiel"
            >
              <UserCircle size={20} />
            </button>
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden ml-2 p-1 rounded hover:bg-navy-600 transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Menu sluiten' : 'Menu openen'}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Desktop navigation */}
        <nav className="max-w-7xl mx-auto px-6 hidden md:block">
          <ul className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => linkClass(isActive)}
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              </li>
            ))}
            {/* Profile button — desktop */}
            <li className="ml-auto">
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 px-4 py-4 text-sm font-medium text-gray-600 hover:text-navy-700 transition-colors border-b-2 border-transparent hover:border-gray-300"
                title="Mijn profiel"
              >
                <UserCircle size={16} />
                Profiel
              </button>
            </li>
          </ul>
        </nav>

        {/* Mobile navigation dropdown */}
        {menuOpen && (
          <nav className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={closeMenu}
                className={({ isActive }) => mobileLinkClass(isActive)}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
            <button
              onClick={() => { closeMenu(); setShowProfile(true) }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-navy-50 hover:text-navy-700 transition-colors"
            >
              <UserCircle size={16} />
              Mijn profiel
            </button>
          </nav>
        )}
      </header>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </>
  )
}
