import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { todayKey, addDays, mondayOf, formatDay } from '../lib/dates'
import {
  prepareHabits, buildSeries, weekScore, periodScore, dayVal, weekSum, targetOf, unitLabel, fmt, pct,
} from '../lib/scoring'
import { SectionTitle, Card, Chip, ChipRow, Bar, Heading } from '../components/Ui'
import LineChart from '../components/LineChart'
import Heatmap from '../components/Heatmap'

const SCALES = [
  { key: 'day', label: 'Jour', hint: '30 derniers jours' },
  { key: 'week', label: 'Semaine', hint: '12 dernières semaines' },
  { key: 'month', label: 'Mois', hint: '12 derniers mois' },
  { key: 'year', label: 'Année', hint: 'mois de l’année choisie' },
]

export default function ProgressPage() {
  const { habits, idx, startDate } = useData()
  const today = todayKey()
  const thisYear = Number(today.slice(0, 4))
  const firstYear = Math.min(Number(startDate.slice(0, 4)), thisYear)

  const [scale, setScale] = useState('week')
  const [habitId, setHabitId] = useState('all')
  const [year, setYear] = useState(thisYear)
  const [selDay, setSelDay] = useState(null)

  const prepared = useMemo(() => prepareHabits(habits, idx), [habits, idx])
  const used = useMemo(() => (habitId === 'all' ? prepared : prepared.filter(h => h.id === habitId)), [prepared, habitId])

  const series = useMemo(
    () => buildSeries({ habits: used, idx, scale, today, year }),
    [used, idx, scale, today, year],
  )
  const values = series.map(s => s.value).filter(v => v != null)
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
  const yearScore = periodScore(used, idx, `${year}-01-01`, `${year}-12-31`, today)

  // Bilan hebdomadaire
  const mon = mondayOf(today)
  const cur = weekScore(prepared, idx, mon, today)
  const prev = weekScore(prepared, idx, addDays(mon, -7), today)
  const delta = cur != null && prev != null ? Math.round((cur - prev) * 100) : null
  const weekRows = prepared.map(h => {
    const t = targetOf(h)
    const v = h.target_period === 'day'
      ? Array.from({ length: 7 }, (_, i) => Math.min(dayVal(h, idx, addDays(mon, i)), t)).reduce((a, b) => a + b, 0)
      : weekSum(h, idx, mon)
    const total = h.target_period === 'day' ? t * 7 : t
    return { h, v, total, ratio: Math.min(1, v / (total || 1)) }
  })
  const best = [...weekRows].sort((a, b) => b.ratio - a.ratio)[0]
  const worst = [...weekRows].sort((a, b) => a.ratio - b.ratio)[0]

  const noHabits = prepared.length === 0

  return (
    <div>
      <Heading help={<>La courbe montre la part de tes objectifs atteints (100 % = tout est rempli) : <b>Jour</b> sur 30 jours, <b>Semaine</b> sur 12 semaines, <b>Mois</b> sur 12 mois, <b>Année</b> mois par mois. Dans le calendrier, plus la case est colorée, plus la journée est remplie : touche une case pour le détail.</>}>MES PROGRÈS</Heading>

      {noHabits ? (
        <Card><div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '12px 0' }}>
          Crée une habitude pour voir ta courbe.
        </div></Card>
      ) : (
        <>
          <ChipRow>
            {SCALES.map(s => <Chip key={s.key} active={scale === s.key} color="var(--accent2)" textColor="#fff" onClick={() => setScale(s.key)}>{s.label}</Chip>)}
          </ChipRow>
          <ChipRow>
            <Chip active={habitId === 'all'} onClick={() => setHabitId('all')}>Toutes</Chip>
            {prepared.map(h => <Chip key={h.id} active={habitId === h.id} onClick={() => setHabitId(h.id)}>{h.emoji} {h.name}</Chip>)}
          </ChipRow>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', letterSpacing: '.8px', textTransform: 'uppercase' }}>
                  {scale === 'year' ? `Score ${year}` : 'Moyenne'}
                </div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '34px', color: 'var(--accent)', lineHeight: 1.1 }}>
                  {pct(scale === 'year' ? yearScore : avg)}
                </div>
              </div>
              {scale === 'year' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button disabled={year <= firstYear} onClick={() => setYear(y => y - 1)} style={yearBtn(year <= firstYear)}>◀</button>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '20px' }}>{year}</div>
                  <button disabled={year >= thisYear} onClick={() => setYear(y => y + 1)} style={yearBtn(year >= thisYear)}>▶</button>
                </div>
              )}
            </div>
            <LineChart key={scale + habitId + year} points={series} />
          </Card>

          <SectionTitle>CALENDRIER</SectionTitle>
          <Card style={{ padding: '14px 10px' }}>
            <Heatmap habits={used} idx={idx} today={today} selected={selDay} onSelect={setSelDay} />
            {selDay && (
              <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                  {formatDay(selDay, { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                {used.map(h => {
                  const v = dayVal(h, idx, selDay)
                  return (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0', color: v ? 'var(--text)' : 'var(--muted)' }}>
                      <span>{h.emoji} {h.name}</span>
                      <span>{h.kind === 'check' ? (v ? '✓' : '—') : `${fmt(v)} ${unitLabel(h)}`}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <SectionTitle>BILAN DE LA SEMAINE</SectionTitle>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '34px', color: 'var(--accent)' }}>{pct(cur)}</div>
              <div style={{ fontSize: '12px', color: delta == null ? 'var(--muted)' : delta >= 0 ? 'var(--accent)' : 'var(--accent2)' }}>
                {delta == null ? '' : `${delta >= 0 ? '▲ +' : '▼ '}${delta} pts vs sem. dernière`}
              </div>
            </div>
            <div style={{ marginTop: '10px' }}>
              {weekRows.map(r => (
                <div key={r.h.id} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>{r.h.emoji} {r.h.name}</span>
                    <span style={{ color: 'var(--muted)' }}>{fmt(r.v)} / {fmt(r.total)} {unitLabel(r.h)}</span>
                  </div>
                  <Bar ratio={r.ratio} color={r.ratio >= 1 ? 'var(--accent)' : 'var(--accent2)'} height={7} />
                </div>
              ))}
            </div>
            {weekRows.length > 1 && best && worst && best.h.id !== worst.h.id && (
              <div style={{ fontSize: '12px', color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                💪 Meilleure : <b style={{ color: 'var(--text)' }}>{best.h.name}</b> ({pct(best.ratio)}) · 🎯 À relancer : <b style={{ color: 'var(--text)' }}>{worst.h.name}</b> ({pct(worst.ratio)})
              </div>
            )}
          </Card>
        </>
      )}
      <div style={{ height: '12px' }} />
    </div>
  )
}

const yearBtn = disabled => ({
  width: '30px', height: '30px', borderRadius: '50%', border: '1px solid var(--border)',
  background: 'var(--bg3)', color: 'var(--text)', fontSize: '11px', cursor: 'pointer', opacity: disabled ? .3 : 1,
})
