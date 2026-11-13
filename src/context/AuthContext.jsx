import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile, updateProfile } from '../lib/queries'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setThemeState] = useState('dark')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Le thème suit le profil et s'applique à toute la page
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  async function fetchProfile(userId) {
    const cacheKey = `fissure:profile:${userId}`
    let { data } = await getProfile(userId)
    try {
      if (data) localStorage.setItem(cacheKey, JSON.stringify(data))
      else data = JSON.parse(localStorage.getItem(cacheKey)) // hors-ligne : dernier profil connu
    } catch { /* stockage indisponible */ }
    setProfile(data)
    if (data?.theme === 'light' || data?.theme === 'dark') setThemeState(data.theme)
    setLoading(false)
  }

  async function setTheme(t) {
    setThemeState(t)
    if (session) await updateProfile(session.user.id, { theme: t })
  }

  async function saveProfile(updates) {
    if (!session) return
    setProfile(p => ({ ...p, ...updates }))
    await updateProfile(session.user.id, updates)
  }

  return (
    <AuthContext.Provider value={{
      session, profile, loading, theme, setTheme, saveProfile,
      refreshProfile: () => fetchProfile(session?.user?.id),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
