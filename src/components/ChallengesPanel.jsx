import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getChallenges, createChallenge, deleteChallenge, getChallengeLogs, getAllProfiles } from '../lib/queries'
import { todayKey, addDays, mondayOf, lastDayOfMonth, formatDay, daysLeftLabel } from '../lib/dates'
import { norm, fmt } from '../lib/scoring'
import { Card, Bar, Sheet, PrimaryButton, inputStyle, labelStyle, Chip } from './Ui'

function ChallengeForm({ names, onSave, onClose }) {
  const today = todayKey()
  const [habitName, setHabitName] = useState(names[0]?.key || '')
  const [target, setTarget] = useState('4')
  const [preset, setPreset] = useState('week')
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(addDays(today, 7))
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function range() {
    if (preset === 'week') { const m = mondayOf(today); return [m, addDays(m, 6)] }
    if (preset === 'month') { const [y, mo] = today.split('-').map(Number); return [`${y}-${String(mo).padStart(2, '0')}-01`, lastDayOfMonth(y, mo)] }
    return [from, to]
  }

  async function submit() {
    setError('')
    const t = Number(target)
    const [s, e] = range()
    if (!habitName) { setError('Choisis une habitude partagée'); return }
    if (!(t > 0)) { setError('Indique un objectif supérieur à 0'); return }
    if (e < s) { setError('La date de fin doit être après le début'); return }
    const info = names.find(n => n.key === habitName)
    setSaving(true)
    const ok = await onSave({
      title: title.trim() || `${fmt(t)} ${info?.unit || ''} ${info?.name || ''}`.replace(/\s+/g, ' ').trim() + ' pour le groupe',
      emoji: info?.emoji || '🎯',
      habit_name: habitName,
      target: t,
      start_date: s,
      end_date: e,
    })
    setSaving(false)
    if (ok) onClose(); else setError('Impossible de créer le défi')
  }

  return (
    <Sheet title="NOUVEAU DÉFI" onClose={onClose}>
      {names.length === 0 ? (
        <div style={{ margin: '0 16px 16px', color: 'var(--muted)', fontSize: '13px' }}>
          Aucune habitude n’est partagée avec le groupe pour l’instant. Passe une habitude en « Groupe » pour lancer un défi dessus.
        </div>
      ) : (
        <>
          <div style={{ margin: '0 16px 12px' }}>
            <label style={labelStyle}>Habitude concernée</label>
            <div className="hide-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {names.map(n => <Chip key={n.key} active={habitName === n.key} onClick={() => setHabitName(n.key)}>{n.emoji} {n.name}</Chip>)}
            </div>
          </div>
          <div style={{ margin: '0 16px 12px' }}>
            <label style={labelStyle}>Objectif total pour tout le groupe</label>
            <input type="number" inputMode="decimal" value={target} onChange={e => setTarget(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ margin: '0 16px 12px' }}>
            <label style={labelStyle}>Période</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[['week', 'Cette semaine'], ['month', 'Ce mois'], ['custom', 'Dates perso']].map(([k, l]) => (
                <Chip key={k} active={preset === k} color="var(--accent2)" textColor="#fff" onClick={() => setPreset(k)}>{l}</Chip>
              ))}
            </div>
            {preset === 'custom' && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
                <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
              </div>
            )}
          </div>
          <div style={{ margin: '0 16px 12px' }}>
            <label style={labelStyle}>Titre (optionnel)</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="ex: 4 séances cette semaine" style={inputStyle} />
          </div>
          <div style={{ margin: '0 16px 12px', fontSize: '12px', color: 'var(--muted)' }}>
            Seules les habitudes visibles par le groupe comptent dans un défi.
          </div>
          {error && <div style={{ margin: '0 16px 12px', color: '#ff6060', fontSize: '13px' }}>{error}</div>}
          <PrimaryButton onClick={submit} disabled={saving}>{saving ? '...' : 'Lancer le défi'}</PrimaryButton>
        </>
      )}
    </Sheet>
  )
}

