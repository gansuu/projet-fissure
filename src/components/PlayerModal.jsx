import { useEffect, useMemo, useState } from 'react'
import { getUserLogs } from '../lib/queries'
import { todayKey, addDays, mondayOf } from '../lib/dates'
import {
  buildIndex, prepareHabits, buildSeries, weekScore, activityStreak, weekSum, dayVal, targetOf, unitLabel, fmt, pct,
} from '../lib/scoring'
import { Sheet, Bar, SectionTitle, Card } from './Ui'
import LineChart from './LineChart'

// Fiche d'un joueur : uniquement ses habitudes visibles par le groupe
// (la base ne renvoie de toute façon rien d'autre : règles RLS).
export default function PlayerModal({ user, habits, onClose }) {
  const [logs, setLogs] = useState(null)
  const today = todayKey()
  const mon = mondayOf(today)

  const groupHabits = useMemo(
    () => habits.filter(h => h.user_id === user.id && h.visibility === 'group'),
    [habits, user.id],
  )
  const groupIds = useMemo(() => new Set(groupHabits.map(h => h.id)), [groupHabits])

  useEffect(() => {
    getUserLogs(user.id, addDays(mon, -7 * 11)).then(({ data }) => setLogs(data || []))
  }, [user.id, mon])

  const visibleLogs = useMemo(() => (logs || []).filter(l => groupIds.has(l.habit_id)), [logs, groupIds])
  const idx = useMemo(() => buildIndex(visibleLogs), [visibleLogs])
  const prepared = useMemo(() => prepareHabits(groupHabits, idx), [groupHabits, idx])
  const series = useMemo(() => buildSeries({ habits: prepared, idx, scale: 'week', today }), [prepared, idx, today])
  const score = weekScore(prepared, idx, mon, today)
  const streak = activityStreak(visibleLogs, today)

  return (
    <Sheet onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '0 20px 12px' }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>{user.emoji}</div>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '30px', letterSpacing: '1px' }}>{user.username}</div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
          {streak > 0 ? `🔥 ${streak} jour${streak > 1 ? 's' : ''} d’affilée · ` : ''}Score de la semaine : {pct(score)}
        </div>
      </div>

      {groupHabits.length === 0 ? (
        <Card><div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
          {user.username} n’a partagé aucune habitude avec le groupe.
        </div></Card>
      ) : logs === null ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>Chargement...</div>
      ) : (
        <>
          <SectionTitle>CETTE SEMAINE</SectionTitle>
          <Card>
            {prepared.map(h => {
              const t = targetOf(h)
              const v = h.target_period === 'day'
                ? Array.from({ length: 7 }, (_, i) => Math.min(dayVal(h, idx, addDays(mon, i)), t)).reduce((a, b) => a + b, 0)
                : weekSum(h, idx, mon)
              const total = h.target_period === 'day' ? t * 7 : t
              return (
                <div key={h.id} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>{h.emoji} {h.name}</span>
                    <span style={{ color: 'var(--muted)' }}>{fmt(v)} / {fmt(total)} {unitLabel(h)}</span>
                  </div>
                  <Bar ratio={v / (total || 1)} color="var(--accent)" height={7} />
                </div>
              )
            })}
            {prepared.length === 0 && <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Pas d’objectif partagé.</div>}
          </Card>

          <SectionTitle>PROGRESSION (12 SEMAINES)</SectionTitle>
          <Card><LineChart points={series} /></Card>
        </>
      )}
    </Sheet>
  )
}
