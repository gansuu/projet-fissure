import { useState } from 'react'

export const inputStyle = {
  width: '100%', background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: '12px', padding: '14px 16px', color: 'var(--text)',
  fontSize: '16px', fontFamily: 'DM Sans, sans-serif', outline: 'none',
}

export const labelStyle = {
  fontSize: '11px', fontWeight: '600', color: 'var(--muted)', letterSpacing: '.8px',
  textTransform: 'uppercase', display: 'block', marginBottom: '6px',
}

// ─── Aide : petit « ? » qui déroule une explication ─────────────
export function HelpButton({ open, onClick }) {
  return (
    <button type="button" aria-label="Aide" onClick={onClick}
      style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, padding: 0, cursor: 'pointer',
        border: `1px solid ${open ? 'var(--accent)' : 'var(--muted2)'}`, background: open ? 'var(--accent)' : 'transparent',
        color: open ? '#000' : 'var(--muted)', fontSize: '11px', fontWeight: 700, lineHeight: '18px', fontFamily: 'DM Sans, sans-serif' }}>
      ?
    </button>
  )
}

export function HelpBubble({ children, style }) {
  return (
    <div style={{ margin: '0 16px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '12px',
      padding: '10px 12px', fontSize: '12.5px', lineHeight: 1.55, color: 'var(--text)', ...style }}>
      {children}
    </div>
  )
}

export function Heading({ children, help }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 20px 12px' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '32px', letterSpacing: '1px', lineHeight: 1 }}>{children}</div>
        {help && <HelpButton open={open} onClick={() => setOpen(o => !o)} />}
      </div>
      {help && open && <HelpBubble>{help}</HelpBubble>}
    </>
  )
}

export function SectionTitle({ children, right, help }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px 6px' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '13px', letterSpacing: '2px', color: 'var(--muted)' }}>{children}</div>
        {help && <HelpButton open={open} onClick={() => setOpen(o => !o)} />}
        {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
      </div>
      {help && open && <HelpBubble>{help}</HelpBubble>}
    </>
  )
}

// Champ de formulaire : libellé + « ? » optionnel
export function Field({ label, help, children, style }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ margin: '0 16px 14px', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>{label}</label>
        {help && <HelpButton open={open} onClick={() => setOpen(o => !o)} />}
      </div>
      {help && open && <HelpBubble style={{ margin: '0 0 8px' }}>{help}</HelpBubble>}
      {children}
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

export function ChipRow({ children, style }) {
  return <div className="hide-scroll" style={{ display: 'flex', gap: '8px', padding: '0 16px 10px', overflowX: 'auto', ...style }}>{children}</div>
}

export function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: '48px', height: '26px', background: on ? 'var(--accent)' : 'var(--muted2)', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: '.3s', flexShrink: 0 }}>
      <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: on ? '25px' : '3px', transition: '.3s' }} />
    </div>
  )
}

// Ligne « libellé  ?  interrupteur »
export function ToggleRow({ label, help, on, onChange, style }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
        <div style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>{label}</div>
        {help && <HelpButton open={open} onClick={() => setOpen(o => !o)} />}
        <Toggle on={on} onChange={onChange} />
      </div>
      {help && open && <HelpBubble style={{ margin: '0 0 8px' }}>{help}</HelpBubble>}
    </div>
  )
}

// Section repliable (profil : options avancées)
export function Collapsible({ icon, title, help, children }) {
  const [open, setOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius, 16px)', margin: '0 16px 10px', overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', cursor: 'pointer' }}>
        <div style={{ fontSize: '20px' }}>{icon}</div>
        <div style={{ flex: 1, fontSize: '15px', fontWeight: '600' }}>{title}</div>
        {help && <HelpButton open={helpOpen} onClick={e => { e.stopPropagation(); setHelpOpen(o => !o) }} />}
        <div style={{ color: 'var(--muted)', fontSize: '18px', transform: open ? 'rotate(90deg)' : 'none', transition: '.2s' }}>›</div>
      </div>
      {help && helpOpen && <HelpBubble style={{ margin: '0 16px 12px' }}>{help}</HelpBubble>}
      {open && <div style={{ borderTop: '1px solid var(--border)', padding: '14px 0 6px' }}>{children}</div>}
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
