import { NavLink } from 'react-router-dom'
import { Activity, Heart, Scale, BarChart2, Home } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/activiteiten', label: 'Activiteiten', icon: Activity },
  { to: '/bloeddruk', label: 'Bloeddruk & Hartslag', icon: Heart },
  { to: '/gewicht-voeding', label: 'Gewicht & Voeding', icon: Scale },
  { to: '/rapporten', label: 'Rapporten', icon: BarChart2 },
]

export default function Navbar() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-navy-700 text-white py-2 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <span className="text-teal-400 font-bold text-lg">+</span>
          <span className="font-semibold text-sm tracking-wide">Gezondheid Tracker</span>
          <span className="ml-auto text-xs text-blue-200">Persoonlijk gezondheidsoverzicht</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6">
        <ul className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? 'border-navy-700 text-navy-700'
                      : 'border-transparent text-gray-600 hover:text-navy-700 hover:border-gray-300'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
