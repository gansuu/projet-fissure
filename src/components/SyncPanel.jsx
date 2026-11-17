import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { getSyncTokens, createSyncToken, deleteSyncToken, insertLogsBulk } from '../lib/queries'
import { readImportFile } from '../lib/importers'
import { Chip, ChipRow, Field, GhostButton, PrimaryButton, Sheet } from './Ui'

const FUNCTION_URL = 'https://rhnibkbqwcflfnuexmnm.supabase.co/functions/v1/steps-webhook'

async function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const token = 'fis_' + [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  const hash = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
  return { token, hash }
}

const code = { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '12px', background: 'var(--bg3)', borderRadius: '8px', padding: '8px 10px', wordBreak: 'break-all', display: 'block', userSelect: 'all' }
const linkBtn = { background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px', padding: 0, fontFamily: 'DM Sans, sans-serif' }

function copy(text) {
  try { navigator.clipboard.writeText(text) } catch { /* le texte reste sélectionnable */ }
}

// ─── Pas automatiques (Raccourci iOS) ────────────────
export function StepsSync() {
  const { session } = useAuth()
  const { habits, saveHabit } = useData()
  const userId = session.user.id
  const candidates = habits.filter(h => !h.archived && h.kind === 'count')
  const [tokens, setTokens] = useState([])
  const [habitId, setHabitId] = useState('')
  const [fresh, setFresh] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { getSyncTokens(userId).then(({ data }) => setTokens(data || [])) }, [userId])
  useEffect(() => { if (!habitId && candidates[0]) setHabitId(candidates[0].id) }, [candidates, habitId])

  async function generate() {
    setError('')
    if (!habitId) return
    setBusy(true)
    const { token, hash } = await makeToken()
    const habit = habits.find(h => h.id === habitId)
    const { data, error } = await createSyncToken(userId, habitId, hash, 'Raccourci iOS')
    setBusy(false)
    if (error) { setError('Impossible de créer le jeton, réessaie.'); return }
    setTokens(t => [data, ...t])
    setFresh({ token, habitName: habit?.name || '' })
  }

  async function revoke(t) {
    if (!window.confirm('Révoquer ce jeton ? Le Raccourci iOS ne fonctionnera plus.')) return
    const { error } = await deleteSyncToken(t.id)
    if (!error) setTokens(prev => prev.filter(x => x.id !== t.id))
  }

  return (
    <>
      <Field label="Envoyer mes pas depuis l’iPhone"
        help={<>Un Raccourci iOS envoie tes pas de la journée vers Fissure, chaque soir. Tu génères un jeton, puis tu suis les étapes affichées. Sur Android, saisis tes pas à la main.</>}>
        {candidates.length === 0 ? (
          <GhostButton style={{ width: '100%', margin: 0 }}
            onClick={() => saveHabit({ name: 'Pas', emoji: '👟', kind: 'count', unit: 'pas', target_value: 10000, target_period: 'day', visibility: 'private' })}>
            ＋ Créer l’habitude « Pas »
          </GhostButton>
        ) : (
          <>
            {candidates.length > 1 && (
              <ChipRow style={{ padding: '0 0 10px' }}>
                {candidates.map(h => <Chip key={h.id} active={habitId === h.id} onClick={() => setHabitId(h.id)}>{h.emoji} {h.name}</Chip>)}
              </ChipRow>
            )}
            <PrimaryButton style={{ width: '100%', margin: 0 }} onClick={generate} disabled={busy}>
              {busy ? '...' : '🔑 Générer mon jeton'}
            </PrimaryButton>
          </>
        )}
        {error && <div style={{ color: '#ff6060', fontSize: '13px', marginTop: '10px' }}>{error}</div>}
      </Field>

      {tokens.length > 0 && (
        <Field label="Jetons actifs">
          {tokens.map(t => {
            const h = habits.find(x => x.id === t.habit_id)
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: '13px' }}>
                  {h?.emoji} {h?.name || 'Habitude'}
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {t.last_used_at ? `Dernier envoi : ${new Date(t.last_used_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Jamais utilisé'}
                  </div>
                </div>
                <div onClick={() => revoke(t)} style={{ fontSize: '12px', color: '#ff6060', cursor: 'pointer', padding: '4px 8px' }}>Révoquer</div>
              </div>
            )
          })}
        </Field>
      )}

      {fresh && (
        <Sheet title="TON JETON" onClose={() => setFresh(null)}>
          <div style={{ padding: '0 20px', fontSize: '13px' }}>
            <div style={{ color: '#ff6060', marginBottom: '10px' }}>Copie-le maintenant : il ne sera plus affiché. Ne le partage pas.</div>
            <code style={code}>{fresh.token}</code>
            <button onClick={() => copy(fresh.token)} style={{ margin: '8px 0 16px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>
              Copier le jeton
            </button>

            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '16px', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: '6px' }}>DANS L’APP « RACCOURCIS »</div>
            <ol style={{ paddingLeft: '18px', lineHeight: 1.6 }}>
              <li><b>Rechercher des échantillons de santé</b> : type <b>Pas</b>, début <b>aujourd’hui</b>.</li>
              <li><b>Calculer les statistiques</b> : <b>Somme</b>.</li>
              <li><b>Obtenir le contenu de l’URL</b> : méthode <b>POST</b>.
                <code style={{ ...code, margin: '4px 0' }}>{FUNCTION_URL}</code>
                <button onClick={() => copy(FUNCTION_URL)} style={linkBtn}>Copier l’URL</button>
                <div style={{ marginTop: '4px' }}>En-tête <b>Authorization</b> : <code style={{ ...code, display: 'inline', padding: '2px 6px' }}>Bearer {'<jeton>'}</code></div>
                <div>Corps <b>JSON</b> : <b>steps</b> = la somme.</div>
              </li>
              <li><b>Automatisation</b> → heure du jour (ex. 22 h) → exécuter le raccourci sans confirmation.</li>
            </ol>
            <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '8px' }}>
              Les pas arrivent dans « {fresh.habitName} ». Chaque envoi remplace la valeur du jour. Au premier essai, compare avec l’app Santé.
            </div>
          </div>
        </Sheet>
      )}
    </>
  )
}

// ─── Import Basic-Fit : un bouton, un fichier ────────
export function BasicFitImport() {
  const { session } = useAuth()
  const { habits, logs, startDate, reload, saveHabit } = useData()
  const userId = session.user.id
  const checkHabits = habits.filter(h => !h.archived && h.kind === 'check')
  const [habitId, setHabitId] = useState('')
  const target = habitId || checkHabits[0]?.id || '__new__'
  const [lists, setLists] = useState(null)
  const [pick, setPick] = useState(0)
  const [showLists, setShowLists] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(''); setMsg(''); setLists(null); setShowLists(false)
    try {
      const found = await readImportFile(file)
      if (!found.length) { setError('Je ne trouve aucune date dans ce fichier. Vérifie que c’est bien l’export de tes visites.'); return }
      setPick(0); setLists(found)
    } catch (err) {
      setError(err.message || 'Fichier illisible.')
    }
  }

  const plan = useMemo(() => {
    if (!lists || !lists[pick]) return null
    const all = lists[pick].dates
    const recent = all.filter(d => d >= startDate)
    const existing = new Set(logs.filter(l => l.habit_id === target).map(l => l.date))
    const toAdd = recent.filter(d => !existing.has(d))
    return { old: all.length - recent.length, dup: recent.length - toAdd.length, toAdd }
  }, [lists, pick, target, logs, startDate])

  async function run() {
    if (!plan || !plan.toAdd.length) return
    setBusy(true); setError('')
    let id = target
    if (id === '__new__') {
      const created = await saveHabit({ name: 'Muscu', emoji: '💪', kind: 'check', unit: null, target_value: 4, target_period: 'week', visibility: 'private' })
      if (!created) { setBusy(false); setError('Impossible de créer l’habitude « Muscu ».'); return }
      id = created.id
    }
    const { error } = await insertLogsBulk(plan.toAdd.map(date => ({ user_id: userId, habit_id: id, date, value: 1, note: 'import Basic-Fit' })))
    setBusy(false)
    if (error) { setError('L’import a échoué. Vérifie ton historique avant de réessayer.'); reload(); return }
    const n = plan.toAdd.length
    setMsg(`${n} séance${n > 1 ? 's' : ''} importée${n > 1 ? 's' : ''} ✓`)
    setLists(null)
    reload()
  }

  const n = plan?.toAdd.length || 0

  return (
    <Field label="Mes séances Basic-Fit"
      help={<>
        <b>1.</b> Dans l’appli ou le site <b>My Basic-Fit</b>, demande ou télécharge tes données personnelles (menu « Mes informations »).<br />
        <b>2.</b> Tu reçois un fichier (<b>.json</b>, parfois dans un <b>.zip</b>).<br />
        <b>3.</b> Touche « Choisir mon fichier » ci-dessous et sélectionne-le.<br />
        <span style={{ color: 'var(--muted)' }}>Les noms de menus peuvent changer. Pas de fichier ? Ajoute tes séances à la main depuis « Aujourd’hui ».</span>
      </>}>
      {checkHabits.length > 1 && (
        <ChipRow style={{ padding: '0 0 10px' }}>
          {checkHabits.map(h => <Chip key={h.id} active={target === h.id} onClick={() => setHabitId(h.id)}>{h.emoji} {h.name}</Chip>)}
        </ChipRow>
      )}
      <label style={{ display: 'block', textAlign: 'center', background: 'var(--accent)', color: '#000', borderRadius: '14px', padding: '14px', cursor: 'pointer', fontSize: '15px', fontWeight: 700 }}>
        📂 Choisir mon fichier
        <input type="file" onChange={onFile} style={{ display: 'none' }} />
      </label>

      {error && <div style={{ color: '#ff6060', fontSize: '13px', marginTop: '10px' }}>{error}</div>}
      {msg && <div style={{ color: 'var(--accent)', fontSize: '14px', marginTop: '10px', fontWeight: 600 }}>{msg}</div>}

      {lists && plan && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>
            <b style={{ color: 'var(--accent)', fontSize: '20px' }}>{n}</b> séance{n > 1 ? 's' : ''} à importer
            {target === '__new__' && <span style={{ color: 'var(--muted)' }}> · dans une nouvelle habitude « Muscu »</span>}
          </div>
          {(plan.old > 0 || plan.dup > 0) && (
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>
              {plan.old > 0 && `${plan.old} avant le lancement du projet ignorée${plan.old > 1 ? 's' : ''}`}
              {plan.old > 0 && plan.dup > 0 && ' · '}
              {plan.dup > 0 && `${plan.dup} déjà présente${plan.dup > 1 ? 's' : ''}`}
            </div>
          )}
          <PrimaryButton style={{ width: '100%', margin: 0 }} onClick={run} disabled={busy || !n}>
            {busy ? '...' : `Importer ${n} séance${n > 1 ? 's' : ''}`}
          </PrimaryButton>
          {lists.length > 1 && (
            <div style={{ marginTop: '10px' }}>
              <button onClick={() => setShowLists(s => !s)} style={linkBtn}>Ce n’est pas ça ? Changer de liste</button>
              {showLists && lists.slice(0, 6).map((l, i) => (
                <div key={l.path} onClick={() => setPick(i)}
                  style={{ padding: '8px 10px', borderRadius: '10px', margin: '6px 0 0', cursor: 'pointer', fontSize: '12px', border: `1px solid ${pick === i ? 'var(--accent)' : 'var(--border)'}` }}>
                  <b>{l.path}</b> · {l.dates.length} jour{l.dates.length > 1 ? 's' : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Field>
  )
}
