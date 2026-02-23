import { useState, useEffect, useContext } from 'react'
import { BarChart2, Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PrintReport from '../components/ui/PrintReport'
import PrintCategoryModal from '../components/ui/PrintCategoryModal'
import { ProfileContext } from '../App'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart, ComposedChart
} from 'recharts'
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns'
import { nl } from 'date-fns/locale'

const PERIODS = [
  { label: '7 dagen', days: 7 },
  { label: '30 dagen', days: 30 },
  { label: '90 dagen', days: 90 },
  { label: '6 maanden', days: 180 },
  { label: '1 jaar', days: 365 },
]

function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <h3 className="text-base font-semibold text-navy-700 mb-4">{title}</h3>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-navy-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>{unit ? ` ${unit}` : ''}
        </p>
      ))}
    </div>
  )
}

export default function Rapporten() {
  const { profile } = useContext(ProfileContext)
  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(true)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [bpData, setBpData] = useState([])
  const [rawBpEntries, setRawBpEntries] = useState([])
  const [weightData, setWeightData] = useState([])
  const [activityData, setActivityData] = useState([])
  const [nutData, setNutData] = useState([])
  const [activityTypes, setActivityTypes] = useState([])
  const [actBySport, setActBySport] = useState([])

  useEffect(() => { loadAll() }, [period])

  async function loadAll() {
    setLoading(true)
    const since = subDays(new Date(), period).toISOString()

    const [bpRes, wRes, aRes, nRes, typesRes] = await Promise.all([
      supabase.from('ht_blood_pressure').select('*').gte('measured_at', since).order('measured_at'),
      supabase.from('ht_weight_entries').select('*').gte('measured_at', since).order('measured_at'),
      supabase.from('ht_activities').select('*, ht_activity_types(name, icon)').gte('activity_date', since.split('T')[0]).order('activity_date'),
      supabase.from('ht_nutrition_entries').select('*').gte('logged_at', since).order('logged_at'),
      supabase.from('ht_activity_types').select('*'),
    ])

    // Raw BP entries for print report
    setRawBpEntries(bpRes.data ?? [])

    // Blood pressure: individual measurements (alle metingen op dezelfde dag apart tonen)
    const bpEntries = bpRes.data ?? []
    const countByDay = {}
    bpEntries.forEach(e => {
      const d = e.measured_at.split('T')[0]
      countByDay[d] = (countByDay[d] || 0) + 1
    })
    setBpData(bpEntries.map(e => {
      const d = e.measured_at.split('T')[0]
      const label = countByDay[d] > 1
        ? format(new Date(e.measured_at), 'd MMM HH:mm', { locale: nl })
        : format(new Date(e.measured_at), 'd MMM', { locale: nl })
      return {
        date: label,
        timestamp: e.measured_at,
        systolisch: e.systolic,
        diastolisch: e.diastolic,
        hartslag: e.heart_rate ?? null,
      }
    }))

    // Weight data
    setWeightData((wRes.data ?? []).map(w => ({
      date: format(new Date(w.measured_at), 'd MMM', { locale: nl }),
      gewicht: parseFloat(w.weight_kg),
      bmi: w.bmi ? parseFloat(w.bmi) : null,
    })))

    // Activities: by day (duration in minutes)
    const actByDay = {}
    ;(aRes.data ?? []).forEach(a => {
      const d = a.activity_date
      if (!actByDay[d]) actByDay[d] = { minuten: 0, kcal: 0, count: 0 }
      actByDay[d].minuten += Math.round((a.duration_seconds ?? 0) / 60)
      actByDay[d].kcal += a.calories_burned ?? 0
      actByDay[d].count += 1
    })
    setActivityData(Object.entries(actByDay).map(([date, v]) => ({
      date: format(new Date(date), 'd MMM', { locale: nl }),
      Minuten: v.minuten,
      Calorieën: v.kcal,
      Sessies: v.count,
    })))

    // Activities by sport type
    const byType = {}
    ;(aRes.data ?? []).forEach(a => {
      const name = a.ht_activity_types?.name ?? 'Onbekend'
      const icon = a.ht_activity_types?.icon ?? '🏃'
      if (!byType[name]) byType[name] = { name: `${icon} ${name}`, count: 0, minuten: 0, kcal: 0 }
      byType[name].count++
      byType[name].minuten += Math.round((a.duration_seconds ?? 0) / 60)
      byType[name].kcal += a.calories_burned ?? 0
    })
    setActBySport(Object.values(byType).sort((a, b) => b.count - a.count))

    // Nutrition: daily totals
    const nutByDay = {}
    ;(nRes.data ?? []).forEach(n => {
      const d = n.logged_at.split('T')[0]
      if (!nutByDay[d]) nutByDay[d] = { kcal: 0, eiwit: 0, koolhydraten: 0, vetten: 0 }
      nutByDay[d].kcal += n.calories_kcal ?? 0
      nutByDay[d].eiwit += n.protein_g ?? 0
      nutByDay[d].koolhydraten += n.carbs_g ?? 0
      nutByDay[d].vetten += n.fat_g ?? 0
    })
    setNutData(Object.entries(nutByDay).map(([date, v]) => ({
      date: format(new Date(date), 'd MMM', { locale: nl }),
      Calorieën: Math.round(v.kcal),
      Eiwit: Math.round(v.eiwit),
      Koolhydraten: Math.round(v.koolhydraten),
      Vetten: Math.round(v.vetten),
    })))

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-700 flex items-center gap-2">
            <BarChart2 className="text-teal-600" /> Rapporten & Grafieken
          </h1>
          <p className="text-gray-500 text-sm mt-1">Overzicht van je gezondheidsdata</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {!loading && (
            <button onClick={() => setShowCategoryModal(true)} className="btn-ghost flex items-center gap-2 border border-gray-200">
              <Printer size={16} /> Afdrukken
            </button>
          )}
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${period === p.days ? 'bg-navy-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-700"></div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Bloeddruk */}
          <ChartCard title="📊 Bloeddruk verloop">
            {bpData.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Geen bloeddrukdata in deze periode</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={bpData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip unit="mmHg" />} />
                  <Legend />
                  <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Optimaal sys', fontSize: 10, fill: '#22c55e' }} />
                  <ReferenceLine y={140} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Grens hoog', fontSize: 10, fill: '#f97316' }} />
                  <Area type="monotone" dataKey="systolisch" stroke="#1b3a6b" fill="#dbeafe" strokeWidth={2} name="Systolisch" dot={{ r: 4, fill: '#1b3a6b' }} />
                  <Line type="monotone" dataKey="diastolisch" stroke="#0d9488" strokeWidth={2} dot={{ r: 4, fill: '#0d9488' }} name="Diastolisch" />
                  {bpData.some(d => d.hartslag) && (
                    <Line type="monotone" dataKey="hartslag" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} name="Hartslag (bpm)" />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Gewicht */}
          <ChartCard title="⚖️ Gewichtsverloop">
            {weightData.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Geen gewichtsdata in deze periode</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip unit="kg" />} />
                  <Legend />
                  <Area type="monotone" dataKey="gewicht" stroke="#0d9488" fill="#ccfbf1" strokeWidth={2} name="Gewicht (kg)" dot={{ r: 4, fill: '#0d9488' }} />
                  {weightData.some(d => d.bmi) && (
                    <Line type="monotone" dataKey="bmi" stroke="#7c3aed" strokeWidth={2} dot={false} name="BMI" yAxisId="right" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Activiteiten + sport breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="🏃 Activiteiten per dag" className="lg:col-span-2">
              {activityData.length === 0 ? (
                <div className="text-center py-12 text-gray-400">Geen activiteitendata in deze periode</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Minuten" fill="#1b3a6b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Calorieën" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="🥇 Per sporttype">
              {actBySport.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Geen data</div>
              ) : (
                <div className="space-y-3">
                  {actBySport.map((s, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-navy-700">{s.name}</span>
                        <span className="text-gray-500">{s.count}x</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-navy-700 h-2 rounded-full transition-all"
                          style={{ width: `${(s.count / actBySport[0].count) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{s.minuten} min · {s.kcal} kcal</p>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          </div>

          {/* Voeding */}
          <ChartCard title="🥗 Calorie- en macronutriënten inname">
            {nutData.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Geen voedingsdata in deze periode</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={nutData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="Calorieën" fill="#1b3a6b" radius={[4, 4, 0, 0]} opacity={0.8} />
                  <Line yAxisId="right" type="monotone" dataKey="Eiwit" stroke="#0d9488" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="Koolhydraten" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="Vetten" stroke="#d97706" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <span className="text-xs text-gray-500">Activiteiten ({period}d)</span>
              <span className="text-3xl font-bold text-navy-700">{actBySport.reduce((s, a) => s + a.count, 0)}</span>
              <span className="text-xs text-gray-400">sessies</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-500">Totaal actief ({period}d)</span>
              <span className="text-3xl font-bold text-navy-700">{actBySport.reduce((s, a) => s + a.minuten, 0)}</span>
              <span className="text-xs text-gray-400">minuten</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-500">Verbrand ({period}d)</span>
              <span className="text-3xl font-bold text-navy-700">{actBySport.reduce((s, a) => s + a.kcal, 0).toLocaleString()}</span>
              <span className="text-xs text-gray-400">kcal</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-gray-500">BP metingen ({period}d)</span>
              <span className="text-3xl font-bold text-navy-700">{bpData.length}</span>
              <span className="text-xs text-gray-400">metingen</span>
            </div>
          </div>
        </div>
      )}

      <PrintCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onPrint={cats => {
          setSelectedCategories(cats)
          setShowCategoryModal(false)
          setShowPrint(true)
        }}
      />

      <PrintReport
        isOpen={showPrint}
        onClose={() => setShowPrint(false)}
        type="rapporten"
        title={`Gezondheidsrapport – laatste ${period} dagen`}
        rawBpEntries={rawBpEntries}
        weightData={weightData}
        actBySport={actBySport}
        nutData={nutData}
        period={period}
        profile={profile}
        selectedCategories={selectedCategories}
      />
    </div>
  )
}
