import { supabase } from './supabase'

// ─── AUTH ────────────────────────────────────────────
export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  })
  return { data, error }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  return await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// ─── PROFILS ─────────────────────────────────────────
export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('joined_at', { ascending: true })
  return { data, error }
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  return { data, error }
}

// ─── ENTRIES ─────────────────────────────────────────
export async function addEntry(userId, entry) {
  const { data, error } = await supabase
    .from('entries')
    .insert({ user_id: userId, ...entry })
  return { data, error }
}

export async function getEntriesByUser(userId) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  return { data, error }
}

export async function deleteEntry(entryId) {
  const { data, error } = await supabase
    .from('entries')
    .delete()
    .eq('id', entryId)
  return { data, error }
}

// ─── STATS LEADERBOARD ───────────────────────────────
export async function getLeaderboard(year = new Date().getFullYear()) {
  const { data: profiles } = await getAllProfiles()
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)

  if (!profiles || !entries) return []

  return profiles.map(profile => {
    const userEntries = entries.filter(e => e.user_id === profile.id)

    const seances = userEntries.filter(e => e.activity_type === 'muscu').length
    const pas = userEntries
      .filter(e => e.activity_type === 'pas')
      .reduce((sum, e) => sum + e.value, 0)
    const annexe = userEntries.filter(e => e.activity_type === 'annexe').length

    return { ...profile, seances, pas, annexe }
  })
}

// ─── STATS HEBDOMADAIRES ─────────────────────────────
export async function getWeekEntries(userId) {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)
  const mondayStr = monday.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', mondayStr)
  return { data, error }
}
