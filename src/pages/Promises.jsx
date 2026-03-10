import { useState, useContext, useEffect } from 'react'
import { AppContext } from '../App'
import { usePromises, CATEGORIES } from '../hooks/usePromises'
import HeartAnimation from '../components/HeartAnimation'

export default function Promises() {
  const { user, couple } = useContext(AppContext)
  const {
    promises, checks, loading, today, partnerUid,
    addPromise, deletePromise, toggleCheck, getStreak,
    getWeeklyReport, getPartnerRecentChecks,
  } = usePromises()

  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('etc')
  const [heartTrigger, setHeartTrigger] = useState(0)
  const [celebMsg, setCelebMsg] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const myName = couple?.names?.[user.uid] || '나'
  const partnerName = couple?.names?.[partnerUid] || '자기'
  const myAnimal = couple?.animals?.[user.uid] || ''
  const partnerAnimal = couple?.animals?.[partnerUid] || ''

  const weeklyReport = getWeeklyReport()
  const partnerRecentChecks = getPartnerRecentChecks()

  // Check if all promises are completed by both
  useEffect(() => {
    if (promises.length === 0 || !partnerUid) return
    const allDone = promises.every(p => {
      const c = checks[p.id]
      return c?.[user.uid] && c?.[partnerUid]
    })
    if (allDone && promises.length > 0) {
      setCelebMsg('오늘도 약속 완료! 💕🎉')
      setTimeout(() => setCelebMsg(null), 4000)
    }
  }, [checks, promises, partnerUid, user.uid])

  const handleToggle = async (promiseId) => {
    const wasChecked = !!checks[promiseId]?.[user.uid]
    await toggleCheck(promiseId)
    if (!wasChecked) {
      // Just checked - show hearts
      setHeartTrigger(t => t + 1)
    }
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    await addPromise(newName, newCategory)
    setNewName('')
    setNewCategory('etc')
    setShowAdd(false)
  }

  const handleDelete = async (id) => {
    if (confirm('이 약속을 삭제할까요?')) {
      await deletePromise(id)
    }
  }

  const getCategoryInfo = (catId) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[3]

  if (loading) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32 }}>📋</div>
        <div style={{ color: 'var(--text-light)', marginTop: 8 }}>로딩 중...</div>
      </div>
    )
  }

  // Group by category
  const grouped = {}
  CATEGORIES.forEach(c => { grouped[c.id] = [] })
  promises.forEach(p => {
    const cat = p.category || 'etc'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(p)
  })

  return (
    <div className="fade-in">
      <HeartAnimation trigger={heartTrigger} />

      <div className="page-header">📋 커플 약속</div>

      <div style={{ padding: '0 20px' }}>
        {/* Celebration message */}
        {celebMsg && (
          <div className="fade-in" style={{
            textAlign: 'center',
            padding: '16px',
            background: 'linear-gradient(135deg, #fce4ec, #f3e5f5)',
            borderRadius: 20,
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--pink)',
            marginBottom: 16,
            animation: 'fadeIn 0.5s ease',
          }}>
            {celebMsg}
          </div>
        )}

        {/* Partner notifications */}
        {partnerRecentChecks.length > 0 && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
            border: '1px solid #c8e6c9',
          }}>
            {partnerRecentChecks.map(p => (
              <div key={p.id} style={{ fontSize: 14, padding: '4px 0', color: '#2e7d32' }}>
                {partnerAnimal} {partnerName}이(가) <b>{p.name}</b> 했대! 💕
              </div>
            ))}
          </div>
        )}

        {/* Weekly report */}
        {weeklyReport && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, var(--pink), var(--coral))',
            color: 'white',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>이번 주 달성률</div>
            <div style={{ fontSize: 36, fontWeight: 700 }}>{weeklyReport.rate}%</div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
              {weeklyReport.rate >= 80 ? '대단해! 💕' :
               weeklyReport.rate >= 50 ? '조금만 더 힘내자! 💪' :
               '이번 주도 파이팅! 🌟'}
            </div>
            {/* Progress bar */}
            <div style={{
              marginTop: 12,
              height: 8,
              background: 'rgba(255,255,255,0.3)',
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${weeklyReport.rate}%`,
                height: '100%',
                background: 'white',
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}

        {/* Promise list by category */}
        {CATEGORIES.map(cat => {
          const items = grouped[cat.id]
          if (!items || items.length === 0) return null
          return (
            <div key={cat.id} style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-light)',
                padding: '8px 4px 4px',
              }}>
                {cat.icon} {cat.label}
              </div>
              {items.map(p => {
                const myCheck = !!checks[p.id]?.[user.uid]
                const partnerCheck = !!checks[p.id]?.[partnerUid]
                const streak = getStreak(p.id)
                const bothDone = myCheck && partnerCheck

                return (
                  <div
                    key={p.id}
                    className="card"
                    style={{
                      padding: '14px 16px',
                      marginBottom: 10,
                      background: bothDone
                        ? 'linear-gradient(135deg, #fff0f3, #fce4ec)'
                        : 'white',
                      border: bothDone ? '1px solid var(--pink-light)' : 'none',
                      transition: 'all 0.3s',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      {/* Promise name + streak */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: 15,
                          color: bothDone ? 'var(--pink)' : 'var(--text)',
                        }}>
                          {p.name}
                          {streak > 0 && (
                            <span style={{
                              marginLeft: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#ff6d00',
                            }}>
                              🔥 {streak}일
                            </span>
                          )}
                        </div>
                        {/* Status text */}
                        <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                          {myAnimal || '나'} {myCheck ? '✅' : '❌'} / {partnerAnimal || partnerName} {partnerCheck ? '✅' : '❌'}
                        </div>
                      </div>

                      {/* Check toggle + delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => handleToggle(p.id)}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: myCheck
                              ? 'linear-gradient(135deg, var(--pink), var(--coral))'
                              : 'var(--pink-bg)',
                            fontSize: 22,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s',
                            transform: myCheck ? 'scale(1)' : 'scale(0.9)',
                            boxShadow: myCheck ? 'var(--shadow)' : 'none',
                          }}
                        >
                          {myCheck ? '💗' : '🤍'}
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'none',
                            fontSize: 14,
                            color: 'var(--text-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Empty state */}
        {promises.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>아직 약속이 없어요</div>
            <div style={{ fontSize: 14, color: 'var(--text-light)' }}>
              함께 지킬 약속을 추가해보세요! 💕
            </div>
          </div>
        )}

        {/* Add button */}
        {!showAdd ? (
          <button
            className="btn-primary"
            onClick={() => setShowAdd(true)}
            style={{ marginTop: 8, marginBottom: 20 }}
          >
            ➕ 약속 추가하기
          </button>
        ) : (
          <div className="card fade-in" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>새 약속 만들기 💕</div>
            <input
              className="input-field"
              placeholder="약속 이름 (예: 영양제 먹기)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <div style={{
              display: 'flex',
              gap: 8,
              marginTop: 12,
              flexWrap: 'wrap',
            }}>
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setNewCategory(c.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 500,
                    background: newCategory === c.id
                      ? 'linear-gradient(135deg, var(--pink), var(--coral))'
                      : 'var(--pink-bg)',
                    color: newCategory === c.id ? 'white' : 'var(--text)',
                    transition: 'all 0.2s',
                  }}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="btn-secondary"
                onClick={() => { setShowAdd(false); setNewName(''); setNewCategory('etc') }}
                style={{ flex: 1 }}
              >
                취소
              </button>
              <button
                className="btn-primary"
                onClick={handleAdd}
                style={{ flex: 1 }}
              >
                추가 💕
              </button>
            </div>
          </div>
        )}

        {/* Today's date */}
        <div style={{
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--text-light)',
          paddingBottom: 20,
        }}>
          📅 {today}
        </div>
      </div>
    </div>
  )
}
