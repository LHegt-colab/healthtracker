import { useState, useContext } from 'react'
import { UserCircle } from 'lucide-react'
import Modal from './Modal'
import { ProfileContext } from '../../App'

export default function ProfileModal({ isOpen, onClose }) {
  const { profile, saveProfile } = useContext(ProfileContext)
  const [form, setForm] = useState(profile)

  // Sync form when modal opens
  function handleOpen() {
    setForm(profile)
  }

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function handleSave(e) {
    e.preventDefault()
    saveProfile(form)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mijn profiel" size="md">
      <div className="flex items-center gap-3 mb-5 p-3 bg-navy-50 rounded-lg border border-navy-100">
        <UserCircle size={36} className="text-navy-700 shrink-0" />
        <div>
          <p className="text-sm font-medium text-navy-700">Persoonlijke gegevens</p>
          <p className="text-xs text-gray-500">
            Deze gegevens worden automatisch ingevuld in afgedrukte rapporten. Ze worden alleen lokaal opgeslagen.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Naam</label>
            <input
              className="form-input"
              type="text"
              placeholder="Voor- en achternaam"
              value={form.naam}
              onChange={e => set('naam', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Geboortedatum</label>
            <input
              className="form-input"
              type="date"
              value={form.geboortedatum}
              onChange={e => set('geboortedatum', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Huisarts / zorgverlener</label>
            <input
              className="form-input"
              type="text"
              placeholder="Naam van je huisarts"
              value={form.huisarts}
              onChange={e => set('huisarts', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">BSN / Patiëntnummer</label>
            <input
              className="form-input"
              type="text"
              placeholder="Optioneel"
              value={form.bsn}
              onChange={e => set('bsn', e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Annuleren
          </button>
          <button type="submit" className="btn-primary">
            Opslaan
          </button>
        </div>
      </form>
    </Modal>
  )
}
