export default function BottomNav({ current, onChange }) {
  const items = [
    { key: 'today', icon: '🏠', label: 'AUJOURD’HUI' },
    { key: 'habits', icon: '✅', label: 'HABITUDES' },
    { key: 'progress', icon: '📈', label: 'PROGRÈS' },
    { key: 'group', icon: '🏆', label: 'GROUPE' },
    { key: 'profile', icon: '👤', label: 'PROFIL' },
  ]

  return (
    <nav style={{
      height: 'var(--nav-h, 70px)', background: 'var(--bg2)', borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexShrink: 0,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {items.map(item => (
        <div key={item.key} onClick={() => onChange(item.key)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', padding: '8px 2px', borderRadius: '12px', flex: 1, transition: '.2s' }}>
          <div style={{ fontSize: '21px', transition: '.2s', transform: current === item.key ? 'scale(1.15)' : 'scale(1)' }}>
            {item.icon}
          </div>
          <div style={{ fontSize: '8.5px', fontWeight: '500', letterSpacing: '.4px', color: current === item.key ? 'var(--accent)' : 'var(--muted)' }}>
            {item.label}
          </div>
        </div>
      ))}
    </nav>
  )
}
