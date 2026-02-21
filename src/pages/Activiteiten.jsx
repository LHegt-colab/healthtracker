import { useState, useEffect, useContext } from 'react'
import { Plus, Pencil, Trash2, Activity, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { ToastContext } from '../App'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

const DURATION_FIELDS = ['duration_seconds']
const ALL_FIELDS = [
  { key: 'distance_km', label: 'Afstand (km)', type: 'number', step: '0.01' },
  { key: 'speed_kmh', label: 'Snelheid (km/u)', type: 'number', step: '0.1' },
  { key: 'calories_burned', label: 'Calorieën (kcal)', type: 'number' },
  { key: 'avg_bpm', label: 'Gemiddelde hartslag (bpm)', type: 'number' },
  { key: 'max_bpm', label: 'Max. hartslag (bpm)', type: 'number' },
]

function formatDuration(seconds) {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}u ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function ActivityForm({ types, initial, onSave, onClose }) {
  const [form, setForm] = useState({
    activity_type_id: initial?.activity_type_id ?? types[0]?.id ?? '',
    activity_date: initial?.activity_date ?? new Date().toISOString().split('T')[0],
    start_time: initial?.start_time ?? '',
    hours: initial ? Math.floor((initial.duration_seconds ?? 0) / 3600) : '',
    minutes: initial ? Math.floor(((initial.duration_seconds ?? 0) % 3600) / 60) : '',
    seconds_rem: initial ? (initial.duration_seconds ?? 0) % 60 : '',
    distance_km: initial?.distance_km ?? '',
    speed_kmh: initial?.speed_kmh ?? '',
    calories_burned: initial?.calories_burned ?? '',
    avg_bpm: initial?.avg_bpm ?? '',
    max_bpm: initial?.max_bpm ?? '',
    notes: initial?.notes ?? '',
  })

  const selectedType = types.find(t => t.id === Number(form.activity_type_id))
  const typeFields = selectedType?.fields ?? []

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const duration = (Number(form.hours) * 3600) + (Number(form.minutes) * 60) + Number(form.seconds_rem)
    const payload = {
      activity_type_id: Number(form.activity_type_id),
      activity_date: form.activity_date,
      start_time: form.start_time || null,
      duration_seconds: duration || null,
      distance_km: form.distance_km ? Number(form.distance_km) : null,
      speed_kmh: form.speed_kmh ? Number(form.speed_kmh) : null,
      calories_burned: form.calories_burned ? Number(form.calories_burned) : null,
      avg_bpm: form.avg_bpm ? Number(form.avg_bpm) : null,
      max_bpm: form.max_bpm ? Number(form.max_bpm) : null,
      notes: form.notes || null,
    }
    await onSave(payload, initial?.id)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="form-label">Sporttype *</label>
          <select className="form-select" value={form.activity_type_id} onChange={e => set('activity_type_id', e.target.value)} required>
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Datum *</label>
          <input className="form-input" type="date" value={form.activity_date} onChange={e => set('activity_date', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Starttijd</label>
          <input className="form-input" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
        </div>

        <div className="col-span-2">
          <label className="form-label">Duur</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input className="form-input" type="number" min="0" placeholder="Uren" value={form.hours} onChange={e => set('hours', e.target.value)} />
              <span className="text-xs text-gray-400 mt-1 block text-center">uren</span>
            </div>
            <div className="flex-1">
              <input className="form-input" type="number" min="0" max="59" placeholder="Minuten" value={form.minutes} onChange={e => set('minutes', e.target.value)} />
              <span className="text-xs text-gray-400 mt-1 block text-center">minuten</span>
            </div>
            <div className="flex-1">
              <input className="form-input" type="number" min="0" max="59" placeholder="Seconden" value={form.seconds_rem} onChange={e => set('seconds_rem', e.target.value)} />
              <span className="text-xs text-gray-400 mt-1 block text-center">seconden</span>
            </div>
          </div>
        </div>

        {ALL_FIELDS.filter(f => typeFields.includes(f.key)).map(field => (
          <div key={field.key}>
            <label className="form-label">{field.label}</label>
            <input
              className="form-input"
              type={field.type}
              step={field.step}
              min="0"
              value={form[field.key]}
              onChange={e => set(field.key, e.target.value)}
            />
          </div>
        ))}

        <div className="col-span-2">
          <label className="form-label">Opmerkingen</label>
          <textarea
            className="form-input resize-none"
            rows={3}
            placeholder="Voeg opmerkingen toe..."
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Annuleren</button>
        <button type="submit" className="btn-primary">{initial ? 'Opslaan' : 'Toevoegen'}</button>
      </div>
    </form>
  )
}

const SPORT_EMOJIS = [
  '🏃','🚴','🏊','🚶','💪','🧘','🚣','⛷️','🎾','⚽','🏀','🏈','⚾','🎱','🏓',
  '🏸','🥊','🤸','🏋️','🤼','🧗','🏇','🛹','🏄','🤽','🚵','🎿','🛷','🤺','🥋',
  '🎯','🎳','🪂','🧜','🏌️','🤾','🏐','🏉','🎽','🩱','🥅','🎣','🤿','🪁','🎖️',
]

function TypeManager({ types, onRefresh, onClose }) {
  const addToast = useContext(ToastContext)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🏃')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [fields, setFields] = useState(['duration', 'calories'])
  const [deleteId, setDeleteId] = useState(null)

  const fieldOptions = [
    { key: 'distance', label: 'Afstand' },
    { key: 'speed', label: 'Snelheid' },
    { key: 'calories', label: 'Calorieën' },
    { key: 'avg_bpm', label: 'Gem. hartslag' },
    { key: 'max_bpm', label: 'Max. hartslag' },
  ]

  function toggleField(key) {
    setFields(f => f.includes(key) ? f.filter(x => x !== key) : [...f, key])
  }

  async function handleAdd() {
    if (!name.trim()) return
    const { error } = await supabase.from('activity_types').insert({
      name: name.trim(), icon, is_custom: true, fields,
    })
    if (error) { addToast('Fout bij toevoegen', 'error'); return }
    addToast('Sporttype toegevoegd')
    setName('')
    setIcon('🏃')
    setShowEmojiPicker(false)
    onRefresh()
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('activity_types').delete().eq('id', id)
    if (error) { addToast('Kan standaard type niet verwijderen', 'error'); return }
    addToast('Sporttype verwijderd')
    onRefresh()
  }

  const customTypes = types.filter(t => t.is_custom)
  const defaultTypes = types.filter(t => !t.is_custom)

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Nieuw type toevoegen</h3>
        <div className="flex gap-2 mb-2">
          {/* Emoji picker knop */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(p => !p)}
              className="form-input w-16 text-center text-2xl cursor-pointer hover:bg-gray-50 select-none"
              title="Kies een icoontje"
            >
              {icon}
            </button>
            {showEmojiPicker && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-2 w-64">
                <p className="text-xs text-gray-400 mb-2 px-1">Kies een sport-icoontje</p>
                <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
                  {SPORT_EMOJIS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { setIcon(e); setShowEmojiPicker(false) }}
                      className={`text-xl p-1.5 rounded-lg hover:bg-teal-50 transition-colors ${icon === e ? 'bg-teal-100 ring-2 ring-teal-500' : ''}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <input className="form-input flex-1" placeholder="Naam sporttype" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {fieldOptions.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => toggleField(f.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                fields.includes(f.key) ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={handleAdd} className="btn-secondary text-sm">Toevoegen</button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Standaard typen</h3>
        <div className="flex flex-wrap gap-2">
          {defaultTypes.map(t => (
            <span key={t.id} className="bg-navy-50 text-navy-700 px-3 py-1 rounded-full text-sm">
              {t.icon} {t.name}
            </span>
          ))}
        </div>
      </div>

      {customTypes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Eigen typen</h3>
          {customTypes.map(t => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm">{t.icon} {t.name}</span>
              <button onClick={() => setDeleteId(t.id)} className="text-red-400 hover:text-red-600 p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        title="Type verwijderen"
        message="Weet je zeker dat je dit sporttype wilt verwijderen? Geregistreerde activiteiten worden niet verwijderd."
      />
    </div>
  )
}

export default function Activiteiten() {
  const addToast = useContext(ToastContext)
  const [types, setTypes] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showTypes, setShowTypes] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 15

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [typesRes, actRes] = await Promise.all([
      supabase.from('activity_types').select('*').order('name'),
      supabase.from('activities').select('*, activity_types(name, icon)').order('activity_date', { ascending: false }).order('created_at', { ascending: false }),
    ])
    setTypes(typesRes.data ?? [])
    setActivities(actRes.data ?? [])
    setLoading(false)
  }

  async function handleSave(payload, id) {
    if (id) {
      const { error } = await supabase.from('activities').update(payload).eq('id', id)
      if (error) { addToast('Fout bij opslaan', 'error'); return }
      addToast('Activiteit bijgewerkt')
    } else {
      const { error } = await supabase.from('activities').insert(payload)
      if (error) { addToast('Fout bij toevoegen', 'error'); return }
      addToast('Activiteit toegevoegd')
    }
    loadAll()
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (error) { addToast('Fout bij verwijderen', 'error'); return }
    addToast('Activiteit verwijderd')
    loadAll()
  }

  const filtered = filterType
    ? activities.filter(a => a.activity_type_id === Number(filterType))
    : activities

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-700 flex items-center gap-2">
            <Activity className="text-teal-600" /> Sportactiviteiten
          </h1>
          <p className="text-gray-500 text-sm mt-1">{activities.length} activiteiten geregistreerd</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTypes(true)} className="btn-ghost flex items-center gap-2 text-sm">
            <Settings size={16} /> Typen beheren
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Nieuwe activiteit
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Filter op type:</span>
          <button
            onClick={() => { setFilterType(''); setPage(0) }}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${!filterType ? 'bg-navy-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Alle ({activities.length})
          </button>
          {types.map(t => {
            const count = activities.filter(a => a.activity_type_id === t.id).length
            if (count === 0) return null
            return (
              <button
                key={t.id}
                onClick={() => { setFilterType(String(t.id)); setPage(0) }}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filterType === String(t.id) ? 'bg-navy-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {t.icon} {t.name} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700"></div>
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Activity size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Geen activiteiten gevonden</p>
            <p className="text-sm mt-1">Klik op "Nieuwe activiteit" om te beginnen</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="table-header">Type</th>
                    <th className="table-header">Datum</th>
                    <th className="table-header">Duur</th>
                    <th className="table-header">Afstand</th>
                    <th className="table-header">Snelheid</th>
                    <th className="table-header">Kcal</th>
                    <th className="table-header">Hartslag</th>
                    <th className="table-header">Opmerking</th>
                    <th className="table-header w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <span className="flex items-center gap-2 font-medium">
                          <span className="text-lg">{a.activity_types?.icon ?? '🏃'}</span>
                          {a.activity_types?.name ?? '—'}
                        </span>
                      </td>
                      <td className="table-cell">{format(new Date(a.activity_date), 'd MMM yyyy', { locale: nl })}</td>
                      <td className="table-cell">{formatDuration(a.duration_seconds)}</td>
                      <td className="table-cell">{a.distance_km ? `${a.distance_km} km` : '—'}</td>
                      <td className="table-cell">{a.speed_kmh ? `${a.speed_kmh} km/u` : '—'}</td>
                      <td className="table-cell">{a.calories_burned ? `${a.calories_burned}` : '—'}</td>
                      <td className="table-cell">{a.avg_bpm ? `${a.avg_bpm}/${a.max_bpm ?? '?'} bpm` : '—'}</td>
                      <td className="table-cell max-w-32">
                        {a.notes ? <span className="text-xs text-gray-500 truncate block" title={a.notes}>{a.notes}</span> : '—'}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditing(a); setShowForm(true) }} className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteId(a.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-ghost text-sm disabled:opacity-40">← Vorige</button>
                <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="btn-ghost text-sm disabled:opacity-40">Volgende →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Activiteit bewerken' : 'Nieuwe activiteit'} size="lg">
        <ActivityForm types={types} initial={editing} onSave={handleSave} onClose={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={showTypes} onClose={() => setShowTypes(false)} title="Sporttypen beheren">
        <TypeManager types={types} onRefresh={loadAll} onClose={() => setShowTypes(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        title="Activiteit verwijderen"
        message="Weet je zeker dat je deze activiteit wilt verwijderen?"
      />
    </div>
  )
}
