import { useState, useEffect, useContext } from 'react'
import { Plus, Pencil, Trash2, Heart, Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PrintReport from '../components/ui/PrintReport'
import { ToastContext } from '../App'
import { format, startOfToday, subDays } from 'date-fns'
import { nl } from 'date-fns/locale'

function bpCategory(sys, dia) {
  if (sys < 120 && dia < 80) return { label: 'Optimaal', color: 'text-green-600 bg-green-50' }
  if (sys < 130 && dia < 85) return { label: 'Normaal', color: 'text-green-500 bg-green-50' }
  if (sys < 140 && dia < 90) return { label: 'Hoog-normaal', color: 'text-yellow-600 bg-yellow-50' }
  if (sys < 160 && dia < 100) return { label: 'Graad 1', color: 'text-orange-600 bg-orange-50' }
  if (sys < 180 && dia < 110) return { label: 'Graad 2', color: 'text-red-600 bg-red-50' }
  return { label: 'Graad 3', color: 'text-red-700 bg-red-100' }
}

function BPForm({ initial, onSave, onClose }) {
  const now = new Date()
  const [form, setForm] = useState({
    measured_at_date: initial
      ? initial.measured_at.split('T')[0]
      : now.toISOString().split('T')[0],
    measured_at_time: initial
      ? initial.measured_at.split('T')[1]?.substring(0, 5)
      : `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    systolic: initial?.systolic ?? '',
    diastolic: initial?.diastolic ?? '',
    heart_rate: initial?.heart_rate ?? '',
    notes: initial?.notes ?? '',
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const measured_at = `${form.measured_at_date}T${form.measured_at_time}:00`
    await onSave({
      measured_at,
      systolic: Number(form.systolic),
      diastolic: Number(form.diastolic),
      heart_rate: form.heart_rate ? Number(form.heart_rate) : null,
      notes: form.notes || null,
    }, initial?.id)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Datum *</label>
          <input className="form-input" type="date" value={form.measured_at_date} onChange={e => set('measured_at_date', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Tijd *</label>
          <input className="form-input" type="time" value={form.measured_at_time} onChange={e => set('measured_at_time', e.target.value)} required />
        </div>

        <div>
          <label className="form-label">Systolisch (mmHg) *</label>
          <input className="form-input" type="number" min="50" max="300" placeholder="120" value={form.systolic} onChange={e => set('systolic', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Diastolisch (mmHg) *</label>
          <input className="form-input" type="number" min="30" max="200" placeholder="80" value={form.diastolic} onChange={e => set('diastolic', e.target.value)} required />
        </div>

        <div>
          <label className="form-label">Hartslag (bpm)</label>
          <input className="form-input" type="number" min="30" max="250" placeholder="70" value={form.heart_rate} onChange={e => set('heart_rate', e.target.value)} />
        </div>

        {form.systolic && form.diastolic && (
          <div className="flex items-end pb-1">
            {(() => {
              const cat = bpCategory(Number(form.systolic), Number(form.diastolic))
              return (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${cat.color}`}>
                  {cat.label}
                </span>
              )
            })()}
          </div>
        )}

        <div className="col-span-2">
          <label className="form-label">Opmerkingen</label>
          <textarea
            className="form-input resize-none"
            rows={3}
            placeholder="Bijv. na het sporten, ontspannen, stress..."
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

