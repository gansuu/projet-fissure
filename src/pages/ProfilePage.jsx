import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getEntriesByUser, signOut } from '../lib/queries'

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [entries, setEntries] = useState([])
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    if (!profile) return
    getEntriesByUser(profile.id).then(({ data }) => setEntries(data || []))
    setIsDark(profile.theme !== 'light')
  }, [profile])

  function toggleTheme() {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    document.documentElement.setAttribute('data-theme', newTheme)
    document.getElementById('fissure-app')?.setAttribute('data-theme', newTheme)
  }

  const seances = entries.filter(e => e.activity_type === 'muscu').length
  const pas = entries.filter(e => e.activity_type === 'pas').reduce((s,e) => s+e.value, 0)
  const annexe = entries.filter(e => e.activity_type === 'annexe').length

  // Stats par semaine (4 dernières)
  const weeklyStats = []
  for (let w = 3; w >= 0; w--) {
    const start = new Date(); start.setDate(start.getDate() - start.getDay() - w * 7 + 1)
    const end = new Date(start); end.setDate(start.getDate() + 6)
    const weekEntries = entries.filter(e => { const d = new Date(e.date); return d >= start && d <= end })
    weeklyStats.push({ label: `S${start.getDate()}/${start.getMonth()+1}`, count: weekEntries.length })
  }
  const maxWeek = Math.max(...weeklyStats.map(w => w.count), 1)

  const barColor = { muscu:'var(--accent)', pas:'var(--accent2)', annexe:'var(--accent3)' }
  const maxSeances = Math.max(seances, 1)
  const maxPas = Math.max(pas, 1)
  const maxAnnexe = Math.max(annexe, 1)

  return (
    <div>
      {/* Hero profil */}
      <div style={{ margin:'8px 16px 12px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:'20px', padding:'24px 20px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(232,255,71,.04) 0%, transparent 60%)', pointerEvents:'none' }}/>
        <div style={{ width:'72px', height:'72px', borderRadius:'50%', fontSize:'28px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', border:'3px solid var(--accent)', background:'rgba(232,255,71,.1)' }}>
          {profile?.emoji || '💪'}
        </div>
        <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'28px', letterSpacing:'1px' }}>{profile?.username?.toUpperCase()}</div>
        <div style={{ fontSize:'12px', color:'var(--muted)', marginTop:'2px' }}>
          Membre depuis {new Date(profile?.joined_at).toLocaleDateString('fr-FR', { month:'long', year:'numeric' })}
        </div>
        <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginTop:'12px', flexWrap:'wrap' }}>
          {profile?.streak >= 3 && <div style={{ background:'rgba(232,255,71,.1)', border:'1px solid rgba(232,255,71,.3)', borderRadius:'20px', padding:'4px 10px', fontSize:'11px', color:'var(--accent)' }}>🔥 {profile.streak}j streak</div>}
          {seances >= 10 && <div style={{ background:'rgba(232,255,71,.1)', border:'1px solid rgba(232,255,71,.3)', borderRadius:'20px', padding:'4px 10px', fontSize:'11px', color:'var(--accent)' }}>💪 {seances} séances</div>}
          {pas >= 100000 && <div style={{ background:'rgba(232,255,71,.1)', border:'1px solid rgba(232,255,71,.3)', borderRadius:'20px', padding:'4px 10px', fontSize:'11px', color:'var(--accent)' }}>👟 100k pas</div>}
        </div>
      </div>

      {/* Stats globales */}
      <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'13px', letterSpacing:'2px', color:'var(--muted)', padding:'8px 20px 6px' }}>MES STATS GLOBALES</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', padding:'0 16px 12px' }}>
        {[
          { val: seances, lbl: 'Séances muscu' },
          { val: pas >= 1000 ? Math.round(pas/1000)+'k' : pas, lbl: 'Pas cumulés' },
          { val: annexe, lbl: 'Activités annexes' },
          { val: `${profile?.streak || 0}j`, lbl: 'Streak actuel' },
        ].map(s => (
          <div key={s.lbl} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius, 16px)', padding:'14px' }}>
            <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'28px', color:'var(--accent)' }}>{s.val}</div>
            <div style={{ fontSize:'11px', color:'var(--muted)', marginTop:'2px' }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Activité par semaine */}
      <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'13px', letterSpacing:'2px', color:'var(--muted)', padding:'8px 20px 6px' }}>ACTIVITÉ PAR SEMAINE</div>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius, 16px)', padding:'16px', margin:'0 16px 12px' }}>
        {weeklyStats.map(w => (
          <div key={w.label} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
            <div style={{ fontSize:'12px', color:'var(--muted)', width:'50px', textAlign:'right', flexShrink:0 }}>{w.label}</div>
            <div style={{ flex:1, height:'10px', background:'var(--bg3)', borderRadius:'5px', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:'5px', background:'var(--accent)', width:`${Math.round(w.count/maxWeek*100)}%`, transition:'width .6s' }}/>
            </div>
            <div style={{ fontSize:'12px', fontWeight:'600', width:'40px', flexShrink:0, color:'var(--accent)' }}>{w.count}</div>
          </div>
        ))}
      </div>

      {/* Répartition */}
      <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'13px', letterSpacing:'2px', color:'var(--muted)', padding:'8px 20px 6px' }}>RÉPARTITION DES ACTIVITÉS</div>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius, 16px)', padding:'16px', margin:'0 16px 12px' }}>
        {[
          { lbl:'Muscu', val:seances, max:maxSeances, color:'var(--accent)' },
          { lbl:'Pas', val: pas >= 1000 ? Math.round(pas/1000)+'k' : pas, pct: pas/maxPas, color:'var(--accent2)' },
          { lbl:'Annexe', val:annexe, max:maxAnnexe, color:'var(--accent3)' },
        ].map(r => (
          <div key={r.lbl} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
            <div style={{ fontSize:'12px', color:'var(--muted)', width:'50px', textAlign:'right', flexShrink:0 }}>{r.lbl}</div>
            <div style={{ flex:1, height:'10px', background:'var(--bg3)', borderRadius:'5px', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:'5px', background: r.color, width:`${Math.round((r.pct ?? r.val/r.max)*100)}%`, transition:'width .6s' }}/>
            </div>
            <div style={{ fontSize:'12px', fontWeight:'600', width:'40px', flexShrink:0, color: r.color }}>{r.val}</div>
          </div>
        ))}
      </div>

      {/* Paramètres */}
      <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'13px', letterSpacing:'2px', color:'var(--muted)', padding:'8px 20px 6px' }}>PARAMÈTRES</div>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius, 16px)', padding:'12px 14px', margin:'0 16px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0' }}>
          <span style={{ fontSize:'14px' }}>{isDark ? '🌙' : '☀️'} Thème {isDark ? 'sombre' : 'clair'}</span>
          <div onClick={toggleTheme} style={{ width:'48px', height:'26px', background: isDark ? 'var(--accent)' : 'var(--muted2)', borderRadius:'13px', position:'relative', cursor:'pointer', transition:'.3s' }}>
            <div style={{ width:'20px', height:'20px', background:'#fff', borderRadius:'50%', position:'absolute', top:'3px', left: isDark ? '25px' : '3px', transition:'.3s' }}/>
          </div>
        </div>
      </div>

      <button onClick={signOut} style={{ width:'calc(100% - 32px)', margin:'4px 16px 24px', background:'transparent', color:'var(--muted)', border:'1px solid var(--border)', borderRadius:'14px', padding:'14px', fontSize:'14px', fontFamily:'DM Sans, sans-serif', cursor:'pointer' }}>
        Se déconnecter
      </button>
    </div>
  )
}
