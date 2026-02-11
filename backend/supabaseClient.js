
import { createClient } from '@supabase/supabase-js'

let supabase = null

function getEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required.`)
  }
  return value
}

export function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = getEnv('SUPABASE_URL')
    const supabaseKey = getEnv('SUPABASE_ANON_KEY')
    supabase = createClient(supabaseUrl, supabaseKey)
  }
  return supabase
}
