import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { signOut } from '../lib/queries'
import { todayKey } from '../lib/dates'
import { prepareHabits, periodScore, activityStreak, pct } from '../lib/scoring'
import { AVATAR_CHOICES } from '../lib/templates'
import { SectionTitle, Card, ToggleRow, GhostButton, Collapsible, ChipRow } from '../components/Ui'
import { StepsSync, BasicFitImport } from '../components/SyncPanel'
import ReminderCard from '../components/ReminderCard'

export default function ProfilePage() {
  const { profile, theme, setTheme, saveProfile } = useAuth()
  const { habits, logs, idx, config } = useData()
  const today = todayKey()
  const year = today.slice(0, 4)

  const prepared = useMemo(() => prepareHabits(habits, idx), [habits, idx])
  const yearScore = periodScore(prepared, idx, `${year}-01-01`, `${year}-12-31`, today)
  const streak = activityStreak(logs, today)
  const activeDays = new Set(logs.filter(l => Number(l.value) > 0).map(l => l.date)).size
  const isDark = theme !== 'light'
  const sharedDefault = profile?.default_visibility === 'group'

  function exportCsv() {
    const byId = Object.fromEntries(habits.map(h => [h.id, h]))
    const lines = ['date;habitude;valeur;note']
    for (const l of logs) lines.push([l.date, `"${(byId[l.habit_id]?.name || '').replace(/"/g, '""')}"`, l.value, `"${(l.note || '').replace(/"/g, '""')}"`].join(';'))
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `fissure-${today}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <div style={{ margin: '8px 16px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '22px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(232,255,71,.04) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', border: '3px solid var(--accent)', background: 'rgba(232,255,71,.1)' }}>
          {profile?.emoji || '💪'}
        </div>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '28px', letterSpacing: '1px' }}>{profile?.username?.toUpperCase()}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 16px 12px' }}>
        {[
          { val: pct(yearScore), lbl: `Score ${year}` },
          { val: `${streak}j`, lbl: 'Série en cours' },
          { val: activeDays, lbl: 'Jours actifs' },
          { val: habits.filter(h => !h.archived).length, lbl: 'Habitudes' },
        ].map(s => (
          <div key={s.lbl} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius, 16px)', padding: '14px' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '28px', color: 'var(--accent)' }}>{s.val}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      <ChipRow style={{ paddingBottom: '12px' }}>
        {AVATAR_CHOICES.map(e => (
          <div key={e} onClick={() => saveProfile({ emoji: e })}
            style={{ width: '46px', height: '46px', borderRadius: '50%', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', background: profile?.emoji === e ? 'rgba(232,255,71,.15)' : 'var(--card)', border: `2px solid ${profile?.emoji === e ? 'var(--accent)' : 'var(--border)'}` }}>
            {e}
          </div>
        ))}
      </ChipRow>

      <Card style={{ padding: '2px 14px' }}>
        <ToggleRow label={isDark ? '🌙 Thème sombre' : '☀️ Thème clair'} on={isDark} onChange={on => setTheme(on ? 'dark' : 'light')}
          style={{ borderBottom: '1px solid var(--border)' }} />
        <ToggleRow label={sharedDefault ? '👥 Nouvelles habitudes : groupe' : '🔒 Nouvelles habitudes : privées'}
          help={<>Réglage par défaut quand tu crées une habitude. Tu peux le changer habitude par habitude.</>}
          on={sharedDefault} onChange={on => saveProfile({ default_visibility: on ? 'group' : 'private' })} />
      </Card>

      <SectionTitle>CONNEXIONS</SectionTitle>
      <Collapsible icon="🏋️" title="Importer Basic-Fit"
        help={<>Ajoute d’un coup tes anciennes séances à partir du fichier de données que Basic-Fit te fournit.</>}>
        <BasicFitImport />
      </Collapsible>
      <Collapsible icon="👟" title="Pas automatiques (iPhone)"
        help={<>Envoie tes pas chaque soir grâce à un Raccourci iOS. Non disponible sur Android.</>}>
        <StepsSync />
      </Collapsible>
      <Collapsible icon="⏰" title="Rappel quotidien"
        help={<>Un rappel dans ton agenda, tous les jours, pour cocher tes habitudes.</>}>
        <ReminderCard />
      </Collapsible>

      {config.invite_code && (
        <Card style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', letterSpacing: '.8px', textTransform: 'uppercase' }}>Code d’invitation</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '24px', letterSpacing: '2px', color: 'var(--accent)' }}>{config.invite_code}</div>
          </div>
          <button onClick={() => { try { navigator.clipboard.writeText(config.invite_code) } catch { /* sélection manuelle */ } }}
            style={{ background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
            Copier
          </button>
        </Card>
      )}

      <GhostButton onClick={exportCsv}>⬇ Exporter mes données (CSV)</GhostButton>
      <GhostButton onClick={signOut} style={{ marginBottom: '24px' }}>Se déconnecter</GhostButton>
    </div>
  )
}
