import { addDays, mondayOf, toKey, lastDayOfMonth, addMonths, MONTHS_SHORT, pad } from './dates'

/*
  Règles de calcul (tout est mesuré par rapport aux objectifs de chacun) :

  - Habitude "jour"    : ratio du jour = min(1, valeur du jour / objectif)
  - Habitude "semaine" : ratio de la semaine = min(1, total de la semaine / objectif)
  - Habitude "check"   : valeur du jour = 1 si fait, 0 sinon (objectif jour = 1,
                         objectif semaine = nombre de fois par semaine)

  Score d'une semaine = moyenne des ratios de toutes les habitudes avec objectif.
  Score d'un mois / d'une année = moyenne des scores des semaines dont le lundi
  tombe dans la période.
  Score d'un jour (courbe "jour") : habitudes "jour" = ratio du jour ;
  habitudes "semaine" = progression de la semaine jusqu'à ce jour.
*/

export const norm = s => (s || '').trim().toLowerCase()
const mean = arr => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null)

export function buildIndex(logs) {
  const idx = new Map()
  for (const l of logs) {
    let m = idx.get(l.habit_id)
    if (!m) { m = new Map(); idx.set(l.habit_id, m) }
    m.set(l.date, (m.get(l.date) || 0) + Number(l.value))
  }
  return idx
}

export function dayVal(h, idx, day) {
  const m = idx.get(h.id)
  const v = m ? (m.get(day) || 0) : 0
  return h.kind === 'check' ? (v > 0 ? 1 : 0) : v
}

export const dayTarget = h => (h.kind === 'check' ? 1 : Number(h.target_value) || 0)
export const weekTarget = h => Number(h.target_value) || 0
export const targetOf = h => (h.target_period === 'day' ? dayTarget(h) : weekTarget(h))
export const hasTarget = h => targetOf(h) > 0

export function weekSum(h, idx, mon, upTo) {
  let s = 0
  for (let i = 0; i < 7; i++) {
    const k = addDays(mon, i)
    if (upTo && k > upTo) break
    s += dayVal(h, idx, k)
  }
  return s
}

// Premier jour où l'habitude "compte" : création ou premier log, le plus ancien.
function habitStart(h, idx) {
  let first = toKey(new Date(h.created_at))
  const m = idx.get(h.id)
  if (m) for (const k of m.keys()) if (k < first) first = k
  return first
}

// Habitudes qui entrent dans les scores (non archivées, avec objectif)
export function prepareHabits(habits, idx) {
  return habits
    .filter(h => !h.archived && hasTarget(h))
    .map(h => ({ ...h, _start: habitStart(h, idx) }))
}

export function habitDayRatio(h, idx, day) {
  if (h._start && h._start > day) return null
  if (h.target_period === 'day') {
    const t = dayTarget(h)
    return t ? Math.min(1, dayVal(h, idx, day) / t) : null
  }
  const t = weekTarget(h)
  return t ? Math.min(1, weekSum(h, idx, mondayOf(day), day) / t) : null
}

export function dayScore(habits, idx, day) {
  return mean(habits.map(h => habitDayRatio(h, idx, day)).filter(v => v != null))
}

// Intensité du calendrier : habitudes "semaine" comptées seulement le jour où elles sont faites
export function dayActivity(habits, idx, day) {
  const vals = []
  for (const h of habits) {
    if (h._start > day) continue
    if (h.target_period === 'day') {
      const t = dayTarget(h)
      if (t) vals.push(Math.min(1, dayVal(h, idx, day) / t))
    } else if (dayVal(h, idx, day) > 0) vals.push(1)
  }
  return mean(vals)
}

