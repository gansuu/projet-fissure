import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  getMyHabits, getMyLogs, getAppConfig, createHabit, updateHabit, deleteHabit,
  insertLog, updateLog, deleteLogs,
} from '../lib/queries'
import { buildIndex } from '../lib/scoring'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { session } = useAuth()
  const userId = session?.user?.id

  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!userId) return
    const [h, l, c] = await Promise.all([getMyHabits(userId), getMyLogs(userId), getAppConfig()])
    if (h.error || l.error) setError('Impossible de charger tes données. Réessaie dans un instant.')
    else setError('')
    setHabits(h.data || [])
    setLogs(l.data || [])
    setConfig(c || {})
    setLoading(false)
  }, [userId])

  useEffect(() => { reload() }, [reload])

  const idx = useMemo(() => buildIndex(logs), [logs])
  const startDate = config.start_date || '2026-01-01'

  // Fixe la valeur d'un jour pour une habitude (0 = efface). Une seule ligne par habitude et par jour.
  async function setDayValue(habit, day, value) {
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
    const { id, ...fields } = habit
    const res = id ? await updateHabit(id, fields) : await createHabit(userId, fields)
    if (res.error) { setError("La sauvegarde de l'habitude a échoué."); return false }
    setHabits(prev => (id ? prev.map(h => (h.id === id ? res.data : h)) : [...prev, res.data]))
    return true
  }

  async function removeHabit(id) {
    const { error } = await deleteHabit(id)
    if (error) { setError('La suppression a échoué.'); return }
    setHabits(prev => prev.filter(h => h.id !== id))
    setLogs(prev => prev.filter(l => l.habit_id !== id))
  }

  return (
    <DataContext.Provider value={{
      habits, logs, idx, config, startDate, loading, error, setError,
      reload, setDayValue, saveHabit, removeHabit,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
