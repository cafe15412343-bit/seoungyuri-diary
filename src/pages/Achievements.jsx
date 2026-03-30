import { useState, useEffect, useContext, useCallback } from 'react'
import { AppContext } from '../App'
import { db } from '../firebase'
import { collection, query, orderBy, getDocs, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

const BADGES = [
  // 기록 관련
  { id: 'first_diary', emoji: '🥉', name: '첫 발자국', desc: '첫 일기 작성', category: '기록' },
  { id: 'diary_5', emoji: '📝', name: '기록의 시작', desc: '일기 5개 작성', category: '기록' },
  { id: 'diary_20', emoji: '📖', name: '이야기꾼', desc: '일기 20개 작성', category: '기록' },
  { id: 'diary_50', emoji: '📚', name: '작가 등극', desc: '일기 50개 작성', category: '기록' },
  { id: 'streak_3', emoji: '🔥', name: '3일 연속', desc: '3일 연속 일기 작성', category: '기록' },
  { id: 'streak_7', emoji: '💪', name: '7일 연속', desc: '7일 연속 일기 작성', category: '기록' },
  { id: 'streak_30', emoji: '🏆', name: '한 달 개근', desc: '30일 연속 일기 작성', category: '기록' },
  // 커플 관련
  { id: 'dday_set', emoji: '💕', name: '우리의 시작', desc: 'D-Day 설정 완료', category: '커플' },
  { id: 'dday_100', emoji: '💯', name: '100일 돌파', desc: '사귄 지 100일', category: '커플' },
  { id: 'dday_200', emoji: '🎂', name: '200일 축하', desc: '사귄 지 200일', category: '커플' },
  { id: 'dday_300', emoji: '💍', name: '300일 기념', desc: '사귄 지 300일', category: '커플' },
  { id: 'dday_365', emoji: '🎊', name: '1주년!', desc: '사귄 지 365일', category: '커플' },
  { id: 'first_heart', emoji: '💝', name: '하트 전달', desc: '첫 하트 보내기', category: '커플' },
  { id: 'first_message', emoji: '💌', name: '한마디의 힘', desc: '오늘의 한마디 첫 작성', category: '커플' },
  // 약속 관련
  { id: 'first_promise', emoji: '✅', name: '약속 시작', desc: '첫 약속 추가', category: '약속' },
  { id: 'promise_max', emoji: '🌟', name: '약속왕', desc: '약속 캐릭터 Lv.MAX 달성', category: '약속' },
  { id: 'promise_streak_7', emoji: '🔥', name: '불꽃 스트릭', desc: '약속 7일 연속 달성', category: '약속' },
  // 기능 탐험
  { id: 'first_photo', emoji: '📸', name: '포토그래퍼', desc: '사진 포함 일기 첫 작성', category: '탐험' },
  { id: 'wish_5', emoji: '🎯', name: '위시 마스터', desc: '위시리스트 5개 달성', category: '탐험' },
  { id: 'first_expense', emoji: '💰', name: '알뜰살뜰', desc: '가계부 첫 기록', category: '탐험' },
  { id: 'first_letter', emoji: '💌', name: '타임캡슐', desc: '타임캡슐 편지 첫 작성', category: '탐험' },
]

const CATEGORIES = ['기록', '커플', '약속', '탐험']

function getDateStr(d) {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}

function calcMaxStreak(dates) {
  if (!dates.length) return 0
  const sorted = [...new Set(dates.map(d => getDateStr(d)))].sort()
  let max = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i-1])
    const next = new Date(sorted[i])
    const diff = (next - prev) / 86400000
    if (diff === 1) { cur++; max = Math.max(max, cur) }
    else cur = 1
  }
  return max
}

