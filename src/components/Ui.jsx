export const inputStyle = {
  width: '100%', background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: '12px', padding: '14px 16px', color: 'var(--text)',
  fontSize: '16px', fontFamily: 'DM Sans, sans-serif', outline: 'none',
}

export const labelStyle = {
  fontSize: '11px', fontWeight: '600', color: 'var(--muted)', letterSpacing: '.8px',
  textTransform: 'uppercase', display: 'block', marginBottom: '6px',
}

export function SectionTitle({ children, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 20px 6px' }}>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '13px', letterSpacing: '2px', color: 'var(--muted)' }}>{children}</div>
      {right}
    </div>
  )
}

export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius, 16px)',
      padding: '16px', margin: '0 16px 12px', ...style,
    }}>
      {children}
    </div>
  )
}

export function Chip({ active, onClick, children, color = 'var(--accent)', textColor = '#000' }) {
  return (
    <div onClick={onClick} style={{
      padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap',
      cursor: 'pointer', flexShrink: 0, transition: '.2s',
      background: active ? color : 'var(--card)',
      color: active ? textColor : 'var(--muted)',
      border: `1px solid ${active ? color : 'var(--border)'}`,
    }}>
      {children}
    </div>
  )
}

export function ChipRow({ children }) {
  return <div className="hide-scroll" style={{ display: 'flex', gap: '8px', padding: '0 16px 10px', overflowX: 'auto' }}>{children}</div>
}

export function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: '48px', height: '26px', background: on ? 'var(--accent)' : 'var(--muted2)', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: '.3s', flexShrink: 0 }}>
      <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: on ? '25px' : '3px', transition: '.3s' }} />
    </div>
  )
}

export function Bar({ ratio, color = 'var(--accent)', height = 8 }) {
  return (
    <div style={{ height: `${height}px`, background: 'var(--bg3)', borderRadius: '5px', overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: '5px', background: color, width: `${Math.round(Math.max(0, Math.min(1, ratio || 0)) * 100)}%`, transition: 'width .5s' }} />
    </div>
  )
}

export function Sheet({ title, onClose, children }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: '430px', background: 'var(--bg2)', color: 'var(--text)', borderRadius: '24px 24px 0 0', padding: '16px 0 32px', maxHeight: '92dvh', overflowY: 'auto', position: 'relative' }}>
        <div style={{ width: '36px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '0 auto 12px' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '16px', width: '32px', height: '32px', background: 'var(--bg3)', borderRadius: '50%', border: 'none', color: 'var(--text)', fontSize: '16px', cursor: 'pointer' }}>✕</button>
        {title && <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '26px', letterSpacing: '1px', padding: '0 20px 12px' }}>{title}</div>}
        {children}
      </div>
    </div>
  )
}

export function PrimaryButton({ children, onClick, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: 'calc(100% - 32px)', margin: '4px 16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '700', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', opacity: disabled ? .6 : 1, ...style }}>
      {children}
    </button>
  )
}

export function GhostButton({ children, onClick, danger, style }) {
  return (
    <button onClick={onClick}
      style={{ width: 'calc(100% - 32px)', margin: '4px 16px', background: 'transparent', color: danger ? '#ff6060' : 'var(--muted)', border: `1px solid ${danger ? 'rgba(255,80,80,.4)' : 'var(--border)'}`, borderRadius: '14px', padding: '14px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', ...style }}>
      {children}
    </button>
  )
}

export function ErrorBanner({ message, onClose }) {
  if (!message) return null
  return (
    <div onClick={onClose} style={{ margin: '0 16px 12px', background: 'rgba(255,80,80,.1)', border: '1px solid rgba(255,80,80,.3)', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#ff6060', cursor: 'pointer' }}>
      {message}
    </div>
  )
}
