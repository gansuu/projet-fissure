import { useEffect, useState } from 'react'
import { getLeaderboard } from '../lib/queries'
import StatsModal from '../components/StatsModal'

const TABS = [
  { key:'seances', label:'💪 Séances', unit:'séances' },
  { key:'pas', label:'👟 Pas', unit:'pas' },
  { key:'annexe', label:'🏃 Activités', unit:'activités' },
]
const RANK_COLORS = ['#FFD700','#C0C0C0','#CD7F32']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1]

export default function LeaderboardPage() {
  const [tab, setTab] = useState('seances')
  const [year, setYear] = useState(CURRENT_YEAR)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    setLoading(true)
    getLeaderboard(year).then(data => { setUsers(data); setLoading(false) })
  }, [year])

  const sorted = [...users].sort((a, b) => b[tab] - a[tab])

  return (
    <div>
      <div style={{ padding:'8px 16px 0' }}>
        <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'32px', letterSpacing:'1px' }}>CLASSEMENT</div>
        <div style={{ fontSize:'13px', color:'var(--muted)' }}>Clique sur un joueur pour voir ses stats</div>
      </div>
      <div style={{ height:'8px' }}/>

      {/* Filtre année */}
      <div style={{ display:'flex', gap:'8px', padding:'0 16px 8px' }}>
        {YEARS.map(y => (
          <div key={y} onClick={() => setYear(y)}
            style={{ padding:'6px 16px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', cursor:'pointer', transition:'.2s',
              background: year === y ? 'var(--accent2)' : 'var(--card)',
              color: year === y ? '#fff' : 'var(--muted)',
              border: `1px solid ${year === y ? 'var(--accent2)' : 'var(--border)'}` }}>
            {y}
          </div>
        ))}
      </div>

      {/* Tabs catégorie */}
      <div style={{ display:'flex', gap:'8px', padding:'0 16px 8px', overflowX:'auto' }}>
        {TABS.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'7px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:'500', whiteSpace:'nowrap', cursor:'pointer', flexShrink:0, transition:'.2s',
              background: tab === t.key ? 'var(--accent)' : 'var(--card)',
              color: tab === t.key ? '#000' : 'var(--muted)',
              border: `1px solid ${tab === t.key ? 'var(--accent)' : 'var(--border)'}` }}>
            {t.label}
          </div>
        ))}
      </div>

      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius, 16px)', margin:'0 16px', overflow:'hidden' }}>
        {loading && <div style={{ padding:'24px', textAlign:'center', color:'var(--muted)' }}>Chargement...</div>}
        {!loading && sorted.length === 0 && (
          <div style={{ padding:'24px', textAlign:'center', color:'var(--muted)' }}>Aucune activité en {year}</div>
        )}
        {sorted.map((u, i) => {
          const val = tab === 'pas' ? u[tab].toLocaleString('fr-FR') : u[tab]
          const unit = TABS.find(t => t.key === tab)?.unit
          return (
            <div key={u.id} onClick={() => setSelectedUser(u)}
              style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', cursor:'pointer', borderBottom: i < sorted.length-1 ? '1px solid var(--border)' : 'none', transition:'.15s' }}>
              <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'22px', width:'32px', textAlign:'center', flexShrink:0, color: RANK_COLORS[i] || 'var(--muted2)' }}>
                {i+1}
              </div>
              <div style={{ width:'44px', height:'44px', borderRadius:'50%', fontSize:'20px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:'var(--bg3)' }}>
                {u.emoji}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'15px', fontWeight:'600' }}>{u.username}</div>
                <div style={{ fontSize:'12px', color:'var(--muted)', marginTop:'1px' }}>
                  {u.streak > 0 ? `🔥 ${u.streak}j · ` : ''}{u.seances} séances
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'22px', color:'var(--accent)' }}>{val}</div>
                <div style={{ fontSize:'10px', color:'var(--muted)' }}>{unit}</div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedUser && <StatsModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  )
}
