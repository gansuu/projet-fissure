import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { todayKey, addDays, mondayOf, formatDay } from '../lib/dates'
import {
  prepareHabits, weekScore, activityStreak, habitStreak, dayVal, weekSum, targetOf, unitLabel, fmt, pct,
} from '../lib/scoring'
import { SectionTitle, Bar, ErrorBanner, PrimaryButton } from '../components/Ui'

function stepFor(h) {
  const t = Number(h.target_value) || 1
  if (h.kind === 'duration') return t >= 60 ? 15 : 5
  if (t >= 5000) return 1000
  if (t >= 500) return 100
  if (t >= 50) return 10
  return 1
}

function HabitRow({ h, day, today, idx, setDayValue }) {
  const [draft, setDraft] = useState(null)
  const isDayHabit = h.target_period === 'day'
  const v = dayVal(h, idx, day)
  const wsum = weekSum(h, idx, mondayOf(day))
  const target = targetOf(h)
  const progress = isDayHabit ? v : wsum
  const ratio = target ? Math.min(1, progress / target) : 0
  const done = ratio >= 1
  const streak = habitStreak(h, idx, today)
  const unit = unitLabel(h)

  let sub
  if (h.kind === 'check') {
    sub = isDayHabit ? (v ? 'Fait ✓' : 'À faire') : `${fmt(wsum)} / ${fmt(target)} cette semaine`
  } else if (isDayHabit) {
    sub = `${fmt(v)} / ${fmt(target)} ${unit}`
  } else {
    sub = `${fmt(wsum)} / ${fmt(target)} ${unit} cette semaine`
  }

  function commit() {
    if (draft === null) return
    setDayValue(h, day, Math.max(0, Number(draft) || 0))
    setDraft(null)
  }

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', background: 'var(--bg3)', flexShrink: 0 }}>
          {h.emoji || '🎯'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {h.name} {h.visibility === 'group' ? '' : <span style={{ fontSize: '11px', opacity: .6 }}>🔒</span>}
          </div>
          <div style={{ fontSize: '12px', color: done ? 'var(--accent)' : 'var(--muted)', marginTop: '1px' }}>
            {sub}{streak >= 2 ? `  ·  🔥 ${streak}${isDayHabit ? 'j' : ' sem.'}` : ''}
          </div>
        </div>

        {h.kind === 'check' ? (
          <div onClick={() => setDayValue(h, day, v > 0 ? 0 : 1)}
            style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: '20px', fontWeight: '700', transition: '.2s',
              background: v > 0 ? 'var(--accent)' : 'transparent', color: '#000', border: `2px solid ${v > 0 ? 'var(--accent)' : 'var(--muted2)'}` }}>
            {v > 0 ? '✓' : ''}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button onClick={() => setDayValue(h, day, Math.max(0, v - stepFor(h)))}
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: '18px', cursor: 'pointer' }}>−</button>
            <input type="number" inputMode="decimal" value={draft ?? (v || '')} placeholder="0"
              onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => e.key === 'Enter' && e.target.blur()}
              style={{ width: '78px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '7px 2px', color: 'var(--text)', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
            <button onClick={() => setDayValue(h, day, v + stepFor(h))}
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--accent)', color: '#000', fontSize: '18px', fontWeight: '700', cursor: 'pointer' }}>+</button>
          </div>
        )}
      </div>
      {target > 0 && h.kind !== 'check' && <div style={{ marginTop: '8px' }}><Bar ratio={ratio} color={done ? 'var(--accent)' : 'var(--accent2)'} height={6} /></div>}
    </div>
  )
}

export default function TodayPage({ go }) {
  const { profile } = useAuth()
  const { habits, logs, idx, loading, error, setError, setDayValue } = useData()
  const today = todayKey()
  const [day, setDay] = useState(today)

  const active = habits.filter(h => !h.archived)
  const prepared = useMemo(() => prepareHabits(habits, idx), [habits, idx])
  const mon = mondayOf(day)
  const score = weekScore(prepared, idx, mon, today)
  const prevScore = weekScore(prepared, idx, addDays(mon, -7), today)
  const streak = useMemo(() => activityStreak(logs, today), [logs, today])
  const isToday = day === today

  return (
    <div>
      {/* Hero */}
      <div style={{ margin: '8px 16px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', background: 'var(--accent)', opacity: .06, borderRadius: '50%' }} />
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' }}>Bonjour {profile?.emoji || '👋'}</div>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '36px', letterSpacing: '1px', lineHeight: 1 }}>{profile?.username?.toUpperCase()}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: streak > 0 ? 'var(--accent)' : 'var(--bg3)', color: streak > 0 ? '#000' : 'var(--muted)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginTop: '10px' }}>
          🔥 {streak} jour{streak > 1 ? 's' : ''} d’affilée
        </div>
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', letterSpacing: '.8px', textTransform: 'uppercase' }}>Score de la semaine</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '30px', color: 'var(--accent)', lineHeight: 1 }}>{pct(score)}</div>
          </div>
          <Bar ratio={score || 0} height={10} />
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
            Semaine précédente : {pct(prevScore)}
          </div>
        </div>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      {/* Sélecteur de jour */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 4px' }}>
        <button onClick={() => setDay(addDays(day, -1))} style={navBtn}>◀</button>
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '22px', letterSpacing: '1px' }}>
            {isToday ? 'AUJOURD’HUI' : formatDay(day, { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </div>
          {!isToday && <div style={{ fontSize: '11px', color: 'var(--accent)' }}>↩ Saisie rétroactive</div>}
          <input type="date" value={day} max={today} onChange={e => e.target.value && setDay(e.target.value)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
        </div>
        <button onClick={() => setDay(addDays(day, 1))} disabled={isToday} style={{ ...navBtn, opacity: isToday ? .3 : 1 }}>▶</button>
      </div>

      <SectionTitle>MES HABITUDES</SectionTitle>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius, 16px)', padding: '4px 16px', margin: '0 16px 16px' }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>Chargement...</div>}
        {!loading && active.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '20px 0' }}>
            Aucune habitude pour l’instant.
          </div>
        )}
        {active.map(h => <HabitRow key={h.id} h={h} day={day} today={today} idx={idx} setDayValue={setDayValue} />)}
      </div>
      {!loading && active.length === 0 && <PrimaryButton onClick={() => go('habits')}>＋ Créer ma première habitude</PrimaryButton>}
      <div style={{ height: '12px' }} />
    </div>
  )
}

const navBtn = {
  width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border)',
  background: 'var(--card)', color: 'var(--text)', fontSize: '14px', cursor: 'pointer',
}
