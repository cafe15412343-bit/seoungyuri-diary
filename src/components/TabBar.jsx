import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const mainTabs = [
  { path: '/', icon: '🏠', label: '홈' },
  { path: '/diary', icon: '📖', label: '기록' },
  { path: '/promises', icon: '📋', label: '약속' },
  { path: '/expense', icon: '💰', label: '가계부' },
]

const moreTabs = [
  { path: '/wishlist', icon: '🎯', label: '위시리스트' },
  { path: '/letters', icon: '💌', label: '편지함' },
  { path: '/pick', icon: '🎰', label: '뽑기' },
  { path: '/calendar', icon: '📅', label: '캘린더' },
  { path: '/settings', icon: '⚙️', label: '설정' },
  { path: '/changelog', icon: '📋', label: '업데이트' },
]

export default function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showMore, setShowMore] = useState(false)

  const isMoreActive = moreTabs.some(t => t.path === location.pathname)

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          style={{
            position: 'fixed', bottom: 70, left: 0, right: 0,
            padding: '8px 16px',
            zIndex: 1000,
            display: 'flex', justifyContent: 'center',
          }}
          onClick={() => setShowMore(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '12px 8px',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
              display: 'flex',
              gap: 4,
              maxWidth: 400,
              width: '100%',
              justifyContent: 'space-around',
            }}
            onClick={e => e.stopPropagation()}
          >
            {moreTabs.map(t => (
              <button
                key={t.path}
                className={`tab-item ${location.pathname === t.path ? 'active' : ''}`}
                onClick={() => { navigate(t.path); setShowMore(false) }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 2, padding: '8px 10px', borderRadius: 12, fontSize: 11,
                  background: location.pathname === t.path ? 'var(--pink-bg)' : 'transparent',
                  color: location.pathname === t.path ? 'var(--pink)' : 'var(--text-light)',
                  fontWeight: location.pathname === t.path ? 600 : 400,
                  border: 'none', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 22 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showMore && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.3)', zIndex: 999,
          }}
          onClick={() => setShowMore(false)}
        />
      )}

      {/* Main Tab Bar */}
      <nav className="tab-bar">
        {mainTabs.map(t => (
          <button
            key={t.path}
            className={`tab-item ${location.pathname === t.path ? 'active' : ''}`}
            onClick={() => { navigate(t.path); setShowMore(false) }}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
        <button
          className={`tab-item ${isMoreActive ? 'active' : ''}`}
          onClick={() => setShowMore(!showMore)}
        >
          <span className="tab-icon">{showMore ? '✕' : '•••'}</span>
          더보기
        </button>
      </nav>
    </>
  )
}
