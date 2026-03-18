import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rhnibkbqwcflfnuexmnm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmlia2Jxd2NmbGZudWV4bW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTg5ODEsImV4cCI6MjA4OTQzNDk4MX0.M_N6LTGDS_p8GPCMEVFcfVgAhWO1W67kGXorcOqu5v8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
