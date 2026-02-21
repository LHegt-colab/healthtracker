import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Heart, Scale, BarChart2, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format, subDays, startOfToday } from 'date-fns'
import { nl } from 'date-fns/locale'

function StatCard({ title, value, unit, icon: Icon, color, trend, trendLabel, to }) {
  const colorMap = {
    navy: 'bg-navy-700 text-white',
    teal: 'bg-teal-600 text-white',
    green: 'bg-green-600 text-white',
    purple: 'bg-purple-600 text-white',
  }

  return (
    <Link to={to} className="stat-card hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-navy-700">{value ?? '—'}</span>
        {unit && <span className="text-sm text-gray-500 mb-1">{unit}</span>}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2 text-xs">
          {trend > 0 ? <TrendingUp size={14} className="text-red-500" /> :
           trend < 0 ? <TrendingDown size={14} className="text-green-500" /> :
           <Minus size={14} className="text-gray-400" />}
          <span className="text-gray-500">{trendLabel}</span>
        </div>
      )}
      <div className="flex items-center gap-1 mt-3 text-xs text-teal-600 font-medium group-hover:text-teal-700">
        Bekijk alles <ChevronRight size={14} />
      </div>
    </Link>
  )
}

function RecentActivity({ activity }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{activity.icon}</span>
        <div>
          <p className="text-sm font-medium text-navy-700">{activity.type}</p>
          <p className="text-xs text-gray-400">{activity.date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-navy-700">{activity.main}</p>
        <p className="text-xs text-gray-400">{activity.sub}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    lastBP: null,
    lastWeight: null,
    todayCalories: null,
    weekActivities: null,
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [recentBP, setRecentBP] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const today = startOfToday()
    const weekAgo = subDays(today, 7)

    const [bpRes, weightRes, nutRes, actRes, recentActRes, recentBPRes] = await Promise.all([
      supabase.from('blood_pressure').select('*').order('measured_at', { ascending: false }).limit(1),
      supabase.from('weight_entries').select('*').order('measured_at', { ascending: false }).limit(2),
      supabase.from('nutrition_entries').select('calories_kcal').gte('logged_at', today.toISOString()),
      supabase.from('activities').select('id').gte('activity_date', weekAgo.toISOString().split('T')[0]),
      supabase.from('activities').select('*, activity_types(name, icon)').order('activity_date', { ascending: false }).limit(5),
      supabase.from('blood_pressure').select('*').order('measured_at', { ascending: false }).limit(5),
    ])

    const todayCalories = nutRes.data?.reduce((sum, r) => sum + (r.calories_kcal || 0), 0)
    const weightTrend = weightRes.data?.length >= 2
      ? weightRes.data[0].weight_kg - weightRes.data[1].weight_kg
      : null

    setStats({
      lastBP: bpRes.data?.[0] ? `${bpRes.data[0].systolic}/${bpRes.data[0].diastolic}` : null,
      lastWeight: weightRes.data?.[0]?.weight_kg ?? null,
      todayCalories: todayCalories ? Math.round(todayCalories) : null,
      weekActivities: actRes.data?.length ?? 0,
      weightTrend,
    })

    setRecentActivities(recentActRes.data?.map(a => ({
      icon: a.activity_types?.icon ?? '🏃',
      type: a.activity_types?.name ?? 'Activiteit',
      date: format(new Date(a.activity_date), 'd MMMM', { locale: nl }),
      main: a.duration_seconds ? `${Math.floor(a.duration_seconds / 60)} min` : '—',
      sub: a.distance_km ? `${a.distance_km} km` : a.calories_burned ? `${a.calories_burned} kcal` : '',
    })) ?? [])

    setRecentBP(recentBPRes.data?.map(bp => ({
      value: `${bp.systolic}/${bp.diastolic}`,
      hr: bp.heart_rate,
      time: format(new Date(bp.measured_at), 'EEE d MMM HH:mm', { locale: nl }),
    })) ?? [])

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-700"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-navy-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">💚</span>
          <div>
            <h1 className="text-2xl font-bold">Gezondheid Tracker</h1>
            <p className="text-blue-200 text-sm">{format(new Date(), "EEEE d MMMM yyyy", { locale: nl })}</p>
          </div>
        </div>
        <p className="text-blue-100 text-sm mt-2">Welkom terug! Hier is je dagelijks gezondheidsoverzicht.</p>
      </div>

      {/* Stats Grid */}
      <div>
        <h2 className="section-title">Overzicht</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Bloeddruk (laatste)"
            value={stats.lastBP}
            unit="mmHg"
            icon={Heart}
            color="navy"
            to="/bloeddruk"
          />
          <StatCard
            title="Gewicht (laatste)"
            value={stats.lastWeight}
            unit="kg"
            icon={Scale}
            color="teal"
            trend={stats.weightTrend}
            trendLabel={stats.weightTrend ? `${stats.weightTrend > 0 ? '+' : ''}${stats.weightTrend?.toFixed(1)} kg` : ''}
            to="/gewicht-voeding"
          />
          <StatCard
            title="Calorieën vandaag"
            value={stats.todayCalories}
            unit="kcal"
            icon={BarChart2}
            color="green"
            to="/gewicht-voeding"
          />
          <StatCard
            title="Activiteiten (7 dagen)"
            value={stats.weekActivities}
            unit="sessies"
            icon={Activity}
            color="purple"
            to="/activiteiten"
          />
        </div>
      </div>

      {/* Recent sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activities */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy-700 flex items-center gap-2">
              <Activity size={18} className="text-teal-600" />
              Recente activiteiten
            </h2>
            <Link to="/activiteiten" className="text-xs text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
              Alles <ChevronRight size={14} />
            </Link>
          </div>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Activity size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nog geen activiteiten geregistreerd</p>
              <Link to="/activiteiten" className="text-xs text-teal-600 mt-2 inline-block">
                Eerste activiteit toevoegen →
              </Link>
            </div>
          ) : (
            recentActivities.map((a, i) => <RecentActivity key={i} activity={a} />)
          )}
        </div>

        {/* Recent blood pressure */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy-700 flex items-center gap-2">
              <Heart size={18} className="text-red-500" />
              Bloeddruk metingen
            </h2>
            <Link to="/bloeddruk" className="text-xs text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
              Alles <ChevronRight size={14} />
            </Link>
          </div>
          {recentBP.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Heart size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nog geen bloeddrukmetingen</p>
              <Link to="/bloeddruk" className="text-xs text-teal-600 mt-2 inline-block">
                Eerste meting toevoegen →
              </Link>
            </div>
          ) : (
            recentBP.map((bp, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-lg font-bold text-navy-700">{bp.value} <span className="text-xs text-gray-400 font-normal">mmHg</span></p>
                  <p className="text-xs text-gray-400">{bp.time}</p>
                </div>
                {bp.hr && (
                  <div className="flex items-center gap-1 text-red-500">
                    <Heart size={14} />
                    <span className="text-sm font-medium">{bp.hr} bpm</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