export default function ChallengesPanel({ habits }) {
  const { session } = useAuth()
  const userId = session.user.id
  const today = todayKey()
  const [challenges, setChallenges] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [logsById, setLogsById] = useState({})
  const [showForm, setShowForm] = useState(false)

  const groupHabits = useMemo(() => habits.filter(h => h.visibility === 'group'), [habits])
  const names = useMemo(() => {
    const m = new Map()
    for (const h of groupHabits) {
      const k = norm(h.name)
      if (!m.has(k)) m.set(k, { key: k, name: h.name, emoji: h.emoji, unit: h.kind === 'duration' ? 'min' : h.kind === 'count' ? h.unit : 'fois' })
    }
    return [...m.values()]
  }, [groupHabits])

  async function load() {
    const [{ data }, p] = await Promise.all([getChallenges(), getAllProfiles()])
    setProfiles(p.data || [])
    setChallenges(data || [])
    const entries = await Promise.all((data || []).map(async c => {
      const ids = groupHabits.filter(h => norm(h.name) === c.habit_name).map(h => h.id)
      const { data: logs } = await getChallengeLogs(ids, c.start_date, c.end_date)
      return [c.id, logs || []]
    }))
    setLogsById(Object.fromEntries(entries))
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [groupHabits.length])

  async function save(c) {
    const { error } = await createChallenge(userId, c)
    if (error) return false
    load()
    return true
  }

  async function remove(c) {
    if (!window.confirm('Supprimer ce défi ?')) return
    await deleteChallenge(c.id)
    setChallenges(prev => prev.filter(x => x.id !== c.id))
  }

  return (
    <div>
      <PrimaryButton onClick={() => setShowForm(true)}>＋ Lancer un défi</PrimaryButton>
      <div style={{ height: '12px' }} />

      {challenges === null && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>Chargement...</div>}
      {challenges?.length === 0 && (
        <Card><div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
          Aucun défi pour l’instant. Exemple : « 4 séances cette semaine pour tout le groupe ».
        </div></Card>
      )}

      {challenges?.map(c => {
        const logs = logsById[c.id] || []
        const total = logs.reduce((s, l) => s + Number(l.value), 0)
        const ratio = Math.min(1, total / Number(c.target))
        const reached = total >= Number(c.target)
        const upcoming = today < c.start_date
        const over = today > c.end_date
        const byUser = new Map()
        for (const l of logs) byUser.set(l.user_id, (byUser.get(l.user_id) || 0) + Number(l.value))
        const contributors = [...byUser.entries()].sort((a, b) => b[1] - a[1])
        const status = upcoming ? 'À venir' : over ? (reached ? 'Réussi 🎉' : 'Terminé') : daysLeftLabel(today, c.end_date)
        return (
          <Card key={c.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ fontSize: '24px' }}>{c.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: '600' }}>{c.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {formatDay(c.start_date, { day: 'numeric', month: 'short' })} → {formatDay(c.end_date, { day: 'numeric', month: 'short' })} · {status}
                </div>
              </div>
              {c.created_by === userId && <div onClick={() => remove(c)} style={{ color: 'var(--muted)', cursor: 'pointer', padding: '4px' }}>🗑</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: reached ? 'var(--accent)' : 'var(--text)', fontWeight: '600' }}>{fmt(total)} / {fmt(c.target)}</span>
              <span style={{ color: 'var(--muted)' }}>{Math.round(ratio * 100)}%</span>
            </div>
            <Bar ratio={ratio} color={reached ? 'var(--accent)' : 'var(--accent2)'} height={10} />
            {contributors.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {contributors.map(([uid, v]) => {
                  const p = profiles.find(x => x.id === uid)
                  return (
                    <div key={uid} style={{ fontSize: '11px', background: 'var(--bg3)', borderRadius: '20px', padding: '4px 10px' }}>
                      {p?.emoji} {p?.username} · <b>{fmt(v)}</b>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )
      })}

      {showForm && <ChallengeForm names={names} onSave={save} onClose={() => setShowForm(false)} />}
    </div>
  )
}
