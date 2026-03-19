import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getWeekEntries, getEntriesByUser } from '../lib/queries'

const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

export default function HomePage() {
  const { profile } = useAuth()
  const [weekEntries, setWeekEntries] = useState([])
  const [recentEntries, setRecentEntries] = useState([])

  useEffect(() => {
    if (!profile) return
    getWeekEntries(profile.id).then(({ data }) => setWeekEntries(data || []))
    getEntriesByUser(profile.id).then(({ data }) => setRecentEntries((data || []).slice(0, 5)))
  }, [profile])

  const today = new Date()
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1

  const seancesWeek = weekEntries.filter(e => e.activity_type === 'muscu').length
  const pasWeek = weekEntries.filter(e => e.activity_type === 'pas').reduce((s,e) => s+e.value, 0)
  const annexeWeek = weekEntries.filter(e => e.activity_type === 'annexe').length

  const activeDays = new Set(weekEntries.map(e => new Date(e.date).getDay() === 0 ? 6 : new Date(e.date).getDay() - 1))

  const activityIcon = { muscu:'💪', pas:'👟', annexe:'🏃', velo:'🚴', run:'🏃', natation:'🏊' }
  const activityColor = { muscu:'rgba(232,255,71,.12)', pas:'rgba(71,196,255,.12)', annexe:'rgba(255,107,53,.12)' }

  return (
    <div>
      {/* Hero */}
      <div style={{ margin:'8px 16px 12px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:'20px', padding:'20px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'140px', height:'140px', background:'var(--accent)', opacity:.06, borderRadius:'50%' }}/>
        <div style={{ fontSize:'13px', color:'var(--muted)', marginBottom:'4px' }}>Bonjour 👋</div>
        <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'36px', letterSpacing:'1px', lineHeight:1 }}>{profile?.username?.toUpperCase()}</div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'var(--accent)', color:'#000', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', marginTop:'10px' }}>
          🔥 {profile?.streak || 0} jours de streak
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginTop:'16px' }}>
          {[
            { val: seancesWeek, lbl: 'séances' },
            { val: pasWeek.toLocaleString('fr-FR'), lbl: 'pas' },
            { val: annexeWeek, lbl: 'activités' },
          ].map(s => (
            <div key={s.lbl} style={{ background:'var(--bg3)', borderRadius:'12px', padding:'10px', textAlign:'center' }}>
              <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'22px', color:'var(--accent)', lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:'10px', color:'var(--muted)', marginTop:'2px' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Semaine */}
      <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'13px', letterSpacing:'2px', color:'var(--muted)', padding:'8px 20px 6px' }}>CETTE SEMAINE</div>
      <div style={{ display:'flex', gap:'6px', padding:'0 16px 12px', overflowX:'auto' }}>
        {DAYS.map((d, i) => {
          const done = activeDays.has(i)
          const isToday = i === dayOfWeek
          return (
            <div key={d} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', flexShrink:0 }}>
              <div style={{ fontSize:'10px', color:'var(--muted)' }}>{d}</div>
              <div style={{
                width:'28px', height:'28px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'600',
                background: done ? 'var(--accent)' : isToday ? 'rgba(232,255,71,.1)' : 'var(--bg3)',
                border: `1px solid ${done ? 'var(--accent)' : isToday ? 'var(--accent)' : 'var(--border)'}`,
                color: done ? '#000' : isToday ? 'var(--accent)' : 'var(--muted)'
              }}>
                {done ? '✓' : isToday ? '—' : ''}
              </div>
            </div>
          )
        })}
      </div>

      {/* Activités récentes */}
      <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'13px', letterSpacing:'2px', color:'var(--muted)', padding:'8px 20px 6px' }}>MES DERNIÈRES ACTIVITÉS</div>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius, 16px)', padding:'16px', margin:'0 16px 12px' }}>
        {recentEntries.length === 0 && (
          <div style={{ textAlign:'center', color:'var(--muted)', fontSize:'13px', padding:'12px 0' }}>Aucune activité encore — ajoutes-en une ! 💪</div>
        )}
        {recentEntries.map((e, i) => (
          <div key={e.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom: i < recentEntries.length-1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', background: activityColor[e.activity_type] || 'var(--bg3)', flexShrink:0 }}>
              {activityIcon[e.activity_type] || '⚡'}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'14px', fontWeight:'500' }}>{e.activity_name || (e.activity_type === 'muscu' ? 'Séance muscu' : e.activity_type === 'pas' ? 'Marche / course' : 'Activité')}</div>
              <div style={{ fontSize:'12px', color:'var(--muted)' }}>{new Date(e.date).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })}</div>
            </div>
            <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'16px', color:'var(--accent)', textAlign:'right' }}>
              {e.activity_type === 'pas' ? `${e.value.toLocaleString()} pas` : e.activity_type === 'muscu' ? '1 séance' : `${e.value} min`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
