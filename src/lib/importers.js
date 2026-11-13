// Import tolérant d'un export JSON (ex. « My Basic-Fit »).
// Le format exact n'est pas documenté : on repère les listes d'éléments datés,
// et l'utilisateur choisit celle qui correspond à ses visites avant d'importer.
import { pad } from './dates'

const DATE_KEYS = ['date', 'checkindate', 'checkin', 'check_in', 'visitdate', 'visit_date', 'startdate', 'start_date', 'starttime', 'start', 'timestamp', 'datetime', 'time', 'datum']
const PATH_HINT = /visit|check|entr|bezoek|train|workout|session|gym|club|besuch|passage/i

const localKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function parseDateValue(v) {
  if (typeof v === 'number') {
    const ms = v > 1e11 ? v : v > 1e8 ? v * 1000 : null
    if (!ms) return null
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? null : localKey(d)
  }
  if (typeof v !== 'string') return null
  const s = v.trim()
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return s
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ]/)
  if (m) {
    // avec fuseau (Z ou +hh:mm) : on convertit en date locale ; sans fuseau : on garde le jour écrit
    if (/(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
      const d = new Date(s)
      return Number.isNaN(d.getTime()) ? `${m[1]}-${m[2]}-${m[3]}` : localKey(d)
    }
    return `${m[1]}-${m[2]}-${m[3]}`
  }
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/)
  if (m) return `${m[3]}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`
  return null
}

function dateOfElement(el) {
  if (el && typeof el === 'object' && !Array.isArray(el)) {
    const keys = Object.keys(el)
    for (const want of DATE_KEYS) {
      const k = keys.find(x => x.toLowerCase() === want)
      if (k) { const d = parseDateValue(el[k]); if (d) return d }
    }
    for (const k of keys) {
      if (typeof el[k] === 'string') { const d = parseDateValue(el[k]); if (d) return d }
    }
    return null
  }
  return parseDateValue(el)
}

// Renvoie les listes trouvées : [{ path, dates:[...uniques triées], total }]
export function findDateLists(json) {
  const out = []
  const walk = (node, path) => {
    if (Array.isArray(node)) {
      if (node.length) {
        const all = node.map(dateOfElement).filter(Boolean)
        if (all.length >= Math.max(1, Math.floor(node.length * 0.6))) {
          out.push({ path: path || '(racine)', dates: [...new Set(all)].sort(), total: node.length })
        }
      }
      node.slice(0, 5000).forEach((el, i) => { if (el && typeof el === 'object') walk(el, `${path}[]`) })
    } else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k)
    }
  }
  walk(json, '')
  // fusionne les chemins identiques (ex. a[].visits)
  const merged = new Map()
  for (const l of out) {
    const prev = merged.get(l.path)
    if (prev) { prev.dates = [...new Set([...prev.dates, ...l.dates])].sort(); prev.total += l.total }
    else merged.set(l.path, { ...l })
  }
  return [...merged.values()].sort((a, b) => {
    const ha = PATH_HINT.test(a.path) ? 1 : 0
    const hb = PATH_HINT.test(b.path) ? 1 : 0
    return hb - ha || b.dates.length - a.dates.length
  })
}
