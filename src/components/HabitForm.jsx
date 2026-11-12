import { useState } from 'react'
import { Sheet, Toggle, PrimaryButton, GhostButton, inputStyle, labelStyle, Chip } from './Ui'
import { TEMPLATES, EMOJI_CHOICES } from '../lib/templates'

const KINDS = [
  { key: 'check', label: '✓ Fait / pas fait' },
  { key: 'count', label: '＃ Quantité' },
  { key: 'duration', label: '⏱ Durée' },
]

export default function HabitForm({ habit, defaultVisibility = 'private', onSave, onClose, onArchive, onDelete }) {
  const editing = !!habit
  const [name, setName] = useState(habit?.name || '')
  const [emoji, setEmoji] = useState(habit?.emoji || '🎯')
  const [kind, setKind] = useState(habit?.kind || 'check')
  const [unit, setUnit] = useState(habit?.kind === 'count' ? habit.unit || '' : '')
  const [period, setPeriod] = useState(habit?.target_period || 'week')
  const [target, setTarget] = useState(habit ? String(habit.target_value ?? '') : '3')
  const [shared, setShared] = useState((habit?.visibility || defaultVisibility) === 'group')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function applyTemplate(t) {
    setName(t.name); setEmoji(t.emoji); setKind(t.kind); setUnit(t.unit)
    setPeriod(t.target_period); setTarget(String(t.target_value))
  }

  async function submit() {
    setError('')
    if (!name.trim()) { setError('Donne un nom à ton habitude'); return }
    let target_value
    if (kind === 'check') {
      target_value = period === 'day' ? 1 : Math.min(7, Math.max(1, Math.round(Number(target) || 1)))
    } else {
      target_value = Number(target)
      if (!(target_value > 0)) { setError('Indique un objectif supérieur à 0'); return }
    }
    setSaving(true)
    const ok = await onSave({
      ...(editing ? { id: habit.id } : {}),
      name: name.trim(),
      emoji: emoji.trim() || '🎯',
      kind,
      unit: kind === 'count' ? unit.trim() : kind === 'duration' ? 'min' : null,
      target_value,
      target_period: period,
      visibility: shared ? 'group' : 'private',
    })
    setSaving(false)
    if (ok) onClose()
    else setError("Impossible d'enregistrer, réessaie.")
  }

  return (
    <Sheet title={editing ? 'MODIFIER' : 'NOUVELLE HABITUDE'} onClose={onClose}>
      {!editing && (
        <div className="hide-scroll" style={{ display: 'flex', gap: '8px', padding: '0 16px 14px', overflowX: 'auto' }}>
          {TEMPLATES.map(t => (
            <Chip key={t.name} onClick={() => applyTemplate(t)}>{t.emoji} {t.name}</Chip>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', margin: '0 16px 12px' }}>
        <div style={{ width: '72px', flexShrink: 0 }}>
          <label style={labelStyle}>Emoji</label>
          <input value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={4} style={{ ...inputStyle, textAlign: 'center', padding: '14px 6px' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Nom</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="ex: Muscu, Eau, Lecture" style={inputStyle} />
        </div>
      </div>

      <div className="hide-scroll" style={{ display: 'flex', gap: '6px', padding: '0 16px 14px', overflowX: 'auto' }}>
        {EMOJI_CHOICES.map(e => (
          <div key={e} onClick={() => setEmoji(e)}
            style={{ fontSize: '20px', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', background: emoji === e ? 'rgba(232,255,71,.15)' : 'var(--card)', border: `1px solid ${emoji === e ? 'var(--accent)' : 'var(--border)'}` }}>
            {e}
          </div>
        ))}
      </div>

      <div style={{ margin: '0 16px 12px' }}>
        <label style={labelStyle}>Type</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {KINDS.map(k => (
            <div key={k.key} onClick={() => setKind(k.key)}
              style={{ flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: kind === k.key ? 'var(--accent)' : 'var(--card)', color: kind === k.key ? '#000' : 'var(--muted)', border: `1px solid ${kind === k.key ? 'var(--accent)' : 'var(--border)'}` }}>
              {k.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: '0 16px 12px' }}>
        <label style={labelStyle}>Objectif</label>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          {[['day', 'Par jour'], ['week', 'Par semaine']].map(([k, l]) => (
            <div key={k} onClick={() => setPeriod(k)}
              style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: period === k ? 'var(--accent2)' : 'var(--card)', color: period === k ? '#fff' : 'var(--muted)', border: `1px solid ${period === k ? 'var(--accent2)' : 'var(--border)'}` }}>
              {l}
            </div>
          ))}
        </div>
        {kind === 'check' && period === 'day' && (
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>À faire tous les jours.</div>
        )}
        {(kind !== 'check' || period === 'week') && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="number" inputMode="decimal" value={target} onChange={e => setTarget(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            {kind === 'count' && (
              <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="unité (pas, verres…)" style={{ ...inputStyle, flex: 1.3 }} />
            )}
            {kind === 'duration' && <div style={{ fontSize: '14px', color: 'var(--muted)' }}>minutes</div>}
            {kind === 'check' && <div style={{ fontSize: '14px', color: 'var(--muted)' }}>fois / semaine</div>}
          </div>
        )}
      </div>

      <div style={{ margin: '0 16px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>{shared ? '👥 Visible par le groupe' : '🔒 Privée'}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
            {shared ? 'Tes amis voient cette habitude et ta progression.' : 'Toi seul(e) la vois, personne d’autre.'}
          </div>
        </div>
        <Toggle on={shared} onChange={setShared} />
      </div>

      {error && <div style={{ margin: '0 16px 12px', color: '#ff6060', fontSize: '13px' }}>{error}</div>}

      <PrimaryButton onClick={submit} disabled={saving}>{saving ? '...' : editing ? 'Enregistrer' : 'Créer l’habitude'}</PrimaryButton>

      {editing && (
        <>
          <GhostButton onClick={() => { onArchive(habit); onClose() }}>
            {habit.archived ? '↩ Réactiver cette habitude' : '📦 Archiver (garde l’historique)'}
          </GhostButton>
          <GhostButton danger onClick={() => {
            if (window.confirm('Supprimer définitivement cette habitude et tout son historique ?')) { onDelete(habit); onClose() }
          }}>
            Supprimer définitivement
          </GhostButton>
        </>
      )}
    </Sheet>
  )
}
