import { useState } from 'react'
import { signIn, signUp } from '../lib/queries'

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    setError(''); setSuccess(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      if (!username.trim()) { setError('Choisis un pseudo'); setLoading(false); return }
      const { error } = await signUp(email, password, username)
      if (error) setError(error.message)
      else setSuccess('Vérifie tes emails pour confirmer ton compte !')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100dvh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'48px', letterSpacing:'4px', color:'var(--accent)', marginBottom:'4px' }}>FISSURE</div>
      <div style={{ fontSize:'13px', color:'var(--muted)', marginBottom:'40px' }}>Projet compétition</div>

      <div style={{ width:'100%', maxWidth:'380px' }}>
        <div style={{ display:'flex', background:'var(--bg2)', borderRadius:'12px', padding:'4px', marginBottom:'24px', border:'1px solid var(--border)' }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{ flex:1, padding:'10px', borderRadius:'10px', border:'none', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontWeight:'600', fontSize:'14px', transition:'.2s',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#000' : 'var(--muted)' }}>
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {mode === 'register' && (
          <div style={{ marginBottom:'12px' }}>
            <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.8px', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Pseudo</label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              placeholder="ex: Thomas" style={inputStyle} />
          </div>
        )}

        <div style={{ marginBottom:'12px' }}>
          <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.8px', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="ton@email.com" style={inputStyle} />
        </div>

        <div style={{ marginBottom:'24px' }}>
          <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.8px', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Mot de passe</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {error && <div style={{ background:'rgba(255,80,80,.1)', border:'1px solid rgba(255,80,80,.3)', borderRadius:'10px', padding:'12px', fontSize:'13px', color:'#ff6060', marginBottom:'16px' }}>{error}</div>}
        {success && <div style={{ background:'rgba(71,196,255,.1)', border:'1px solid rgba(71,196,255,.3)', borderRadius:'10px', padding:'12px', fontSize:'13px', color:'var(--accent3)', marginBottom:'16px' }}>{success}</div>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width:'100%', background:'var(--accent)', color:'#000', border:'none', borderRadius:'14px', padding:'16px', fontSize:'16px', fontWeight:'700', fontFamily:'DM Sans, sans-serif', cursor:'pointer', opacity: loading ? .7 : 1 }}>
          {loading ? '...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  width:'100%', background:'var(--card)', border:'1px solid var(--border)',
  borderRadius:'12px', padding:'14px 16px', color:'var(--text)',
  fontSize:'16px', fontFamily:'DM Sans, sans-serif', outline:'none'
}
