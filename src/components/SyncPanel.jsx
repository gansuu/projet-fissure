import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { getSyncTokens, createSyncToken, deleteSyncToken, insertLogsBulk } from '../lib/queries'
import { findDateLists } from '../lib/importers'
import { Card, Chip, SectionTitle, GhostButton, PrimaryButton, Sheet, labelStyle } from './Ui'

const FUNCTION_URL = 'https://rhnibkbqwcflfnuexmnm.supabase.co/functions/v1/steps-webhook'

async function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const token = 'fis_' + [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  const hash = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
  return { token, hash }
}

const code = { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '12px', background: 'var(--bg3)', borderRadius: '8px', padding: '8px 10px', wordBreak: 'break-all', display: 'block', userSelect: 'all' }

function copy(text) {
  try { navigator.clipboard.writeText(text) } catch { /* copie manuelle possible : le texte est sélectionnable */ }
}

// ─── Pas : Raccourci iOS ─────────────────────────────
function StepsSync() {
  const { session } = useAuth()
  const { habits, saveHabit } = useData()
  const userId = session.user.id
  const candidates = habits.filter(h => !h.archived && h.kind === 'count')
  const [tokens, setTokens] = useState([])
  const [habitId, setHabitId] = useState('')
  const [fresh, setFresh] = useState(null) // { token, habitName }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { getSyncTokens(userId).then(({ data }) => setTokens(data || [])) }, [userId])
  useEffect(() => { if (!habitId && candidates[0]) setHabitId(candidates[0].id) }, [candidates, habitId])

  async function generate() {
    setError('')
    if (!habitId) { setError('Choisis l’habitude qui recevra les pas'); return }
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
      <SectionTitle>PAS AUTOMATIQUES (iPhone)</SectionTitle>
      <Card>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
          Un Raccourci iOS envoie tes pas de la journée vers Fissure. Sur Android, garde la saisie manuelle (rien de gratuit côté serveur).
        </div>

        {candidates.length === 0 ? (
          <div style={{ fontSize: '13px' }}>
            Crée d’abord une habitude de type « ＃ Quantité » (modèle « Pas »), puis reviens ici.
            <GhostButton style={{ width: '100%', margin: '10px 0 0' }} onClick={() => saveHabit({ name: 'Pas', emoji: '👟', kind: 'count', unit: 'pas', target_value: 10000, target_period: 'day', visibility: 'private' })}>
              ＋ Créer l’habitude « Pas » (10 000 / jour)
            </GhostButton>
          </div>
        ) : (
          <>
            <label style={labelStyle}>Habitude qui reçoit les pas</label>
            <div className="hide-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px' }}>
              {candidates.map(h => <Chip key={h.id} active={habitId === h.id} onClick={() => setHabitId(h.id)}>{h.emoji} {h.name}</Chip>)}
            </div>
            <PrimaryButton style={{ width: '100%', margin: 0 }} onClick={generate} disabled={busy}>
              {busy ? '...' : '🔑 Générer un jeton'}
            </PrimaryButton>
          </>
        )}
        {error && <div style={{ color: '#ff6060', fontSize: '13px', marginTop: '10px' }}>{error}</div>}

        {tokens.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <label style={labelStyle}>Jetons actifs</label>
            {tokens.map(t => {
              const h = habits.find(x => x.id === t.habit_id)
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0, fontSize: '13px' }}>
                    {h?.emoji} {h?.name || 'Habitude'} · {t.label}
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {t.last_used_at ? `Dernier envoi : ${new Date(t.last_used_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Jamais utilisé'}
                    </div>
                  </div>
                  <div onClick={() => revoke(t)} style={{ fontSize: '12px', color: '#ff6060', cursor: 'pointer', padding: '4px 8px' }}>Révoquer</div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {fresh && (
        <Sheet title="TON JETON" onClose={() => setFresh(null)}>
          <div style={{ padding: '0 20px', fontSize: '13px' }}>
            <div style={{ color: '#ff6060', marginBottom: '10px' }}>
              Copie-le maintenant : il ne sera plus jamais affiché. Ne le partage à personne.
            </div>
            <code style={code}>{fresh.token}</code>
            <button onClick={() => copy(fresh.token)} style={{ margin: '8px 0 16px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>
              Copier le jeton
            </button>

            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '16px', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: '6px' }}>RACCOURCI iOS (app « Raccourcis »)</div>
            <ol style={{ paddingLeft: '18px', lineHeight: 1.6, color: 'var(--text)' }}>
              <li>Nouveau raccourci, action <b>Rechercher des échantillons de santé</b> : type <b>Pas</b>, date de début <b>aujourd’hui</b>.</li>
              <li>Action <b>Calculer les statistiques</b> : <b>Somme</b> des résultats.</li>
              <li>Action <b>Obtenir le contenu de l’URL</b> :
                <div style={{ margin: '4px 0' }}>URL</div><code style={code}>{FUNCTION_URL}</code>
                <button onClick={() => copy(FUNCTION_URL)} style={{ margin: '4px 0 6px', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px', padding: 0 }}>Copier l’URL</button>
                <div>Méthode <b>POST</b> · En-tête <b>Authorization</b> = <code style={{ ...code, display: 'inline', padding: '2px 6px' }}>Bearer {'<ton jeton>'}</code></div>
                <div>Corps de la requête <b>JSON</b> : champ <b>steps</b> (nombre) = le résultat de la somme.</div>
              </li>
              <li>Onglet <b>Automatisation</b> → Heure du jour (ex. 22 h) → <b>Exécuter le raccourci</b>, sans confirmation.</li>
            </ol>
            <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '8px' }}>
              Habitude cible : {fresh.habitName}. Chaque envoi remplace la valeur du jour (pas de doublon). Au premier essai, compare le total avec l’app Santé : si Apple Watch et iPhone comptent deux fois, dis-le-moi. Le nom exact des actions peut varier selon la version d’iOS.
            </div>
          </div>
        </Sheet>
      )}
    </>
  )
}

// ─── Import Basic-Fit (JSON) ─────────────────────────
function BasicFitImport() {
  const { session } = useAuth()
  const { habits, logs, startDate, reload } = useData()
  const userId = session.user.id
  const checkHabits = habits.filter(h => !h.archived && h.kind === 'check')
  const [lists, setLists] = useState(null)
  const [fileName, setFileName] = useState('')
  const [pick, setPick] = useState(0)
  const [habitId, setHabitId] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { if (!habitId && checkHabits[0]) setHabitId(checkHabits[0].id) }, [checkHabits, habitId])

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(''); setMsg(''); setLists(null)
    try {
      const json = JSON.parse(await file.text())
      const found = findDateLists(json)
      if (!found.length) { setError('Aucune liste de dates reconnue dans ce fichier. Envoie-moi un extrait (sans infos perso) et j’adapterai l’import.'); return }
      setFileName(file.name); setPick(0); setLists(found)
    } catch {
      setError('Ce fichier n’est pas un JSON valide.')
    }
  }

  const plan = useMemo(() => {
    if (!lists || !lists[pick]) return null
    const all = lists[pick].dates
    const recent = all.filter(d => d >= startDate)
    const existing = new Set(logs.filter(l => l.habit_id === habitId).map(l => l.date))
    const toAdd = recent.filter(d => !existing.has(d))
    return { all: all.length, old: all.length - recent.length, dup: recent.length - toAdd.length, toAdd }
  }, [lists, pick, habitId, logs, startDate])

  async function run() {
    if (!plan || !plan.toAdd.length || !habitId) return
    setBusy(true); setError('')
    const { error } = await insertLogsBulk(plan.toAdd.map(date => ({ user_id: userId, habit_id: habitId, date, value: 1, note: 'import Basic-Fit' })))
    setBusy(false)
    if (error) { setError('L’import a échoué (rien n’est garanti importé, vérifie ton historique).'); reload(); return }
    setMsg(`${plan.toAdd.length} séance${plan.toAdd.length > 1 ? 's' : ''} importée${plan.toAdd.length > 1 ? 's' : ''} ✓`)
    setLists(null)
    reload()
  }

  return (
    <>
      <SectionTitle>IMPORT BASIC-FIT</SectionTitle>
      <Card>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
          Dans l’app My Basic-Fit, télécharge tes données (menu « Mes informations »), puis choisis le fichier JSON ici. Rien n’est importé avant ta validation.
        </div>

        {checkHabits.length === 0 ? (
          <div style={{ fontSize: '13px' }}>Crée d’abord une habitude « ✓ Fait / pas fait » (modèle « Muscu ») pour recevoir tes séances.</div>
        ) : (
          <>
            <label style={labelStyle}>Habitude qui reçoit les séances</label>
            <div className="hide-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px' }}>
              {checkHabits.map(h => <Chip key={h.id} active={habitId === h.id} onClick={() => setHabitId(h.id)}>{h.emoji} {h.name}</Chip>)}
            </div>
            <label style={{ display: 'block', textAlign: 'center', background: 'var(--bg3)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '14px', cursor: 'pointer', fontSize: '14px' }}>
              📂 Choisir le fichier JSON
              <input type="file" accept=".json,application/json" onChange={onFile} style={{ display: 'none' }} />
            </label>
          </>
        )}

        {error && <div style={{ color: '#ff6060', fontSize: '13px', marginTop: '10px' }}>{error}</div>}
        {msg && <div style={{ color: 'var(--accent)', fontSize: '13px', marginTop: '10px', fontWeight: 600 }}>{msg}</div>}

        {lists && plan && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>{fileName} : choisis la liste qui correspond à tes visites</div>
            {lists.slice(0, 6).map((l, i) => (
              <div key={l.path} onClick={() => setPick(i)}
                style={{ padding: '8px 10px', borderRadius: '10px', marginBottom: '6px', cursor: 'pointer', fontSize: '12px', border: `1px solid ${pick === i ? 'var(--accent)' : 'var(--border)'}`, background: pick === i ? 'rgba(232,255,71,.06)' : 'transparent' }}>
                <b>{l.path}</b> · {l.dates.length} jour{l.dates.length > 1 ? 's' : ''} ({l.dates[0]} → {l.dates[l.dates.length - 1]})
              </div>
            ))}
            <div style={{ fontSize: '13px', margin: '10px 0', lineHeight: 1.6 }}>
              <b style={{ color: 'var(--accent)' }}>{plan.toAdd.length}</b> à importer
              {plan.old > 0 && <> · {plan.old} avant le lancement du projet ({startDate}) ignorées</>}
              {plan.dup > 0 && <> · {plan.dup} déjà présentes ignorées</>}
            </div>
            <PrimaryButton style={{ width: '100%', margin: 0 }} onClick={run} disabled={busy || !plan.toAdd.length}>
              {busy ? '...' : `Importer ${plan.toAdd.length} séance${plan.toAdd.length > 1 ? 's' : ''}`}
            </PrimaryButton>
          </div>
        )}
      </Card>
    </>
  )
}

export default function SyncPanel() {
  return (
    <>
      <StepsSync />
      <BasicFitImport />
    </>
  )
}
