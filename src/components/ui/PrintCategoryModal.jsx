import { useState } from 'react'
import { Printer, CheckSquare, Square } from 'lucide-react'
import Modal from './Modal'

const CATEGORIES = [
  { key: 'bloeddruk', label: 'Bloeddruk metingen', desc: 'Individuele metingen met categorie en opmerkingen' },
  { key: 'gewicht', label: 'Gewicht', desc: 'Gewichtsverloop inclusief BMI' },
  { key: 'activiteiten', label: 'Activiteiten', desc: 'Overzicht per sporttype (sessies, minuten, kcal)' },
  { key: 'voeding', label: 'Voeding', desc: 'Dagelijkse calorie- en macro-inname' },
]

export default function PrintCategoryModal({ isOpen, onClose, onPrint }) {
  const [selected, setSelected] = useState(['bloeddruk', 'gewicht', 'activiteiten', 'voeding'])

  function toggle(key) {
    setSelected(s =>
      s.includes(key) ? s.filter(k => k !== key) : [...s, key]
    )
  }

  function toggleAll() {
    setSelected(s => s.length === CATEGORIES.length ? [] : CATEGORIES.map(c => c.key))
  }

  function handlePrint() {
    if (selected.length === 0) return
    onPrint(selected)
  }

  const allSelected = selected.length === CATEGORIES.length

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

      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-ghost">Annuleren</button>
        <button
          onClick={handlePrint}
          disabled={selected.length === 0}
          className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Printer size={16} />
          Voorvertoning tonen ({selected.length})
        </button>
      </div>
    </Modal>
  )
}