export default function Bloeddruk() {
  const addToast = useContext(ToastContext)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [filterDays, setFilterDays] = useState(30)
  const [showPrint, setShowPrint] = useState(false)

  useEffect(() => { loadEntries() }, [filterDays])

  async function loadEntries() {
    setLoading(true)
    const since = filterDays
      ? subDays(new Date(), filterDays).toISOString()
      : undefined

    let q = supabase.from('ht_blood_pressure').select('*').order('measured_at', { ascending: false })
    if (since) q = q.gte('measured_at', since)

    const { data, error } = await q
    if (error) addToast('Fout bij laden', 'error')
    setEntries(data ?? [])
    setLoading(false)
  }

  async function handleSave(payload, id) {
    if (id) {
      const { error } = await supabase.from('ht_blood_pressure').update(payload).eq('id', id)
      if (error) { addToast('Fout bij opslaan', 'error'); return }
      addToast('Meting bijgewerkt')
    } else {
      const { error } = await supabase.from('ht_blood_pressure').insert(payload)
      if (error) { addToast('Fout bij toevoegen', 'error'); return }
      addToast('Meting toegevoegd')
    }
    loadEntries()
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('ht_blood_pressure').delete().eq('id', id)
    if (error) { addToast('Fout bij verwijderen', 'error'); return }
    addToast('Meting verwijderd')
    loadEntries()
  }

  // Stats
  const avg = entries.length ? {
    sys: Math.round(entries.reduce((s, e) => s + e.systolic, 0) / entries.length),
    dia: Math.round(entries.reduce((s, e) => s + e.diastolic, 0) / entries.length),
    hr: entries.filter(e => e.heart_rate).length
      ? Math.round(entries.filter(e => e.heart_rate).reduce((s, e) => s + e.heart_rate, 0) / entries.filter(e => e.heart_rate).length)
      : null,
  } : null

  // Group by date
  const byDate = entries.reduce((acc, e) => {
    const d = e.measured_at.split('T')[0]
    if (!acc[d]) acc[d] = []
    acc[d].push(e)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-700 flex items-center gap-2">
            <Heart className="text-red-500" /> Bloeddruk & Hartslag
          </h1>
          <p className="text-gray-500 text-sm mt-1">{entries.length} metingen</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPrint(true)} className="btn-ghost flex items-center gap-2 border border-gray-200">
            <Printer size={16} /> Afdrukken
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Meting toevoegen
          </button>
        </div>
      </div>

      {/* Stats & Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {avg && (
          <>
            <div className="stat-card">
              <span className="text-xs text-gray-500">Gem. systolisch</span>
              <span className="text-3xl font-bold text-navy-700">{avg.sys}</span>
              <span className="text-xs text-gray-400">mmHg</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-500">Gem. diastolisch</span>
              <span className="text-3xl font-bold text-navy-700">{avg.dia}</span>
              <span className="text-xs text-gray-400">mmHg</span>
            </div>
            {avg.hr && (
              <div className="stat-card">
                <span className="text-xs text-gray-500">Gem. hartslag</span>
                <span className="text-3xl font-bold text-navy-700">{avg.hr}</span>
                <span className="text-xs text-gray-400">bpm</span>
              </div>
            )}
          </>
        )}
        <div className="stat-card">
          <span className="text-xs text-gray-500 mb-2 block">Periode</span>
          {[7, 14, 30, 90, 0].map(d => (
            <button
              key={d}
              onClick={() => setFilterDays(d)}
              className={`block w-full text-left px-2 py-1 rounded text-sm mb-1 ${filterDays === d ? 'bg-navy-700 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              {d === 0 ? 'Alles' : `Laatste ${d} dagen`}
            </button>
          ))}
        </div>
      </div>

      {/* Reference card */}
      <div className="card bg-navy-50 border-navy-100">
        <h3 className="text-sm font-semibold text-navy-700 mb-2">Bloeddruk referentiewaarden (WHO)</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { label: 'Optimaal', range: '<120/<80', color: 'bg-green-100 text-green-700' },
            { label: 'Normaal', range: '120-129/80-84', color: 'bg-green-50 text-green-600' },
            { label: 'Hoog-normaal', range: '130-139/85-89', color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Graad 1', range: '140-159/90-99', color: 'bg-orange-50 text-orange-700' },
            { label: 'Graad 2', range: '160-179/100-109', color: 'bg-red-50 text-red-700' },
            { label: 'Graad 3', range: '≥180/≥110', color: 'bg-red-100 text-red-800' },
          ].map(c => (
            <span key={c.label} className={`px-2 py-1 rounded-full ${c.color}`}>
              <strong>{c.label}:</strong> {c.range} mmHg
            </span>
          ))}
        </div>
      </div>

      {/* Entries grouped by date */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <Heart size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nog geen metingen gevonden</p>
          </div>
        ) : (
          Object.entries(byDate).map(([date, dayEntries]) => (
            <div key={date} className="card">
              <h3 className="text-sm font-semibold text-navy-700 mb-3 pb-2 border-b border-gray-100">
                {format(new Date(date), "EEEE d MMMM yyyy", { locale: nl })}
                <span className="ml-2 text-xs text-gray-400 font-normal">({dayEntries.length} meting{dayEntries.length > 1 ? 'en' : ''})</span>
              </h3>
              <div className="space-y-2">
                {dayEntries.map(entry => {
                  const cat = bpCategory(entry.systolic, entry.diastolic)
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-2xl font-bold text-navy-700">{entry.systolic}/{entry.diastolic}</span>
                          <span className="text-xs text-gray-400 ml-1">mmHg</span>
                        </div>
                        {entry.heart_rate && (
                          <div className="flex items-center gap-1 text-red-500">
                            <Heart size={14} />
                            <span className="text-sm font-medium">{entry.heart_rate} bpm</span>
                          </div>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span>
                        <span className="text-xs text-gray-400">{entry.measured_at.split('T')[1]?.substring(0, 5)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {entry.notes && (
                          <span className="text-xs text-gray-500 max-w-40 truncate" title={entry.notes}>{entry.notes}</span>
                        )}
                        <div className="flex gap-1">
                          <button onClick={() => { setEditing(entry); setShowForm(true) }} className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteId(entry.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Meting bewerken' : 'Bloeddruk meting toevoegen'}>
        <BPForm initial={editing} onSave={handleSave} onClose={() => setShowForm(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        title="Meting verwijderen"
        message="Weet je zeker dat je deze meting wilt verwijderen?"
      />

      <PrintReport
        isOpen={showPrint}
        onClose={() => setShowPrint(false)}
        type="bloeddruk"
        title="Bloeddruk Rapport"
        entries={entries}
        period={filterDays}
      />
    </div>
  )
}
