export default function BottomNav({ current, onChange }) {
  const items = [
    { key:'home', icon:'🏠', label:'ACCUEIL' },
    { key:'lb', icon:'🏆', label:'CLASSEMENT' },
    { key:'add', icon:'＋', label:'AJOUTER' },
    { key:'profile', icon:'👤', label:'PROFIL' },
  ]

  return (
    <nav style={{
      height:'var(--nav-h, 70px)', background:'var(--bg2)', borderTop:'1px solid var(--border)',
      display:'flex', alignItems:'center', justifyContent:'space-around', flexShrink:0,
      paddingBottom:'env(safe-area-inset-bottom)'
    }}>
      {items.map(item => (
        <div key={item.key} onClick={() => onChange(item.key)}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', cursor:'pointer', padding:'8px 16px', borderRadius:'12px', flex:1, transition:'.2s' }}>
          <div style={{ fontSize: item.key === 'add' ? '26px' : '22px', transition:'.2s', transform: current === item.key ? 'scale(1.15)' : 'scale(1)' }}>
            {item.icon}
          </div>
          <div style={{ fontSize:'10px', fontWeight:'500', letterSpacing:'.5px', color: current === item.key ? 'var(--accent)' : 'var(--muted)' }}>
            {item.label}
          </div>
        </div>
      ))}
    </nav>
  )
}
