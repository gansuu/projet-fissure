import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import LeaderboardPage from './pages/LeaderboardPage'
import AddActivityPage from './pages/AddActivityPage'
import ProfilePage from './pages/ProfilePage'
import './styles/globals.css'

function AppShell() {
  const { session, loading } = useAuth()
  const [screen, setScreen] = useState('home')

  if (loading) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'32px', letterSpacing:'4px', color:'var(--accent)' }}>FISSURE</div>
    </div>
  )

  if (!session) return <LoginPage />

  const screens = { home: <HomePage />, lb: <LeaderboardPage />, add: <AddActivityPage />, profile: <ProfilePage /> }

  return (
    <div id="fissure-app" data-theme="dark" style={{
      width:'100%', maxWidth:'430px', height:'100dvh', margin:'0 auto',
      display:'flex', flexDirection:'column', background:'var(--bg)', overflow:'hidden'
    }}>
      {/* Header */}
      <div style={{ padding:'16px 20px 8px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'28px', letterSpacing:'2px', color:'var(--accent)', lineHeight:1 }}>FISSURE</div>
          <div style={{ color:'var(--muted)', fontSize:'14px', fontWeight:300 }}>Projet compétition</div>
        </div>
      </div>

      {/* Screen */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }} className="hide-scroll">
        {screens[screen]}
      </div>

      <BottomNav current={screen} onChange={setScreen} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
