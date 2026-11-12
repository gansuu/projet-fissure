import { useMemo } from 'react'
import { addDays, mondayOf, DAYS_SHORT } from '../lib/dates'
import { dayActivity } from '../lib/scoring'

function cellStyle(v) {
  if (v == null) return { background: 'transparent', border: '1px dashed var(--border)' }
  if (v === 0) return { background: 'var(--bg3)', border: '1px solid var(--border)' }
  const a = v >= 1 ? 1 : v > 0.66 ? 0.75 : v > 0.33 ? 0.5 : 0.28
  return { background: `color-mix(in srgb, var(--accent) ${Math.round(a * 100)}%, transparent)`, border: '1px solid transparent' }
}

// Calendrier façon GitHub : une colonne par semaine, une case par jour
export default function Heatmap({ habits, idx, today, weeks = 18, selected, onSelect }) {
  const cols = useMemo(() => {
    const mon0 = mondayOf(today)
    return Array.from({ length: weeks }, (_, w) => {
      const mon = addDays(mon0, -7 * (weeks - 1 - w))
      return Array.from({ length: 7 }, (_, i) => {
        const key = addDays(mon, i)
        return { key, v: key > today ? undefined : dayActivity(habits, idx, key) }
      })
    })
  }, [habits, idx, today, weeks])

  return (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '0' }}>
        {DAYS_SHORT.map((d, i) => (
          <div key={d} style={{ height: '15px', fontSize: '8px', lineHeight: '15px', color: 'var(--muted)' }}>{i % 2 === 0 ? d : ''}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '3px' }}>
        {cols.map((col, w) => (
          <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {col.map(c => c.v === undefined
              ? <div key={c.key} style={{ width: '15px', height: '15px' }} />
              : (
                <div key={c.key} onClick={() => onSelect?.(c.key)}
                  style={{ width: '15px', height: '15px', borderRadius: '4px', cursor: 'pointer', outline: selected === c.key ? '2px solid var(--text)' : 'none', ...cellStyle(c.v) }} />
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
