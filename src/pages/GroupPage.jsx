import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { getAllProfiles, getVisibleHabits, getLogsRange } from '../lib/queries'
import { lastDayOfMonth, MONTHS_SHORT, pad } from '../lib/dates'
import { norm, fmt } from '../lib/scoring'
import { Chip, ChipRow, Card } from '../components/Ui'
import PlayerModal from '../components/PlayerModal'
import ChallengesPanel from '../components/ChallengesPanel'

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

export default function GroupPage() {
  const { session } = useAuth()
  const { startDate } = useData()
  const thisYear = new Date().getFullYear()
  const firstYear = Math.min(Number(startDate.slice(0, 4)), thisYear)
  const years = Array.from({ length: thisYear - firstYear + 1 }, (_, i) => thisYear - i)

  const [tab, setTab] = useState('rank')
  const [year, setYear] = useState(thisYear)
  const [month, setMonth] = useState(0) // 0 = toute l'année
  const [habitKey, setHabitKey] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  // Habitudes partagées (la base ne renvoie que les miennes + celles du groupe)
  useEffect(() => {
    Promise.all([getAllProfiles(), getVisibleHabits()]).then(([p, h]) => {
      if (p.error || h.error) setError('Impossible de charger le groupe.')
      setProfiles(p.data || [])
      setHabits((h.data || []).filter(x => x.visibility === 'group' && !x.archived))
    })
  }, [])

  const names = useMemo(() => {
    const m = new Map()
    for (const h of habits) {
      const k = norm(h.name)
      if (!m.has(k)) m.set(k, { key: k, name: h.name, emoji: h.emoji, kind: h.kind, unit: h.kind === 'duration' ? 'min' : h.kind === 'count' ? h.unit : 'séances' })
    }
    return [...m.values()]
  }, [habits])

  useEffect(() => {
    if (!habitKey && names.length) setHabitKey(names[0].key)
  }, [names, habitKey])

  const from = month ? `${year}-${pad(month)}-01` : `${year}-01-01`
  const to = month ? lastDayOfMonth(year, month) : `${year}-12-31`

  useEffect(() => {
    setLoading(true)
    getLogsRange(from, to).then(({ data, error }) => {
      if (error) setError('Impossible de charger le classement.')
      setLogs(data || [])
      setLoading(false)
    })
  }, [from, to])

  const rows = useMemo(() => {
    const ids = new Set(habits.filter(h => norm(h.name) === habitKey).map(h => h.id))
    const sums = new Map()
    for (const l of logs) if (ids.has(l.habit_id)) sums.set(l.user_id, (sums.get(l.user_id) || 0) + Number(l.value))
    return profiles
      .map(p => ({ ...p, total: sums.get(p.id) || 0 }))
      .filter(p => p.total > 0 || habits.some(h => h.user_id === p.id && norm(h.name) === habitKey))
      .sort((a, b) => b.total - a.total)
  }, [profiles, habits, logs, habitKey])

  const current = names.find(n => n.key === habitKey)

  return (
    <div>
      <div style={{ padding: '8px 16px 8px' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '32px', letterSpacing: '1px' }}>GROUPE</div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Seules les habitudes partagées sont visibles</div>
      </div>

      <ChipRow>
        <Chip active={tab === 'rank'} onClick={() => setTab('rank')}>🏆 Classement</Chip>
        <Chip active={tab === 'challenges'} onClick={() => setTab('challenges')}>🎯 Défis</Chip>
      </ChipRow>

      {error && <div style={{ margin: '0 16px 12px', color: '#ff6060', fontSize: '13px' }}>{error}</div>}

      {tab === 'challenges' ? <ChallengesPanel habits={habits} /> : (
        <>
          <ChipRow>
            {years.map(y => <Chip key={y} active={year === y} color="var(--accent2)" textColor="#fff" onClick={() => setYear(y)}>{y}</Chip>)}
          </ChipRow>
          <ChipRow>
            <Chip active={month === 0} color="var(--accent3)" onClick={() => setMonth(0)}>Année</Chip>
            {MONTHS_SHORT.map((m, i) => <Chip key={m} active={month === i + 1} color="var(--accent3)" onClick={() => setMonth(i + 1)}>{m}</Chip>)}
          </ChipRow>
          <ChipRow>
            {names.map(n => <Chip key={n.key} active={habitKey === n.key} onClick={() => setHabitKey(n.key)}>{n.emoji} {n.name}</Chip>)}
          </ChipRow>

          {names.length === 0 ? (
            <Card><div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '12px 0' }}>
              Personne n’a encore partagé d’habitude. Passe une de tes habitudes en « 👥 Groupe » pour apparaître ici.
            </div></Card>
          ) : (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius, 16px)', margin: '0 16px 16px', overflow: 'hidden' }}>
              {loading && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>Chargement...</div>}
              {!loading && rows.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>Aucune donnée sur cette période</div>}
              {!loading && rows.map((u, i) => (
                <div key={u.id} onClick={() => setSelected(u)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '22px', width: '32px', textAlign: 'center', flexShrink: 0, color: u.total > 0 ? (RANK_COLORS[i] || 'var(--muted2)') : 'var(--muted2)' }}>{i + 1}</div>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--bg3)' }}>{u.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: '600' }}>{u.username}{u.id === session.user.id ? ' (moi)' : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '22px', color: 'var(--accent)' }}>{fmt(u.total)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{current?.unit}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selected && <PlayerModal user={selected} habits={habits} onClose={() => setSelected(null)} />}
    </div>
  )
}
