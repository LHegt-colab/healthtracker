import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://opnpcbwalaybspyhyzki.supabase.co'
const supabaseKey = 'sb_publishable_jfgJ-268JH5ZN9yh7OsBfQ_PQoOPusR'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'healthtracker' }
})
