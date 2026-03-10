import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useCouple } from './hooks/useCouple'
import { createContext } from 'react'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Diary from './pages/Diary'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import TabBar from './components/TabBar'

export const AppContext = createContext()

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const { couple, coupleId, loading: coupleLoading, generateCode, joinWithCode } = useCouple(user)

  if (authLoading || coupleLoading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💕</div>
          <div style={{ color: 'var(--text-light)' }}>로딩 중...</div>
        </div>
      </div>
    )
  }

  const needsOnboarding = !couple || couple.users.length < 2

  return (
    <AppContext.Provider value={{ user, couple, coupleId, generateCode, joinWithCode }}>
      <div className="app-container">
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={needsOnboarding ? <Navigate to="/onboarding" /> : <Home />} />
          <Route path="/diary" element={needsOnboarding ? <Navigate to="/onboarding" /> : <Diary />} />
          <Route path="/calendar" element={needsOnboarding ? <Navigate to="/onboarding" /> : <Calendar />} />
          <Route path="/settings" element={needsOnboarding ? <Navigate to="/onboarding" /> : <Settings />} />
        </Routes>
        {!needsOnboarding && <TabBar />}
      </div>
    </AppContext.Provider>
  )
}
