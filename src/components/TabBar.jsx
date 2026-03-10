import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { path: '/', icon: '🏠', label: '홈' },
  { path: '/diary', icon: '📔', label: '다이어리' },
  { path: '/pick', icon: '🎰', label: '뽑기' },
  { path: '/calendar', icon: '📅', label: '캘린더' },
  { path: '/settings', icon: '⚙️', label: '설정' },
]

export default function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="tab-bar">
      {tabs.map(t => (
        <button
          key={t.path}
          className={`tab-item ${location.pathname === t.path ? 'active' : ''}`}
          onClick={() => navigate(t.path)}
        >
          <span className="tab-icon">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}
