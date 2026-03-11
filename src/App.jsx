import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useCouple } from './hooks/useCouple'
import { createContext, useEffect } from 'react'
import { applyTheme, getSavedTheme } from './utils/themes'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Diary from './pages/Diary'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import RandomPick from './pages/RandomPick'
import Promises from './pages/Promises'
import Album from './pages/Album'
import Wishlist from './pages/Wishlist'
import Letters from './pages/Letters'
import DateExpense from './pages/DateExpense'
import TabBar from './components/TabBar'
import CherryBlossoms from './components/CherryBlossoms'

export const AppContext = createContext()

export default function App() {
  useEffect(() => { applyTheme(getSavedTheme()) }, [])
  const { user, loading: authLoading } = useAuth()
  const { couple, coupleId, loading: coupleLoading, generateCode, joinWithCode, loginWithCode, logout, effectiveUid, setMyRole, needsRoleSelection } = useCouple(user)

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

  // Role selection screen
  if (needsRoleSelection && !needsOnboarding) {
    const names = couple?.names || {}
    const userNames = couple?.userNames || {}
    const users = couple?.users || []
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>나는 누구?</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: 32, fontSize: 14 }}>
            이 기기에서 사용할 프로필을 선택해주세요
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {users.map((uid, idx) => {
              const name = userNames[uid]?.myName || names[uid] || `사용자 ${idx + 1}`
              const animal = couple?.animals?.[uid] || ''
              return (
                <button
                  key={uid}
                  onClick={() => setMyRole(idx)}
                  style={{
                    padding: '20px 24px',
                    borderRadius: 16,
                    background: 'white',
                    border: '2px solid var(--pink-light)',
                    fontSize: 18,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {animal} {name}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Override user.uid with effectiveUid for all child components
  const effectiveUser = user ? { ...user, uid: effectiveUid } : user

  return (
    <AppContext.Provider value={{ user: effectiveUser, couple, coupleId, generateCode, joinWithCode, loginWithCode, logout }}>
      <CherryBlossoms />
      <div className="app-container">
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={needsOnboarding ? <Navigate to="/onboarding" /> : <Home />} />
          <Route path="/diary" element={needsOnboarding ? <Navigate to="/onboarding" /> : <Diary />} />
          <Route path="/promises" element={needsOnboarding ? <Navigate to="/onboarding" /> : <Promises />} />
          <Route path="/pick" element={needsOnboarding ? <Navigate to="/onboarding" /> : <RandomPick />} />
          <Route path="/calendar" element={needsOnboarding ? <Navigate to="/onboarding" /> : <Calendar />} />
          <Route path="/album" element={needsOnboarding ? <Navigate to="/onboarding" /> : <Album />} />
          <Route path="/wishlist" element={needsOnboarding ? <Navigate to="/onboarding" /> : <Wishlist />} />
          <Route path="/letters" element={needsOnboarding ? <Navigate to="/onboarding" /> : <Letters />} />
          <Route path="/expense" element={needsOnboarding ? <Navigate to="/onboarding" /> : <DateExpense />} />
          <Route path="/settings" element={needsOnboarding ? <Navigate to="/onboarding" /> : <Settings />} />
        </Routes>
        {!needsOnboarding && <TabBar />}
      </div>
    </AppContext.Provider>
  )
}
