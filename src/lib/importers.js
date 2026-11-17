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

// ─── Lecture d'un fichier choisi par l'utilisateur (.json, .zip, .csv, .txt) ───
async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

// Lecteur .zip minimal (méthodes « stocké » et « deflate ») : renvoie les .json/.csv/.txt
export async function readZip(buf) {
  const v = new DataView(buf)
  const u8 = new Uint8Array(buf)
  let eocd = -1
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('zip illisible')
  const count = v.getUint16(eocd + 10, true)
  let p = v.getUint32(eocd + 16, true)
  const dec = new TextDecoder()
  const out = []
  for (let n = 0; n < count; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) break
    const method = v.getUint16(p + 10, true)
    const csize = v.getUint32(p + 20, true)
    const nl = v.getUint16(p + 28, true)
    const el = v.getUint16(p + 30, true)
    const cl = v.getUint16(p + 32, true)
    const lho = v.getUint32(p + 42, true)
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nl))
    p += 46 + nl + el + cl
    if (name.endsWith('/') || !/\.(json|csv|txt)$/i.test(name)) continue
    const start = lho + 30 + v.getUint16(lho + 26, true) + v.getUint16(lho + 28, true)
    const raw = u8.subarray(start, start + csize)
    const data = method === 0 ? raw : method === 8 ? await inflateRaw(raw) : null
    if (data) out.push({ name, text: dec.decode(data) })
  }
  return out
}

const plausible = d => {
  const [y, m, da] = d.split('-').map(Number)
  return y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && da >= 1 && da <= 31
}

// Repli pour un fichier qui n'est pas du JSON (CSV, texte) : toutes les dates trouvées
function datesInText(text) {
  const found = new Set()
  for (const m of text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) found.add(`${m[1]}-${m[2]}-${m[3]}`)
  for (const m of text.matchAll(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/g)) found.add(`${m[3]}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`)
  return [...found].filter(plausible).sort()
}

export async function readImportFile(file) {
  const buf = await file.arrayBuffer()
  const u8 = new Uint8Array(buf)
  let docs
  if (u8[0] === 0x50 && u8[1] === 0x4b) {
    try { docs = await readZip(buf) } catch {
      throw new Error('Impossible de lire ce .zip. Décompresse-le et choisis le fichier à l’intérieur.')
    }
  } else {
    docs = [{ name: file.name, text: new TextDecoder().decode(u8).replace(/^﻿/, '') }]
  }
  const lists = []
  for (const d of docs) {
    const prefix = docs.length > 1
    let parsed = null
    try { parsed = JSON.parse(d.text) } catch { /* pas du JSON */ }
    if (parsed !== null) {
      for (const l of findDateLists(parsed)) lists.push({ ...l, path: prefix ? `${d.name} › ${l.path}` : l.path })
    } else {
      const ds = datesInText(d.text)
      if (ds.length) lists.push({ path: prefix ? d.name : 'dates du fichier', dates: ds, total: ds.length })
    }
  }
  return lists.sort((a, b) => (PATH_HINT.test(b.path) ? 1 : 0) - (PATH_HINT.test(a.path) ? 1 : 0) || b.dates.length - a.dates.length)
}
