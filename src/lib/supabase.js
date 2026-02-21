import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://opnpcbwalaybspyhyzki.supabase.co'
const supabaseKey = 'sb_publishable_jfgJ-268JH5ZN9yh7OsBfQ_PQoOPusR'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tabel namen met ht_ prefix (public schema)
export const T = {
  activityTypes: 'ht_activity_types',
  activities: 'ht_activities',
  bloodPressure: 'ht_blood_pressure',
  weightEntries: 'ht_weight_entries',
  nutritionEntries: 'ht_nutrition_entries',
}
