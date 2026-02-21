import { useState, useEffect, useContext } from 'react'
import { Plus, Pencil, Trash2, Scale, Utensils } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { ToastContext } from '../App'
import { format, startOfToday, subDays } from 'date-fns'
import { nl } from 'date-fns/locale'

const MEAL_TYPES = [
  { value: 'ontbijt', label: '🌅 Ontbijt' },
  { value: 'lunch', label: '☀️ Lunch' },
  { value: 'avondeten', label: '🌙 Avondeten' },
  { value: 'tussendoortje', label: '🍎 Tussendoortje' },
  { value: 'overig', label: '🍽️ Overig' },
]

function WeightForm({ initial, onSave, onClose }) {
  const now = new Date()
  const [form, setForm] = useState({
    measured_at_date: initial ? initial.measured_at.split('T')[0] : now.toISOString().split('T')[0],
    measured_at_time: initial
      ? initial.measured_at.split('T')[1]?.substring(0, 5)
      : `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    weight_kg: initial?.weight_kg ?? '',
    bmi: initial?.bmi ?? '',
    notes: initial?.notes ?? '',
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    await onSave({
      measured_at: `${form.measured_at_date}T${form.measured_at_time}:00`,
      weight_kg: Number(form.weight_kg),
      bmi: form.bmi ? Number(form.bmi) : null,
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
          <label className="form-label">Tijd</label>
          <input className="form-input" type="time" value={form.measured_at_time} onChange={e => set('measured_at_time', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Gewicht (kg) *</label>
          <input className="form-input" type="number" step="0.1" min="20" max="500" placeholder="75.5" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">BMI (optioneel)</label>
          <input className="form-input" type="number" step="0.1" min="10" max="70" placeholder="22.5" value={form.bmi} onChange={e => set('bmi', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="form-label">Opmerkingen</label>
          <textarea className="form-input resize-none" rows={3} placeholder="Bijv. na het sporten, ochtendsgewicht..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Annuleren</button>
        <button type="submit" className="btn-primary">{initial ? 'Opslaan' : 'Toevoegen'}</button>
      </div>
    </form>
  )
}

function NutritionForm({ initial, onSave, onClose }) {
  const now = new Date()
  const [form, setForm] = useState({
    logged_at_date: initial ? initial.logged_at.split('T')[0] : now.toISOString().split('T')[0],
    logged_at_time: initial
      ? initial.logged_at.split('T')[1]?.substring(0, 5)
      : `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    meal_type: initial?.meal_type ?? 'overig',
    food_name: initial?.food_name ?? '',
    quantity_g: initial?.quantity_g ?? '',
    calories_kcal: initial?.calories_kcal ?? '',
    protein_g: initial?.protein_g ?? '',
    carbs_g: initial?.carbs_g ?? '',
    fat_g: initial?.fat_g ?? '',
    fiber_g: initial?.fiber_g ?? '',
    notes: initial?.notes ?? '',
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    await onSave({
      logged_at: `${form.logged_at_date}T${form.logged_at_time}:00`,
      meal_type: form.meal_type,
      food_name: form.food_name.trim(),
      quantity_g: form.quantity_g ? Number(form.quantity_g) : null,
      calories_kcal: form.calories_kcal ? Number(form.calories_kcal) : null,
      protein_g: form.protein_g ? Number(form.protein_g) : null,
      carbs_g: form.carbs_g ? Number(form.carbs_g) : null,
      fat_g: form.fat_g ? Number(form.fat_g) : null,
      fiber_g: form.fiber_g ? Number(form.fiber_g) : null,
      notes: form.notes || null,
    }, initial?.id)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Datum *</label>
          <input className="form-input" type="date" value={form.logged_at_date} onChange={e => set('logged_at_date', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Tijd</label>
          <input className="form-input" type="time" value={form.logged_at_time} onChange={e => set('logged_at_time', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Maaltijd</label>
          <select className="form-select" value={form.meal_type} onChange={e => set('meal_type', e.target.value)}>
            {MEAL_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Portiegrootte (g/ml)</label>
          <input className="form-input" type="number" min="0" placeholder="150" value={form.quantity_g} onChange={e => set('quantity_g', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="form-label">Naam voedingsmiddel *</label>
          <input className="form-input" type="text" placeholder="Bijv. Havermout met banaan" value={form.food_name} onChange={e => set('food_name', e.target.value)} required />
        </div>

        <div className="col-span-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Voedingswaarden (per portie)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Calorieën (kcal)</label>
              <input className="form-input" type="number" min="0" step="0.1" placeholder="350" value={form.calories_kcal} onChange={e => set('calories_kcal', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Eiwitten (g)</label>
              <input className="form-input" type="number" min="0" step="0.1" placeholder="12" value={form.protein_g} onChange={e => set('protein_g', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Koolhydraten (g)</label>
              <input className="form-input" type="number" min="0" step="0.1" placeholder="45" value={form.carbs_g} onChange={e => set('carbs_g', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Vetten (g)</label>
              <input className="form-input" type="number" min="0" step="0.1" placeholder="8" value={form.fat_g} onChange={e => set('fat_g', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Vezels (g)</label>
              <input className="form-input" type="number" min="0" step="0.1" placeholder="5" value={form.fiber_g} onChange={e => set('fiber_g', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <label className="form-label">Opmerkingen</label>
          <textarea className="form-input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Annuleren</button>
        <button type="submit" className="btn-primary">{initial ? 'Opslaan' : 'Toevoegen'}</button>
      </div>
    </form>
  )
}

export default function GewichtVoeding() {
  const addToast = useContext(ToastContext)
  const [tab, setTab] = useState('gewicht')
  const [weights, setWeights] = useState([])
  const [nutrition, setNutrition] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWeightForm, setShowWeightForm] = useState(false)
  const [showNutForm, setShowNutForm] = useState(false)
  const [editingWeight, setEditingWeight] = useState(null)
  const [editingNut, setEditingNut] = useState(null)
  const [deleteWeightId, setDeleteWeightId] = useState(null)
  const [deleteNutId, setDeleteNutId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [wRes, nRes] = await Promise.all([
      supabase.from('ht_weight_entries').select('*').order('measured_at', { ascending: false }),
      supabase.from('ht_nutrition_entries').select('*').order('logged_at', { ascending: false }),
    ])
    setWeights(wRes.data ?? [])
    setNutrition(nRes.data ?? [])
    setLoading(false)
  }

  async function saveWeight(payload, id) {
    if (id) {
      const { error } = await supabase.from('ht_weight_entries').update(payload).eq('id', id)
      if (error) { addToast('Fout bij opslaan', 'error'); return }
      addToast('Gewicht bijgewerkt')
    } else {
      const { error } = await supabase.from('ht_weight_entries').insert(payload)
      if (error) { addToast('Fout bij toevoegen', 'error'); return }
      addToast('Gewicht toegevoegd')
    }
    loadAll()
  }

  async function deleteWeight(id) {
    const { error } = await supabase.from('ht_weight_entries').delete().eq('id', id)
    if (error) { addToast('Fout bij verwijderen', 'error'); return }
    addToast('Gewicht verwijderd')
    loadAll()
  }

  async function saveNut(payload, id) {
    if (id) {
      const { error } = await supabase.from('ht_nutrition_entries').update(payload).eq('id', id)
      if (error) { addToast('Fout bij opslaan', 'error'); return }
      addToast('Voeding bijgewerkt')
    } else {
      const { error } = await supabase.from('ht_nutrition_entries').insert(payload)
      if (error) { addToast('Fout bij toevoegen', 'error'); return }
      addToast('Voeding toegevoegd')
    }
    loadAll()
  }

  async function deleteNut(id) {
    const { error } = await supabase.from('ht_nutrition_entries').delete().eq('id', id)
    if (error) { addToast('Fout bij verwijderen', 'error'); return }
    addToast('Voeding verwijderd')
    loadAll()
  }

  // Today's nutrition totals
  const todayNut = nutrition.filter(n => n.logged_at.startsWith(selectedDate))
  const totals = {
    kcal: todayNut.reduce((s, n) => s + (n.calories_kcal ?? 0), 0),
    protein: todayNut.reduce((s, n) => s + (n.protein_g ?? 0), 0),
    carbs: todayNut.reduce((s, n) => s + (n.carbs_g ?? 0), 0),
    fat: todayNut.reduce((s, n) => s + (n.fat_g ?? 0), 0),
    fiber: todayNut.reduce((s, n) => s + (n.fiber_g ?? 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-700 flex items-center gap-2">
            <Scale className="text-teal-600" /> Gewicht & Voeding
          </h1>
        </div>
        <button
          onClick={() => tab === 'gewicht' ? (setEditingWeight(null), setShowWeightForm(true)) : (setEditingNut(null), setShowNutForm(true))}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> {tab === 'gewicht' ? 'Gewicht toevoegen' : 'Voeding toevoegen'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('gewicht')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'gewicht' ? 'bg-white shadow-sm text-navy-700' : 'text-gray-500 hover:text-navy-700'}`}
        >
          ⚖️ Gewicht
        </button>
        <button
          onClick={() => setTab('voeding')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'voeding' ? 'bg-white shadow-sm text-navy-700' : 'text-gray-500 hover:text-navy-700'}`}
        >
          🥗 Voeding
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700"></div>
        </div>
      ) : tab === 'gewicht' ? (
        /* GEWICHT TAB */
        <div className="space-y-4">
          {/* Stats */}
          {weights.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat-card">
                <span className="text-xs text-gray-500">Huidig gewicht</span>
                <span className="text-3xl font-bold text-navy-700">{weights[0].weight_kg}</span>
                <span className="text-xs text-gray-400">kg</span>
              </div>
              {weights.length >= 2 && (
                <div className="stat-card">
                  <span className="text-xs text-gray-500">Verandering</span>
                  <span className={`text-3xl font-bold ${(weights[0].weight_kg - weights[1].weight_kg) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {(weights[0].weight_kg - weights[1].weight_kg) > 0 ? '+' : ''}{(weights[0].weight_kg - weights[1].weight_kg).toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">kg vs vorige meting</span>
                </div>
              )}
              {weights[0].bmi && (
                <div className="stat-card">
                  <span className="text-xs text-gray-500">BMI</span>
                  <span className="text-3xl font-bold text-navy-700">{weights[0].bmi}</span>
                  <span className="text-xs text-gray-400">
                    {weights[0].bmi < 18.5 ? 'Ondergewicht' : weights[0].bmi < 25 ? 'Gezond' : weights[0].bmi < 30 ? 'Overgewicht' : 'Obesitas'}
                  </span>
                </div>
              )}
              <div className="stat-card">
                <span className="text-xs text-gray-500">Metingen totaal</span>
                <span className="text-3xl font-bold text-navy-700">{weights.length}</span>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="card p-0 overflow-hidden">
            {weights.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Scale size={48} className="mx-auto mb-3 opacity-30" />
                <p>Nog geen gewichtsmetingen</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Datum & Tijd</th>
                    <th className="table-header">Gewicht</th>
                    <th className="table-header">BMI</th>
                    <th className="table-header">Opmerking</th>
                    <th className="table-header w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {weights.map((w, i) => (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="table-cell">{format(new Date(w.measured_at), 'EEE d MMM yyyy HH:mm', { locale: nl })}</td>
                      <td className="table-cell">
                        <span className="font-semibold text-navy-700">{w.weight_kg} kg</span>
                        {i > 0 && (
                          <span className={`ml-2 text-xs ${(w.weight_kg - weights[i-1].weight_kg) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {(w.weight_kg - weights[i-1].weight_kg) > 0 ? '▲' : '▼'}
                            {Math.abs(w.weight_kg - weights[i-1].weight_kg).toFixed(1)}
                          </span>
                        )}
                      </td>
                      <td className="table-cell">{w.bmi ?? '—'}</td>
                      <td className="table-cell max-w-48">
                        {w.notes ? <span className="text-xs text-gray-500 truncate block" title={w.notes}>{w.notes}</span> : '—'}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingWeight(w); setShowWeightForm(true) }} className="p-1.5 text-gray-400 hover:text-navy-700 rounded">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteWeightId(w.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* VOEDING TAB */
        <div className="space-y-4">
          {/* Day selector + totals */}
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="form-label mb-0">Dag:</label>
                <input className="form-input w-40" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              </div>
              {todayNut.length > 0 && (
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-navy-700">{Math.round(totals.kcal)}</div>
                    <div className="text-xs text-gray-400">kcal</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-teal-600">{Math.round(totals.protein)}g</div>
                    <div className="text-xs text-gray-400">eiwit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{Math.round(totals.carbs)}g</div>
                    <div className="text-xs text-gray-400">koolhydr.</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">{Math.round(totals.fat)}g</div>
                    <div className="text-xs text-gray-400">vetten</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{Math.round(totals.fiber)}g</div>
                    <div className="text-xs text-gray-400">vezels</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Nutrition entries by meal type */}
          {MEAL_TYPES.map(meal => {
            const mealEntries = todayNut.filter(n => n.meal_type === meal.value)
            if (mealEntries.length === 0) return null
            const mealKcal = mealEntries.reduce((s, n) => s + (n.calories_kcal ?? 0), 0)
            return (
              <div key={meal.value} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-navy-700">{meal.label}</h3>
                  <span className="text-sm text-gray-500">{Math.round(mealKcal)} kcal</span>
                </div>
                <div className="space-y-2">
                  {mealEntries.map(n => (
                    <div key={n.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-navy-700">{n.food_name}</p>
                        <p className="text-xs text-gray-400">
                          {[
                            n.quantity_g && `${n.quantity_g}g`,
                            n.calories_kcal && `${Math.round(n.calories_kcal)} kcal`,
                            n.protein_g && `${n.protein_g}g eiwit`,
                          ].filter(Boolean).join(' · ')}
                        </p>
                        {n.notes && <p className="text-xs text-gray-400 italic">{n.notes}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingNut(n); setShowNutForm(true) }} className="p-1.5 text-gray-400 hover:text-navy-700 rounded">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteNutId(n.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {todayNut.length === 0 && (
            <div className="card text-center py-12 text-gray-400">
              <Utensils size={48} className="mx-auto mb-3 opacity-30" />
              <p>Nog geen voeding gelogd voor {format(new Date(selectedDate), 'd MMMM', { locale: nl })}</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showWeightForm} onClose={() => setShowWeightForm(false)} title={editingWeight ? 'Gewicht bewerken' : 'Gewicht toevoegen'}>
        <WeightForm initial={editingWeight} onSave={saveWeight} onClose={() => setShowWeightForm(false)} />
      </Modal>
      <Modal isOpen={showNutForm} onClose={() => setShowNutForm(false)} title={editingNut ? 'Voeding bewerken' : 'Voeding toevoegen'} size="lg">
        <NutritionForm initial={editingNut} onSave={saveNut} onClose={() => setShowNutForm(false)} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteWeightId} onClose={() => setDeleteWeightId(null)} onConfirm={() => deleteWeight(deleteWeightId)} title="Gewicht verwijderen" message="Weet je zeker dat je deze meting wilt verwijderen?" />
      <ConfirmDialog isOpen={!!deleteNutId} onClose={() => setDeleteNutId(null)} onConfirm={() => deleteNut(deleteNutId)} title="Voeding verwijderen" message="Weet je zeker dat je dit item wilt verwijderen?" />
    </div>
  )
}