function Confetti({ onDone }) {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: ['#ff6b8a','#ffd700','#7c5cff','#00d4aa','#ff9500'][i % 5],
      size: 6 + Math.random() * 6,
    }))
  )
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t) }, [onDone])

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, pointerEvents:'none', zIndex:9999 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.x}%`, top:'-10px',
          width: p.size, height: p.size, borderRadius: p.size > 9 ? '50%' : '2px',
          background: p.color,
          animation: `confetti-fall 2s ${p.delay}s ease-in forwards`,
        }} />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default function Achievements() {
  const navigate = useNavigate()
  const { user, couple, coupleId } = useContext(AppContext)
  const [achieved, setAchieved] = useState({}) // { badgeId: { date } }
  const [loading, setLoading] = useState(true)
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [newlyUnlocked, setNewlyUnlocked] = useState([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    if (!coupleId) return
    checkAchievements()
  }, [coupleId])

  async function checkAchievements() {
    setLoading(true)
    try {
      // Load existing achievements
      const achRef = collection(db, 'couples', coupleId, 'achievements')
      const achSnap = await getDocs(achRef)
      const existing = {}
      achSnap.forEach(d => { existing[d.id] = d.data() })

      // Load data for checking
      const [diaries, promises, promiseDaily, wishlist, expenses, letters, hearts, messages] = await Promise.all([
        getDocs(query(collection(db, 'couples', coupleId, 'diaries'), orderBy('date', 'desc'))),
        getDocs(collection(db, 'couples', coupleId, 'promises')),
        getDocs(collection(db, 'couples', coupleId, 'promiseDaily')),
        getDocs(collection(db, 'couples', coupleId, 'wishlist')),
        getDocs(collection(db, 'couples', coupleId, 'expenses')),
        getDocs(collection(db, 'couples', coupleId, 'letters')),
        getDocs(collection(db, 'couples', coupleId, 'hearts')),
        getDocs(collection(db, 'couples', coupleId, 'messages')),
      ])

      const diaryDocs = []
      diaries.forEach(d => diaryDocs.push({ id: d.id, ...d.data() }))
      const diaryCount = diaryDocs.length
      const diaryDates = diaryDocs.map(d => d.date).filter(Boolean)
      const maxStreak = calcMaxStreak(diaryDates)
      const hasPhoto = diaryDocs.some(d => d.imageUrl || d.images?.length > 0)

      const promiseDocs = []
      promises.forEach(d => promiseDocs.push(d.data()))

      const promiseDailyDocs = []
      promiseDaily.forEach(d => promiseDailyDocs.push({ id: d.id, ...d.data() }))

      // Promise streak calculation
      let promiseStreak = 0
      if (promiseDailyDocs.length > 0) {
        const dailyDates = [...new Set(promiseDailyDocs
          .filter(d => d.allDone || d.completed)
          .map(d => d.id || d.date)
        )].sort().reverse()
        if (dailyDates.length > 0) {
          promiseStreak = 1
          for (let i = 1; i < dailyDates.length; i++) {
            const prev = new Date(dailyDates[i-1])
            const cur = new Date(dailyDates[i])
            if ((prev - cur) / 86400000 === 1) promiseStreak++
            else break
          }
        }
      }

      // Promise character level check
      const promiseMax = couple?.promiseLevel >= 10 || couple?.promiseCharacterMaxed

      const wishDocs = []
      wishlist.forEach(d => wishDocs.push(d.data()))
      const wishDone = wishDocs.filter(w => w.done || w.completed).length

      const expenseCount = expenses.size
      const letterCount = letters.size
      const heartCount = hearts.size
      const messageCount = messages.size

      // D-Day
      const startDate = couple?.startDate
      let daysSince = 0
      if (startDate) {
        const start = new Date(startDate)
        daysSince = Math.floor((Date.now() - start.getTime()) / 86400000)
      }

      // Check each badge
      const now = new Date()
      const checks = {
        first_diary: diaryCount >= 1,
        diary_5: diaryCount >= 5,
        diary_20: diaryCount >= 20,
        diary_50: diaryCount >= 50,
        streak_3: maxStreak >= 3,
        streak_7: maxStreak >= 7,
        streak_30: maxStreak >= 30,
        dday_set: !!startDate,
        dday_100: daysSince >= 100,
        dday_200: daysSince >= 200,
        dday_300: daysSince >= 300,
        dday_365: daysSince >= 365,
        first_heart: heartCount > 0 || couple?.heartCount > 0,
        first_message: messageCount > 0 || !!couple?.messages,
        first_promise: promiseDocs.length > 0,
        promise_max: !!promiseMax,
        promise_streak_7: promiseStreak >= 7,
        first_photo: hasPhoto,
        wish_5: wishDone >= 5,
        first_expense: expenseCount > 0,
        first_letter: letterCount > 0,
      }

      const newlyDone = []
      const final = { ...existing }

      for (const [id, met] of Object.entries(checks)) {
        if (met && !existing[id]) {
          const data = { achievedAt: now.toISOString(), date: getDateStr(now) }
          await setDoc(doc(db, 'couples', coupleId, 'achievements', id), data)
          final[id] = data
          newlyDone.push(id)
        }
      }

      setAchieved(final)
      if (newlyDone.length > 0) {
        setNewlyUnlocked(newlyDone)
        setShowConfetti(true)
        const badge = BADGES.find(b => b.id === newlyDone[0])
        if (badge) showToast(`🎉 "${badge.name}" 업적 달성!`)
      }
    } catch (err) {
      console.error('Achievement check error:', err)
    }
    setLoading(false)
  }

  const achievedCount = Object.keys(achieved).length
  const totalCount = BADGES.length
  const progress = totalCount > 0 ? (achievedCount / totalCount) * 100 : 0

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏅</div>
        <div style={{ color: 'var(--text-light)' }}>업적 확인 중...</div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, var(--pink), #ff6b8a)',
          color: 'white', padding: '12px 24px', borderRadius: 20,
          fontWeight: 600, fontSize: 14, zIndex: 10000,
          boxShadow: '0 4px 15px rgba(255,107,138,0.4)',
          animation: 'toast-in 0.3s ease-out',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 4,
          }}>←</button>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>🏅 업적</h1>
        </div>

        {/* Progress bar */}
        <div style={{
          background: 'var(--card)', borderRadius: 16, padding: 20,
          marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>달성률</span>
            <span style={{ fontWeight: 700, color: 'var(--pink)', fontSize: 15 }}>
              {achievedCount}/{totalCount} 달성 💕
            </span>
          </div>
          <div style={{
            background: 'var(--bg)', borderRadius: 10, height: 12, overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`, height: '100%',
              background: 'linear-gradient(90deg, var(--pink), #ff6b8a)',
              borderRadius: 10, transition: 'width 0.8s ease-out',
            }} />
          </div>
        </div>
      </div>

      {/* Categories */}
      {CATEGORIES.map(cat => {
        const badges = BADGES.filter(b => b.category === cat)
        const catIcons = { '기록': '📝', '커플': '💕', '약속': '✅', '탐험': '🧭' }
        return (
          <div key={cat} style={{ padding: '0 20px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>
              {catIcons[cat]} {cat}
            </h2>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
            }}>
              {badges.map(badge => {
                const done = !!achieved[badge.id]
                const isNew = newlyUnlocked.includes(badge.id)
                return (
                  <button
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    style={{
                      background: done
                        ? 'linear-gradient(135deg, #fff5f7, #ffe0e8)'
                        : '#f0f0f0',
                      border: isNew ? '2px solid var(--pink)' : '2px solid transparent',
                      borderRadius: 16, padding: '16px 8px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 6, cursor: 'pointer', transition: 'all 0.2s',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {isNew && (
                      <div style={{
                        position: 'absolute', top: 4, right: 4,
                        background: 'var(--pink)', color: 'white',
                        fontSize: 9, padding: '2px 6px', borderRadius: 8, fontWeight: 700,
                      }}>NEW</div>
                    )}
                    <span style={{
                      fontSize: 32,
                      filter: done ? 'none' : 'grayscale(1) opacity(0.4)',
                    }}>
                      {done ? badge.emoji : '🔒'}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: done ? 'var(--text)' : 'var(--text-light)',
                      textAlign: 'center', lineHeight: 1.3,
                    }}>
                      {done ? badge.name : '???'}
                    </span>
                    {done && achieved[badge.id]?.date && (
                      <span style={{ fontSize: 9, color: 'var(--text-light)' }}>
                        {achieved[badge.id].date}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Badge detail modal */}
      {selectedBadge && (
        <>
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.4)', zIndex: 2000,
            }}
            onClick={() => setSelectedBadge(null)}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'white', borderRadius: '24px 24px 0 0',
            padding: '32px 24px 40px', zIndex: 2001,
            animation: 'slide-up 0.3s ease-out',
          }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontSize: 64,
                filter: achieved[selectedBadge.id] ? 'none' : 'grayscale(1) opacity(0.3)',
              }}>
                {achieved[selectedBadge.id] ? selectedBadge.emoji : '🔒'}
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: '12px 0 4px' }}>
                {achieved[selectedBadge.id] ? selectedBadge.name : '???'}
              </h3>
              <p style={{
                color: 'var(--text-light)', fontSize: 14, margin: '0 0 16px',
                filter: achieved[selectedBadge.id] ? 'none' : 'blur(3px)',
                userSelect: achieved[selectedBadge.id] ? 'auto' : 'none',
              }}>
                {selectedBadge.desc}
              </p>
              {achieved[selectedBadge.id] ? (
                <div style={{
                  background: 'linear-gradient(135deg, #fff5f7, #ffe0e8)',
                  borderRadius: 12, padding: '10px 20px', display: 'inline-block',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--pink)', fontWeight: 600 }}>
                    🎉 {achieved[selectedBadge.id].date} 달성!
                  </span>
                </div>
              ) : (
                <div style={{
                  background: '#f5f5f5', borderRadius: 12,
                  padding: '10px 20px', display: 'inline-block',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
                    아직 미달성
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedBadge(null)}
              style={{
                width: '100%', padding: 14, borderRadius: 12,
                background: 'var(--pink)', color: 'white',
                border: 'none', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', marginTop: 24,
              }}
            >닫기</button>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes toast-in {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
