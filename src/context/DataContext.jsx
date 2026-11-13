import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  getMyHabits, getMyLogs, getAppConfig, createHabit, updateHabit, deleteHabit,
  insertLog, updateLog, deleteLogs,
} from '../lib/queries'
import { buildIndex } from '../lib/scoring'

const DataContext = createContext(null)
const OFFLINE_MSG = 'Hors ligne : reconnecte-toi à internet pour enregistrer.'

// Copie locale des données : permet de consulter l'app sans réseau (lecture seule).
function readCache(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}
function writeCache(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* stockage indisponible */ }
}

export function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])
  return online
}

export function DataProvider({ children }) {
  const { session } = useAuth()
  const userId = session?.user?.id
  const cacheKey = userId ? `fissure:data:${userId}` : null

  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stale, setStale] = useState(false) // true = données issues de la copie locale
  const online = useOnline()
  const fresh = useRef(false)

  const reload = useCallback(async () => {
    if (!userId) return
    let h, l, c
    try {
      ;[h, l, c] = await Promise.all([getMyHabits(userId), getMyLogs(userId), getAppConfig()])
    } catch {
      h = { error: true }; l = { error: true }; c = {}
    }
    if (h.error || l.error) {
      const cached = readCache(cacheKey)
      if (cached) {
        setHabits(cached.habits || []); setLogs(cached.logs || []); setConfig(cached.config || {})
        setStale(true)
        setError('')
      } else {
        setError('Impossible de charger tes données. Réessaie dans un instant.')
      }
    } else {
      fresh.current = true
      setStale(false)
      setError('')
      setHabits(h.data || []); setLogs(l.data || []); setConfig(c || {})
    }
    setLoading(false)
  }, [userId, cacheKey])

  useEffect(() => { reload() }, [reload])

  // Retour du réseau : on recharge les vraies données
  useEffect(() => { if (online && stale) reload() }, [online, stale, reload])

  // Mise à jour de la copie locale (seulement à partir de données fraîches)
  useEffect(() => {
    if (!cacheKey || loading || !fresh.current || stale) return
    writeCache(cacheKey, { habits, logs, config, savedAt: Date.now() })
  }, [habits, logs, config, loading, stale, cacheKey])

  const idx = useMemo(() => buildIndex(logs), [logs])
  const startDate = config.start_date || '2026-01-01'

  const blocked = () => {
    if (!navigator.onLine || stale) { setError(OFFLINE_MSG); return true }
    return false
  }

  // Fixe la valeur d'un jour pour une habitude (0 = efface). Une seule ligne par habitude et par jour.
  async function setDayValue(habit, day, value) {
    if (blocked()) return
    const v = Number(value)
    const existing = logs.filter(l => l.habit_id === habit.id && l.date === day)

    if (!(v > 0)) {
      if (!existing.length) return
      const ids = existing.map(l => l.id)
      setLogs(prev => prev.filter(l => !ids.includes(l.id)))
      const { error } = await deleteLogs(ids)
      if (error) { setError("L'enregistrement a échoué."); reload() }
      return
    }

    if (existing.length) {
      const [first, ...rest] = existing
      const restIds = rest.map(l => l.id)
      setLogs(prev => prev.filter(l => !restIds.includes(l.id)).map(l => (l.id === first.id ? { ...l, value: v } : l)))
      const { error } = await updateLog(first.id, v)
      if (!error && restIds.length) await deleteLogs(restIds)
      if (error) { setError("L'enregistrement a échoué."); reload() }
      return
    }

    const { data, error } = await insertLog(userId, habit.id, day, v)
    if (error) { setError("L'enregistrement a échoué."); return }
    setLogs(prev => [...prev, data])
  }

  async function saveHabit(habit) {
    if (blocked()) return false
    const { id, ...fields } = habit
    const res = id ? await updateHabit(id, fields) : await createHabit(userId, fields)
    if (res.error) { setError("La sauvegarde de l'habitude a échoué."); return false }
    setHabits(prev => (id ? prev.map(h => (h.id === id ? res.data : h)) : [...prev, res.data]))
    return true
  }

  async function removeHabit(id) {
    if (blocked()) return
    const { error } = await deleteHabit(id)
    if (error) { setError('La suppression a échoué.'); return }
    setHabits(prev => prev.filter(h => h.id !== id))
    setLogs(prev => prev.filter(l => l.habit_id !== id))
  }

  return (
    <DataContext.Provider value={{
      habits, logs, idx, config, startDate, loading, error, setError, online, stale,
      reload, setDayValue, saveHabit, removeHabit,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
