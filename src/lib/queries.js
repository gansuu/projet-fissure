import { supabase } from './supabase'

// Supabase renvoie au maximum 1000 lignes par requête : on pagine.
async function fetchAll(makeQuery) {
  const size = 1000
  let from = 0
  const out = []
  for (;;) {
    const { data, error } = await makeQuery().range(from, from + size - 1)
    if (error) return { data: null, error }
    out.push(...data)
    if (data.length < size) break
    from += size
  }
  return { data: out, error: null }
}

// ─── AUTH ────────────────────────────────────────────
export async function signUp(email, password, username, inviteCode) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, invite_code: inviteCode } },
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

// ─── PROFILS ─────────────────────────────────────────
export async function getAllProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('joined_at', { ascending: true })
  return { data, error }
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return { data, error }
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId)
  return { data, error }
}

// ─── RÉGLAGES GLOBAUX (date de départ, code d'invitation) ───
export async function getAppConfig() {
  const { data } = await supabase.from('app_config').select('key, value')
  const cfg = {}
  for (const r of data || []) cfg[r.key] = r.value
  return cfg
}

// ─── HABITUDES ───────────────────────────────────────
export async function getMyHabits(userId) {
  const { data, error } = await supabase
    .from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: true })
  return { data, error }
}

// Grâce à la RLS : mes habitudes + celles des autres marquées "groupe"
export async function getVisibleHabits() {
  const { data, error } = await supabase.from('habits').select('*').order('created_at', { ascending: true })
  return { data, error }
}

export async function createHabit(userId, habit) {
  const { data, error } = await supabase
    .from('habits').insert({ user_id: userId, ...habit }).select().single()
  return { data, error }
}

export async function updateHabit(id, updates) {
  const { data, error } = await supabase.from('habits').update(updates).eq('id', id).select().single()
  return { data, error }
}

export async function deleteHabit(id) {
  const { error } = await supabase.from('habits').delete().eq('id', id)
  return { error }
}

// ─── JOURNAL ─────────────────────────────────────────
export async function getMyLogs(userId) {
  return fetchAll(() =>
    supabase.from('habit_logs').select('*').eq('user_id', userId)
      .order('date', { ascending: true }).order('id', { ascending: true }))
}

export async function getUserLogs(userId, from) {
  return fetchAll(() =>
    supabase.from('habit_logs').select('*').eq('user_id', userId).gte('date', from)
      .order('date', { ascending: true }).order('id', { ascending: true }))
}

export async function getLogsRange(from, to) {
  return fetchAll(() =>
    supabase.from('habit_logs').select('*').gte('date', from).lte('date', to)
      .order('date', { ascending: true }).order('id', { ascending: true }))
}

export async function insertLog(userId, habitId, date, value, note = null) {
  const { data, error } = await supabase
    .from('habit_logs').insert({ user_id: userId, habit_id: habitId, date, value, note }).select().single()
  return { data, error }
}

export async function updateLog(id, value) {
  const { error } = await supabase.from('habit_logs').update({ value }).eq('id', id)
  return { error }
}

export async function deleteLogs(ids) {
  const { error } = await supabase.from('habit_logs').delete().in('id', ids)
  return { error }
}

// ─── DÉFIS ───────────────────────────────────────────
export async function getChallenges() {
  const { data, error } = await supabase.from('challenges').select('*').order('start_date', { ascending: false })
  return { data, error }
}

export async function createChallenge(userId, c) {
  const { data, error } = await supabase
    .from('challenges').insert({ created_by: userId, ...c }).select().single()
  return { data, error }
}

export async function deleteChallenge(id) {
  const { error } = await supabase.from('challenges').delete().eq('id', id)
  return { error }
}

export async function getChallengeLogs(habitIds, from, to) {
  if (!habitIds.length) return { data: [], error: null }
  return fetchAll(() =>
    supabase.from('habit_logs').select('*').in('habit_id', habitIds).gte('date', from).lte('date', to)
      .order('date', { ascending: true }).order('id', { ascending: true }))
}

// ─── SYNCHRONISATIONS ────────────────────────────────
export async function getSyncTokens(userId) {
  const { data, error } = await supabase
    .from('sync_tokens').select('id, habit_id, label, created_at, last_used_at')
    .eq('user_id', userId).order('created_at', { ascending: false })
  return { data, error }
}

export async function createSyncToken(userId, habitId, tokenHash, label) {
  const { data, error } = await supabase
    .from('sync_tokens').insert({ user_id: userId, habit_id: habitId, token_hash: tokenHash, label })
    .select('id, habit_id, label, created_at, last_used_at').single()
  return { data, error }
}

export async function deleteSyncToken(id) {
  const { error } = await supabase.from('sync_tokens').delete().eq('id', id)
  return { error }
}

export async function insertLogsBulk(rows) {
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from('habit_logs').insert(rows.slice(i, i + 200))
    if (error) return { error }
  }
  return { error: null }
}
