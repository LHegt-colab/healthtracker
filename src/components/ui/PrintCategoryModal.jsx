import { useState } from 'react'
import { Printer, CheckSquare, Square, Calendar } from 'lucide-react'
import Modal from './Modal'

const CATEGORIES = [
  { key: 'bloeddruk', label: 'Bloeddruk metingen', desc: 'Individuele metingen met grafiek en opmerkingen' },
  { key: 'gewicht', label: 'Gewicht', desc: 'Gewichtsverloop inclusief BMI' },
  { key: 'activiteiten', label: 'Activiteiten', desc: 'Overzicht per sporttype (sessies, minuten, kcal)' },
  { key: 'voeding', label: 'Voeding', desc: 'Dagelijkse calorie- en macro-inname' },
]

const PERIOD_OPTIONS = [
  { label: '7 dagen', days: 7 },
  { label: '30 dagen', days: 30 },
  { label: '90 dagen', days: 90 },
  { label: '6 maanden', days: 180 },
  { label: '1 jaar', days: 365 },
  { label: 'Aangepaste periode', days: null },
]

export default function PrintCategoryModal({ isOpen, onClose, onPrint }) {
  const [selected, setSelected] = useState(['bloeddruk', 'gewicht', 'activiteiten', 'voeding'])
  const [periodDays, setPeriodDays] = useState(30)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().split('T')[0])

  const isCustom = periodDays === null

  function toggle(key) {
    setSelected(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key])
  }

  function toggleAll() {
    setSelected(s => s.length === CATEGORIES.length ? [] : CATEGORIES.map(c => c.key))
  }

  function handlePrint() {
    if (selected.length === 0) return
    if (isCustom && (!customFrom || !customTo)) return
    onPrint(selected, {
      mode: isCustom ? 'custom' : 'days',
      days: periodDays,
      dateFrom: isCustom ? customFrom : null,
      dateTo: isCustom ? customTo : null,
    })
  }

  const allSelected = selected.length === CATEGORIES.length
  const canPrint = selected.length > 0 && (!isCustom || (customFrom && customTo))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Afdrukken – kies categorieën" size="md">
      <p className="text-sm text-gray-500 mb-4">
        Selecteer welke gegevens je wilt opnemen in het afgedrukte rapport.
      </p>

      {/* Select all toggle */}
      <button
        onClick={toggleAll}
        className="flex items-center gap-2 text-sm font-medium text-navy-700 mb-3 hover:text-teal-600 transition-colors"
      >
        {allSelected
          ? <CheckSquare size={16} className="text-teal-600" />
          : <Square size={16} />
        }
        {allSelected ? 'Alles deselecteren' : 'Alles selecteren'}
      </button>

      {/* Category checkboxes */}
      <div className="space-y-2 mb-5">
        {CATEGORIES.map(cat => {
          const checked = selected.includes(cat.key)
          return (
            <button
              key={cat.key}
              onClick={() => toggle(cat.key)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                checked
                  ? 'border-navy-700 bg-navy-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <span className="mt-0.5 shrink-0">
                {checked
                  ? <CheckSquare size={18} className="text-navy-700" />
                  : <Square size={18} className="text-gray-400" />
                }
              </span>
              <span>
                <span className={`block text-sm font-medium ${checked ? 'text-navy-700' : 'text-gray-700'}`}>
                  {cat.label}
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">{cat.desc}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Period selector */}
      <div className="border-t border-gray-200 pt-4 mb-5">
        <p className="text-sm font-medium text-navy-700 mb-2 flex items-center gap-1.5">
          <Calendar size={14} /> Periode rapport
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.label}
              onClick={() => setPeriodDays(opt.days)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                periodDays === opt.days
                  ? 'bg-navy-700 text-white border-navy-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-navy-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {isCustom && (
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Van</label>
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={e => setCustomFrom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">t/m</label>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                onChange={e => setCustomTo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-ghost">Annuleren</button>
        <button
          onClick={handlePrint}
          disabled={!canPrint}
          className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Printer size={16} />
          Voorvertoning tonen ({selected.length})
        </button>
      </div>
    </Modal>
  )
}
