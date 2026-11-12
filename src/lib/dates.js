// Dates manipulées en "YYYY-MM-DD" (heure locale), jamais via toISOString()
// (qui décale d'un jour selon le fuseau horaire).

export const pad = n => String(n).padStart(2, '0')

export function toKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromKey(k) {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayKey = () => toKey(new Date())

export function addDays(key, n) {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

// Lundi de la semaine contenant `key`
export function mondayOf(key) {
  const d = fromKey(key)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toKey(d)
}

export function weekDays(key) {
  const mon = mondayOf(key)
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i))
}

export function lastDayOfMonth(year, month) {
  return toKey(new Date(year, month, 0)) // month = 1..12
}

export function addMonths(ym, n) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function daysLeftLabel(today, end) {
  const n = Math.round((fromKey(end) - fromKey(today)) / 86400000)
  if (n <= 0) return 'Dernier jour'
  return `${n} jour${n > 1 ? 's' : ''} restant${n > 1 ? 's' : ''}`
}

export function formatDay(key, opts) {
  return fromKey(key).toLocaleDateString('fr-FR', opts)
}

export const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
export const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
export const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
