import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { addEntry } from '../lib/queries'

const TYPES = [
  { key:'muscu', icon:'💪', name:'Muscu', hint:'Séance poids' },
  { key:'pas', icon:'👟', name:'Pas', hint:'Nombre de pas' },
  { key:'velo', icon:'🚴', name:'Vélo', hint:'Cardio / sortie' },
  { key:'run', icon:'🏃', name:'Course', hint:'Running' },
  { key:'natation', icon:'🏊', name:'Natation', hint:'Piscine / mer' },
  { key:'autre', icon:'⚡', name:'Autre', hint:'Perso' },
]

export default function AddActivityPage() {
  const { profile, refreshProfile } = useAuth()
  const [type, setType] = useState('muscu')
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [activityName, setActivityName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  async function handleSubmit() {
    if (!value && type !== 'muscu') return
    setLoading(true)

    const activityType = ['muscu','pas'].includes(type) ? type : 'annexe'
    const entry = {
      activity_type: activityType,
      activity_name: type === 'muscu' ? 'Séance muscu' : type === 'pas' ? 'Marche / course' : activityName || TYPES.find(t=>t.key===type)?.name,
      value: type === 'muscu' ? 1 : parseInt(value) || 0,
      note,
      date
    }

    const { error } = await addEntry(profile.id, entry)
    if (!error) {
      setSuccess(true)
      setValue(''); setNote(''); setActivityName('')
      setDate(new Date().toISOString().split('T')[0])
      setTimeout(() => setSuccess(false), 2500)
      refreshProfile()
    }
    setLoading(false)
  }

  const inputStyle = {
    width:'100%', background:'var(--card)', border:'1px solid var(--border)',
    borderRadius:'12px', padding:'14px 16px', color:'var(--text)',
    fontSize:'16px', fontFamily:'DM Sans, sans-serif', outline:'none'
  }

  const today = new Date().toISOString().split('T')[0]
  const isToday = date === today

  return (
    <div>
      <div style={{ padding:'8px 20px 16px' }}>
        <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'32px', letterSpacing:'1px' }}>NOUVELLE ACTIVITÉ</div>
        <div style={{ fontSize:'13px', color:'var(--muted)' }}>Qu'est-ce que tu as fait ?</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', padding:'0 16px 16px' }}>
        {TYPES.map(t => (
          <div key={t.key} onClick={() => setType(t.key)}
            style={{ border:`2px solid ${type===t.key ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius:'var(--radius, 16px)', padding:'16px', cursor:'pointer', textAlign:'center', transition:'.2s',
              background: type===t.key ? 'rgba(232,255,71,.06)' : 'var(--card)' }}>
            <div style={{ fontSize:'28px', marginBottom:'6px' }}>{t.icon}</div>
            <div style={{ fontSize:'13px', fontWeight:'600' }}>{t.name}</div>
            <div style={{ fontSize:'11px', color:'var(--muted)', marginTop:'2px' }}>{t.hint}</div>
          </div>
        ))}
      </div>

      <div style={{ margin:'0 16px 12px' }}>
        <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.8px', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>
          Date {!isToday && <span style={{ color:'var(--accent)', marginLeft:'6px' }}>↩ Saisie rétroactive</span>}
        </label>
        <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, colorScheme:'dark' }} />
      </div>

      {type === 'muscu' && (
        <div style={{ margin:'0 16px 12px' }}>
          <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.8px', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Note (optionnel)</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="ex: Pec / épaules, PR squat..." style={inputStyle} />
        </div>
      )}

      {type === 'pas' && (
        <div style={{ margin:'0 16px 12px' }}>
          <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.8px', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Nombre de pas</label>
          <input type="number" inputMode="numeric" value={value} onChange={e => setValue(e.target.value)} placeholder="ex: 10000" style={inputStyle} />
        </div>
      )}

      {!['muscu','pas'].includes(type) && (
        <>
          {type === 'autre' && (
            <div style={{ margin:'0 16px 12px' }}>
              <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.8px', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Nom de l'activité</label>
              <input value={activityName} onChange={e => setActivityName(e.target.value)} placeholder="ex: Tennis, Escalade..." style={inputStyle} />
            </div>
          )}
          <div style={{ margin:'0 16px 12px' }}>
            <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.8px', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Durée (minutes)</label>
            <input type="number" inputMode="numeric" value={value} onChange={e => setValue(e.target.value)} placeholder="ex: 45" style={inputStyle} />
          </div>
        </>
      )}

      {success && (
        <div style={{ margin:'0 16px 12px', background:'rgba(232,255,71,.1)', border:'1px solid rgba(232,255,71,.3)', borderRadius:'12px', padding:'14px', fontSize:'14px', fontWeight:'600', color:'var(--accent)', textAlign:'center' }}>
          ✓ Activité enregistrée !
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading}
        style={{ width:'calc(100% - 32px)', margin:'4px 16px', background:'var(--accent)', color:'#000', border:'none', borderRadius:'14px', padding:'16px', fontSize:'16px', fontWeight:'700', fontFamily:'DM Sans, sans-serif', cursor:'pointer', opacity: loading ? .7 : 1 }}>
        {loading ? '...' : "✓ Enregistrer l'activité"}
      </button>
    </div>
  )
}
