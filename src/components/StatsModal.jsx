import { useEffect, useState } from 'react'
import { getEntriesByUser } from '../lib/queries'

export default function StatsModal({ user, onClose }) {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    getEntriesByUser(user.id).then(({ data }) => setEntries(data || []))
  }, [user.id])

  const seances = entries.filter(e => e.activity_type === 'muscu').length
  const pas = entries.filter(e => e.activity_type === 'pas').reduce((s,e) => s+e.value, 0)
  const annexe = entries.filter(e => e.activity_type === 'annexe').length
  const maxVal = Math.max(seances, 1)

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:100, display:'flex', flexDirection:'column', justifyContent:'flex-end', backdropFilter:'blur(4px)' }}>
      <div style={{ background:'var(--bg2)', borderRadius:'24px 24px 0 0', padding:'20px 0 40px', maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ width:'36px', height:'4px', background:'var(--border)', borderRadius:'2px', margin:'0 auto 16px' }}/>
        <button onClick={onClose} style={{ position:'absolute', top:'16px', right:'16px', width:'32px', height:'32px', background:'var(--bg3)', borderRadius:'50%', border:'none', color:'var(--text)', fontSize:'18px', cursor:'pointer' }}>✕</button>

        <div style={{ textAlign:'center', padding:'0 20px 16px' }}>
          <div style={{ fontSize:'40px', marginBottom:'8px' }}>{user.emoji}</div>
          <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'30px', letterSpacing:'1px' }}>{user.username}</div>
          <div style={{ fontSize:'12px', color:'var(--muted)', marginTop:'2px' }}>
            {user.streak > 0 && `🔥 ${user.streak} jours de streak`}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', padding:'0 16px 16px' }}>
          {[
            { val: seances, lbl: 'Séances muscu' },
            { val: pas >= 1000 ? Math.round(pas/1000)+'k' : pas, lbl: 'Pas cumulés' },
            { val: annexe, lbl: 'Activités annexes' },
            { val: `${user.streak || 0}j`, lbl: 'Streak actuel' },
          ].map(s => (
            <div key={s.lbl} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'12px', padding:'14px' }}>
              <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'28px', color:'var(--accent)' }}>{s.val}</div>
              <div style={{ fontSize:'11px', color:'var(--muted)', marginTop:'2px' }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'13px', letterSpacing:'2px', color:'var(--muted)', padding:'8px 20px 6px' }}>RÉPARTITION</div>
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'12px', padding:'16px', margin:'0 16px' }}>
          {[
            { lbl:'Muscu', val:seances, pct:seances/maxVal, color:'var(--accent)' },
            { lbl:'Pas', val: pas >= 1000 ? Math.round(pas/1000)+'k' : pas, pct: pas / Math.max(pas,1), color:'var(--accent2)' },
            { lbl:'Annexe', val:annexe, pct: annexe / Math.max(annexe,1), color:'var(--accent3)' },
          ].map(r => (
            <div key={r.lbl} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
              <div style={{ fontSize:'12px', color:'var(--muted)', width:'50px', textAlign:'right', flexShrink:0 }}>{r.lbl}</div>
              <div style={{ flex:1, height:'10px', background:'var(--bg3)', borderRadius:'5px', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:'5px', background:r.color, width:`${Math.round(r.pct*100)}%` }}/>
              </div>
              <div style={{ fontSize:'12px', fontWeight:'600', width:'40px', flexShrink:0, color:r.color }}>{r.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
