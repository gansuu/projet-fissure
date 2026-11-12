import { useState } from 'react'
import { pct } from '../lib/scoring'

// Courbe de progression (0 à 100 %). Les points sans donnée (null) coupent la ligne.
export default function LineChart({ points }) {
  const [sel, setSel] = useState(null)
  const W = 340, H = 180
  const pl = 34, pr = 12, pt = 12, pb = 26
  const pw = W - pl - pr, ph = H - pt - pb
  const n = points.length
  const x = i => pl + (n <= 1 ? pw / 2 : (i / (n - 1)) * pw)
  const y = v => pt + (1 - v) * ph

  let d = ''
  let pen = false
  points.forEach((p, i) => {
    if (p.value == null) { pen = false; return }
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)} `
    pen = true
  })

  const step = Math.ceil(n / 6)
  const lastIdx = points.reduce((acc, p, i) => (p.value != null ? i : acc), -1)
  const shown = sel != null ? points[sel] : lastIdx >= 0 ? points[lastIdx] : null

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
        {[0, 0.5, 1].map(t => (
          <g key={t}>
            <line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} style={{ stroke: 'var(--border)' }} strokeDasharray={t === 0 ? '' : '3 4'} />
            <text x={pl - 6} y={y(t) + 3} textAnchor="end" fontSize="9" style={{ fill: 'var(--muted)' }}>{Math.round(t * 100)}%</text>
          </g>
        ))}
        {d && <path d={d} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--accent)' }} />}
        {points.map((p, i) => p.value != null && (
          <g key={p.key} onClick={() => setSel(i)} style={{ cursor: 'pointer' }}>
            <circle cx={x(i)} cy={y(p.value)} r="12" fill="transparent" />
            <circle cx={x(i)} cy={y(p.value)} r={i === (sel ?? lastIdx) ? 5 : 3} style={{ fill: 'var(--accent)', stroke: 'var(--card)' }} strokeWidth="1.5" />
          </g>
        ))}
        {points.map((p, i) => (i % step === 0 || i === n - 1) && (
          <text key={'l' + p.key} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" style={{ fill: 'var(--muted)' }}>{p.label}</text>
        ))}
      </svg>
      <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)', minHeight: '16px' }}>
        {shown ? <>{shown.label} : <b style={{ color: 'var(--accent)' }}>{pct(shown.value)}</b></> : 'Pas encore de données sur cette période'}
      </div>
    </div>
  )
}
