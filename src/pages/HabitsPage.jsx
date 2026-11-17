import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { targetLabel } from '../lib/scoring'
import { SectionTitle, PrimaryButton, ErrorBanner, Heading } from '../components/Ui'
import HabitForm from '../components/HabitForm'

function Row({ h, onEdit, onToggleVisibility }) {
  const shared = h.visibility === 'group'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)', opacity: h.archived ? .55 : 1 }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', background: 'var(--bg3)', flexShrink: 0 }}>
        {h.emoji || '🎯'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '1px' }}>{targetLabel(h)}</div>
      </div>
      <div onClick={() => onToggleVisibility(h)}
        style={{ fontSize: '11px', fontWeight: '600', padding: '6px 10px', borderRadius: '20px', cursor: 'pointer', flexShrink: 0,
          background: shared ? 'rgba(71,196,255,.12)' : 'var(--bg3)', color: shared ? 'var(--accent3)' : 'var(--muted)',
          border: `1px solid ${shared ? 'rgba(71,196,255,.35)' : 'var(--border)'}` }}>
        {shared ? '👥 Groupe' : '🔒 Privée'}
      </div>
      <div onClick={() => onEdit(h)} style={{ fontSize: '18px', color: 'var(--muted)', cursor: 'pointer', padding: '4px' }}>⚙︎</div>
    </div>
  )
}

export default function HabitsPage() {
  const { profile } = useAuth()
  const { habits, loading, error, setError, saveHabit, removeHabit } = useData()
  const [form, setForm] = useState(null) // null | { habit } | { habit: null }
  const [showArchived, setShowArchived] = useState(false)

  const active = habits.filter(h => !h.archived)
  const archived = habits.filter(h => h.archived)

  return (
    <div>
      <Heading help={<>Touche <b>👥 Groupe</b> / <b>🔒 Privée</b> pour choisir qui voit une habitude. Touche <b>⚙︎</b> pour la modifier, l’archiver (l’historique reste) ou la supprimer.</>}>MES HABITUDES</Heading>

      <ErrorBanner message={error} onClose={() => setError('')} />
      <PrimaryButton onClick={() => setForm({ habit: null })}>＋ Nouvelle habitude</PrimaryButton>

      <SectionTitle>ACTIVES ({active.length})</SectionTitle>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius, 16px)', padding: '0 16px', margin: '0 16px 12px' }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>Chargement...</div>}
        {!loading && active.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '18px 0' }}>Aucune habitude</div>
        )}
        {active.map(h => (
          <Row key={h.id} h={h} onEdit={h => setForm({ habit: h })}
            onToggleVisibility={h => saveHabit({ id: h.id, visibility: h.visibility === 'group' ? 'private' : 'group' })} />
        ))}
      </div>

      {archived.length > 0 && (
        <>
          <SectionTitle right={
            <div onClick={() => setShowArchived(s => !s)} style={{ fontSize: '12px', color: 'var(--accent)', cursor: 'pointer' }}>
              {showArchived ? 'Masquer' : 'Afficher'}
            </div>
          }>ARCHIVÉES ({archived.length})</SectionTitle>
          {showArchived && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius, 16px)', padding: '0 16px', margin: '0 16px 12px' }}>
              {archived.map(h => (
                <Row key={h.id} h={h} onEdit={h => setForm({ habit: h })}
                  onToggleVisibility={h => saveHabit({ id: h.id, visibility: h.visibility === 'group' ? 'private' : 'group' })} />
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ height: '12px' }} />

      {form && (
        <HabitForm
          habit={form.habit}
          defaultVisibility={profile?.default_visibility || 'private'}
          onSave={saveHabit}
          onClose={() => setForm(null)}
          onArchive={h => saveHabit({ id: h.id, archived: !h.archived })}
          onDelete={h => removeHabit(h.id)}
        />
      )}
    </div>
  )
}