export function weekScore(habits, idx, mon, today) {
  const sun = addDays(mon, 6)
  const end = sun < today ? sun : today
  const vals = []
  for (const h of habits) {
    if (h._start > end) continue
    if (h.target_period === 'day') {
      const t = dayTarget(h)
      if (!t) continue
      let s = 0, n = 0
      for (let i = 0; i < 7; i++) {
        const k = addDays(mon, i)
        if (k < h._start || k > end) continue
        s += Math.min(1, dayVal(h, idx, k) / t)
        n++
      }
      if (n) vals.push(s / n)
    } else {
      const t = weekTarget(h)
      // Habitude hebdo créée en fin de semaine (ven.-dim.) : première semaine non comptée
      if (t && h._start <= addDays(mon, 3)) vals.push(Math.min(1, weekSum(h, idx, mon) / t))
    }
  }
  return mean(vals)
}

function mondaysIn(from, to) {
  const out = []
  let m = mondayOf(from)
  if (m < from) m = addDays(m, 7)
  for (; m <= to; m = addDays(m, 7)) out.push(m)
  return out
}

export function periodScore(habits, idx, from, to, today) {
  const end = to < today ? to : today
  return mean(mondaysIn(from, end).map(m => weekScore(habits, idx, m, today)).filter(v => v != null))
}

export function buildSeries({ habits, idx, scale, today, year }) {
  if (scale === 'day') {
    return Array.from({ length: 30 }, (_, i) => {
      const key = addDays(today, -(29 - i))
      return { key, label: key.slice(8) + '/' + key.slice(5, 7), value: dayScore(habits, idx, key) }
    })
  }
  if (scale === 'week') {
    const mon0 = mondayOf(today)
    return Array.from({ length: 12 }, (_, i) => {
      const mon = addDays(mon0, -7 * (11 - i))
      return { key: mon, label: mon.slice(8) + '/' + mon.slice(5, 7), value: weekScore(habits, idx, mon, today) }
    })
  }
  const monthPoint = ym => {
    const [y, m] = ym.split('-').map(Number)
    return {
      key: ym,
      label: MONTHS_SHORT[m - 1],
      value: periodScore(habits, idx, `${ym}-01`, lastDayOfMonth(y, m), today),
    }
  }
  if (scale === 'month') {
    const cur = today.slice(0, 7)
    return Array.from({ length: 12 }, (_, i) => monthPoint(addMonths(cur, -(11 - i))))
  }
  // 'year' : les 12 mois de l'année choisie
  return Array.from({ length: 12 }, (_, i) => monthPoint(`${year}-${pad(i + 1)}`))
}

export function activityStreak(logs, today) {
  const days = new Set(logs.filter(l => Number(l.value) > 0).map(l => l.date))
  let d = days.has(today) ? today : addDays(today, -1)
  let n = 0
  while (days.has(d) && n < 3000) { n++; d = addDays(d, -1) }
  return n
}

export function habitStreak(h, idx, today) {
  if (h.target_period === 'day') {
    const t = dayTarget(h)
    if (!t) return 0
    let d = dayVal(h, idx, today) >= t ? today : addDays(today, -1)
    let n = 0
    while (dayVal(h, idx, d) >= t && n < 3000) { n++; d = addDays(d, -1) }
    return n
  }
  const t = weekTarget(h)
  if (!t) return 0
  let mon = mondayOf(today)
  if (weekSum(h, idx, mon) < t) mon = addDays(mon, -7)
  let n = 0
  while (weekSum(h, idx, mon) >= t && n < 600) { n++; mon = addDays(mon, -7) }
  return n
}

// ─── Affichage ───────────────────────────────────────
export const pct = v => (v == null ? '—' : Math.round(v * 100) + '%')
export const fmt = n => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 1 })

export function unitLabel(h) {
  if (h.kind === 'check') return 'fois'
  if (h.kind === 'duration') return 'min'
  return h.unit || ''
}

export function targetLabel(h) {
  const per = h.target_period === 'day' ? 'jour' : 'semaine'
  if (h.kind === 'check') {
    return h.target_period === 'day' ? 'Tous les jours' : `${fmt(h.target_value || 1)}×/semaine`
  }
  if (!Number(h.target_value)) return 'Sans objectif'
  return `${fmt(h.target_value)} ${unitLabel(h)}/${per}`
}
