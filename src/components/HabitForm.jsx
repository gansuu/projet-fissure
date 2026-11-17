import { useState } from 'react'
import { Sheet, PrimaryButton, GhostButton, inputStyle, Chip, ChipRow, Field, ToggleRow } from './Ui'
import { TEMPLATES, EMOJI_CHOICES } from '../lib/templates'

const KINDS = [
  { key: 'check', label: '✓ Fait' },
  { key: 'count', label: '＃ Quantité' },
  { key: 'duration', label: '⏱ Durée' },
]
const UNITS = ['pas', 'verres', 'pages', 'km']
const COUNT_PRESETS = { pas: [5000, 8000, 10000, 15000], verres: [4, 6, 8, 10], pages: [10, 20, 30], km: [3, 5, 10] }
const COUNT_DEFAULT = [1, 2, 3, 5, 10]
const DURATION_PRESETS = { day: [15, 30, 45, 60, 90], week: [60, 120, 180, 300] }
const fmtN = n => Number(n).toLocaleString('fr-FR')

export default function HabitForm({ habit, defaultVisibility = 'private', onSave, onClose, onArchive, onDelete }) {
  const editing = !!habit
  const [name, setName] = useState(habit?.name || '')
  const [emoji, setEmoji] = useState(habit?.emoji || '🎯')
  const [kind, setKind] = useState(habit?.kind || 'check')
  const [unit, setUnit] = useState(habit?.kind === 'count' ? habit.unit || '' : 'pas')
  const [period, setPeriod] = useState(habit?.target_period || 'week')
  const [target, setTarget] = useState(habit ? String(habit.target_value ?? '') : '3')
  const [shared, setShared] = useState((habit?.visibility || defaultVisibility) === 'group')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function applyTemplate(t) {
    setName(t.name); setEmoji(t.emoji); setKind(t.kind); setUnit(t.unit || 'pas')
    setPeriod(t.target_period); setTarget(String(t.target_value))
  }

  // Changer de type propose directement des valeurs cohérentes
  function chooseKind(k) {
    if (k === kind) return
    setKind(k)
    if (k === 'check') { setPeriod('week'); setTarget('3') }
    if (k === 'count') { setPeriod('day'); setUnit('pas'); setTarget('10000') }
    if (k === 'duration') { setPeriod('day'); setTarget('30') }
  }

  async function submit() {
    setError('')
    if (!name.trim()) { setError('Donne un nom à ton habitude'); return }
    let target_value
    if (kind === 'check') {
      target_value = period === 'day' ? 1 : Math.min(7, Math.max(1, Math.round(Number(target) || 1)))
    } else {
      target_value = Number(target)
      if (!(target_value > 0)) { setError('Choisis un objectif supérieur à 0'); return }
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

  const presets = kind === 'count' ? (COUNT_PRESETS[unit] || COUNT_DEFAULT) : DURATION_PRESETS[period]

  return (
    <Sheet title={editing ? 'MODIFIER' : 'NOUVELLE HABITUDE'} onClose={onClose}>
      {!editing && (
        <ChipRow style={{ paddingBottom: '14px' }}>
          {TEMPLATES.map(t => <Chip key={t.name} onClick={() => applyTemplate(t)}>{t.emoji} {t.name}</Chip>)}
        </ChipRow>
      )}

      <div style={{ display: 'flex', gap: '10px', margin: '0 16px 10px' }}>
        <input value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={4} aria-label="Emoji"
          style={{ ...inputStyle, width: '64px', flexShrink: 0, textAlign: 'center', padding: '14px 4px' }} />
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom de l’habitude" style={inputStyle} />
      </div>
      <ChipRow style={{ paddingBottom: '14px' }}>
        {EMOJI_CHOICES.map(e => (
          <div key={e} onClick={() => setEmoji(e)}
            style={{ fontSize: '20px', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', background: emoji === e ? 'rgba(232,255,71,.15)' : 'var(--card)', border: `1px solid ${emoji === e ? 'var(--accent)' : 'var(--border)'}` }}>
            {e}
          </div>
        ))}
      </ChipRow>

      <Field label="Type"
        help={<><b>Fait</b> : tu coches (ex. muscu). <b>Quantité</b> : un nombre (ex. pas, verres d’eau). <b>Durée</b> : des minutes (ex. lecture).</>}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {KINDS.map(k => (
            <div key={k.key} onClick={() => chooseKind(k.key)}
              style={{ flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: kind === k.key ? 'var(--accent)' : 'var(--card)', color: kind === k.key ? '#000' : 'var(--muted)', border: `1px solid ${kind === k.key ? 'var(--accent)' : 'var(--border)'}` }}>
              {k.label}
            </div>
          ))}
        </div>
      </Field>

      <Field label="Objectif"
        help={<><b>Par jour</b> : à atteindre chaque jour. <b>Par semaine</b> : total à atteindre du lundi au dimanche. Ton score se calcule à partir de ces objectifs.</>}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          {[['day', 'Par jour'], ['week', 'Par semaine']].map(([k, l]) => (
            <div key={k} onClick={() => setPeriod(k)}
              style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: period === k ? 'var(--accent2)' : 'var(--card)', color: period === k ? '#fff' : 'var(--muted)', border: `1px solid ${period === k ? 'var(--accent2)' : 'var(--border)'}` }}>
              {l}
            </div>
          ))}
        </div>

        {kind === 'check' && period === 'week' && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4, 5, 6, 7].map(n => (
              <div key={n} onClick={() => setTarget(String(n))}
                style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', background: Number(target) === n ? 'var(--accent)' : 'var(--card)', color: Number(target) === n ? '#000' : 'var(--muted)', border: `1px solid ${Number(target) === n ? 'var(--accent)' : 'var(--border)'}` }}>
                {n}×
              </div>
            ))}
          </div>
        )}

        {kind === 'count' && (
          <ChipRow style={{ padding: '0 0 10px' }}>
            {UNITS.map(u => <Chip key={u} active={unit === u} color="var(--accent3)" onClick={() => { setUnit(u); setTarget(String((COUNT_PRESETS[u] || COUNT_DEFAULT)[1] ?? 1)) }}>{u}</Chip>)}
          </ChipRow>
        )}

        {kind !== 'check' && (
          <>
            <ChipRow style={{ padding: '0 0 10px' }}>
              {presets.map(v => <Chip key={v} active={Number(target) === v} onClick={() => setTarget(String(v))}>{fmtN(v)}{kind === 'duration' ? ' min' : ''}</Chip>)}
            </ChipRow>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" inputMode="decimal" value={target} onChange={e => setTarget(e.target.value)} aria-label="Objectif" style={{ ...inputStyle, flex: 1 }} />
              {kind === 'count'
                ? <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="unité" aria-label="Unité" style={{ ...inputStyle, flex: 1 }} />
                : <div style={{ fontSize: '14px', color: 'var(--muted)', flex: 1 }}>minutes</div>}
            </div>
          </>
        )}
      </Field>

      <div style={{ margin: '0 16px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '0 14px' }}>
        <ToggleRow
          label={shared ? '👥 Visible par le groupe' : '🔒 Privée'}
          help={<><b>Privée</b> : toi seul(e) vois cette habitude. <b>Groupe</b> : tes amis voient ta progression dessus (classement, fiche joueur, défis).</>}
          on={shared} onChange={setShared} />
      </div>

      {error && <div style={{ margin: '0 16px 12px', color: '#ff6060', fontSize: '13px' }}>{error}</div>}

      <PrimaryButton onClick={submit} disabled={saving}>{saving ? '...' : editing ? 'Enregistrer' : 'Créer l’habitude'}</PrimaryButton>

      {editing && (
        <>
          <GhostButton onClick={() => { onArchive(habit); onClose() }}>
            {habit.archived ? '↩ Réactiver' : '📦 Archiver'}
          </GhostButton>
          <GhostButton danger onClick={() => {
            if (window.confirm('Supprimer définitivement cette habitude et tout son historique ?')) { onDelete(habit); onClose() }
          }}>
            Supprimer
          </GhostButton>
        </>
      )}
    </Sheet>
  )
}
