import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../App'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc, updateDoc, collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, where } from 'firebase/firestore'
import { getDday, getUpcomingAnniversaries, formatDate } from '../utils/dday'
import { getRandomGreeting } from '../utils/greetings'
import { getTodayFortune } from '../utils/fortune'
import { useNavigate } from 'react-router-dom'
import HeartAnimation from '../components/HeartAnimation'

export default function Home() {
  const navigate = useNavigate()
  const { user, couple, coupleId } = useContext(AppContext)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState({})
  const [recentDiaries, setRecentDiaries] = useState([])
  const [editingMsg, setEditingMsg] = useState(false)
  const [newMsg, setNewMsg] = useState('')
  const [greeting] = useState(() => getRandomGreeting())
  const [fortune] = useState(() => getTodayFortune())
  const [heartTrigger, setHeartTrigger] = useState(0)
  const [msgHistory, setMsgHistory] = useState([])
  const [showMsgHistory, setShowMsgHistory] = useState(false)
  const [partnerOnline, setPartnerOnline] = useState(false)
  const [heartNotif, setHeartNotif] = useState(null)
  const [randomMemory, setRandomMemory] = useState(null)
  const [customGreetings, setCustomGreetings] = useState([])

  const dday = getDday(couple?.startDate)
  const anniversaries = getUpcomingAnniversaries(couple?.startDate)
  const partnerUid = couple?.users?.find(u => u !== user.uid)
  const myName = couple?.userNames?.[user.uid]?.myName || couple?.names?.[user.uid] || '나'
  const partnerName = couple?.userNames?.[user.uid]?.partnerName || (partnerUid ? couple?.names?.[partnerUid] : null) || '상대방'
  const myAnimal = couple?.animals?.[user.uid] || ''
  const partnerAnimal = couple?.animals?.[partnerUid] || ''

  // Update lastSeen
  useEffect(() => {
    if (!coupleId || !user) return
    const update = () => {
      updateDoc(doc(db, 'couples', coupleId), {
        [`lastSeen.${user.uid}`]: new Date()
      }).catch(() => {})
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [coupleId, user])

  // Watch partner online status
  useEffect(() => {
    if (!coupleId || !partnerUid) return
    const unsub = onSnapshot(doc(db, 'couples', coupleId), (snap) => {
      if (snap.exists()) {
        const lastSeen = snap.data()?.lastSeen?.[partnerUid]
        if (lastSeen) {
          const ts = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen)
          setPartnerOnline(Date.now() - ts.getTime() < 5 * 60 * 1000)
        }
      }
    })
    return unsub
  }, [coupleId, partnerUid])

  // Watch for hearts
  useEffect(() => {
    if (!coupleId || !user) return
    const unsub = onSnapshot(doc(db, 'couples', coupleId, 'hearts', 'latest'), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        if (data.to === user.uid && data.seen !== true) {
          setHeartNotif(data)
          // Mark as seen
          updateDoc(doc(db, 'couples', coupleId, 'hearts', 'latest'), { seen: true }).catch(() => {})
        }
      }
    })
    return unsub
  }, [coupleId, user])

  useEffect(() => {
    if (!coupleId) return
    const unsub = onSnapshot(doc(db, 'couples', coupleId, 'messages', 'today'), (snap) => {
      if (snap.exists()) setMessages(snap.data())
    })
    return unsub
  }, [coupleId])

  useEffect(() => {
    if (!coupleId) return
    const q = query(collection(db, 'couples', coupleId, 'diaries'), orderBy('date', 'desc'), limit(3))
    const unsub = onSnapshot(q, (snap) => {
      setRecentDiaries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [coupleId])

  // Message history
  useEffect(() => {
    if (!coupleId) return
    const q = query(collection(db, 'couples', coupleId, 'messageHistory'), orderBy('createdAt', 'desc'), limit(20))
    const unsub = onSnapshot(q, (snap) => {
      setMsgHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [coupleId])

  // Random memory
  useEffect(() => {
    if (!coupleId) return
    const q = query(collection(db, 'couples', coupleId, 'diaries'), orderBy('date', 'desc'), limit(50))
    getDocs(q).then(snap => {
      const diaries = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      const today = new Date().toISOString().split('T')[0]
      const past = diaries.filter(d => d.date < today)
      if (past.length > 0) {
        const pick = past[Math.floor(Math.random() * past.length)]
        const daysDiff = Math.floor((new Date(today) - new Date(pick.date)) / (1000 * 60 * 60 * 24))
        setRandomMemory({ ...pick, daysAgo: daysDiff })
      }
    })
  }, [coupleId])

  const saveMessage = async () => {
    if (!newMsg.trim()) return
    const today = new Date().toISOString().split('T')[0]
    const msgData = { text: newMsg.trim(), date: today, updatedAt: new Date().toISOString() }

    // Save to today's message (overwrite my slot only)
    await setDoc(doc(db, 'couples', coupleId, 'messages', 'today'), {
      [user.uid]: msgData
    }, { merge: true })

    // Also save to message history for records
    await addDoc(collection(db, 'couples', coupleId, 'messageHistory'), {
      uid: user.uid,
      text: newMsg.trim(),
      date: today,
      createdAt: new Date()
    })

    setEditingMsg(false)
    setNewMsg('')
  }

  const sendHeart = async () => {
    if (!partnerUid) return
    setHeartTrigger(t => t + 1)
    await setDoc(doc(db, 'couples', coupleId, 'hearts', 'latest'), {
      from: user.uid,
      to: partnerUid,
      seen: false,
      createdAt: new Date()
    })
  }

  return (
    <div className="fade-in">
      <HeartAnimation trigger={heartTrigger} />

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          {myAnimal && partnerAnimal ? (
            <>{myAnimal} {myName} & {partnerName} {partnerAnimal}</>
          ) : (
            <>💕 {myName} & {partnerName}</>
          )}
        </span>
        <button
          onClick={() => navigate('/settings')}
          style={{ background: 'none', fontSize: 22, color: 'var(--text-light)', padding: 4 }}
        >
          ⚙️
        </button>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Partner online status */}
        {partnerOnline && (
          <div className="fade-in" style={{
            textAlign: 'center',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
            borderRadius: 20,
            fontSize: 13,
            color: '#4caf50',
            marginBottom: 12,
            fontWeight: 500,
          }}>
            {partnerAnimal || '👀'} {partnerName}이(가) 지금 보고 있어요!
          </div>
        )}

        {/* Heart notification */}
        {heartNotif && (
          <div className="fade-in card" style={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, #fce4ec, #fff0f3)',
            border: '2px solid var(--pink-light)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>💕</div>
            <div style={{ fontWeight: 600, color: 'var(--pink)' }}>
              {partnerName}이(가) 하트를 보냈어!
            </div>
            <button
              onClick={() => setHeartNotif(null)}
              style={{ marginTop: 8, background: 'none', fontSize: 12, color: 'var(--text-light)' }}
            >
              확인 💗
            </button>
          </div>
        )}

        {/* Random greeting */}
        <div style={{
          textAlign: 'center',
          padding: '12px',
          fontSize: 16,
          color: 'var(--pink)',
          fontWeight: 500,
          marginBottom: 8,
        }}>
          {greeting}
        </div>

        {/* D-Day + Heart button */}
        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, var(--pink), var(--coral))', color: 'white', position: 'relative' }}>
          {couple?.startDate ? (
            <>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4 }}>우리가 함께한 시간</div>
              <div style={{ fontSize: 48, fontWeight: 700 }}>D+{dday}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{formatDate(couple.startDate)}부터 💖</div>
            </>
          ) : (
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 16 }}>만난 날을 설정해주세요 💝</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>설정 탭에서 변경할 수 있어요</div>
            </div>
          )}
          {/* Heart button */}
          <button
            onClick={sendHeart}
            style={{
              position: 'absolute',
              right: 12,
              top: 12,
              background: 'rgba(255,255,255,0.25)',
              borderRadius: '50%',
              width: 44,
              height: 44,
              fontSize: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(1.3)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(1.3)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            💓
          </button>
        </div>

        {/* Today's Fortune */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>🔮 오늘의 커플 운세</div>
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 12 }}>
            🦂 전갈자리 x ♉ 황소자리 | 🐰 토끼띠 x 🐂 소띠
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: '전체운', icon: '⭐', text: fortune.overall, score: fortune.overallScore },
              { label: '데이트운', icon: '💑', text: fortune.date, tip: fortune.dateTip },
              { label: '애정운', icon: '💗', text: fortune.love, score: fortune.loveScore },
            ].map((f, i) => (
              <div key={i} style={{
                padding: '12px 14px',
                background: 'var(--pink-bg)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                lineHeight: 1.6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--pink)', fontSize: 13 }}>
                    {f.icon} {f.label}
                  </span>
                  {f.score && (
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: f.score >= 90 ? '#e91e63' : f.score >= 80 ? '#ff6d00' : '#ffa000',
                    }}>
                      {f.score}점
                    </span>
                  )}
                  {f.tip && (
                    <span style={{ fontSize: 11, background: 'var(--pink)', color: 'white', padding: '2px 8px', borderRadius: 10 }}>
                      {f.tip}
                    </span>
                  )}
                </div>
                {f.text}
              </div>
            ))}
            {/* Daily Advice */}
            <div style={{
              padding: '12px 14px',
              background: 'linear-gradient(135deg, #fff3e0, #fce4ec)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14,
              lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 600, color: '#e65100', marginBottom: 4, fontSize: 13 }}>
                💡 오늘의 조언
              </div>
              {fortune.advice}
            </div>
          </div>
        </div>

        {/* Upcoming Anniversaries */}
        {anniversaries.length > 0 && (
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>💝 다가오는 기념일</div>

            {/* Featured: Nearest anniversary as big countdown card */}
            {(() => {
              const nearest = anniversaries[0]
              const isWithinWeek = nearest.daysLeft <= 7
              const hoursLeft = nearest.daysLeft * 24
              return (
                <div style={{
                  background: isWithinWeek
                    ? 'linear-gradient(135deg, var(--pink), var(--coral))'
                    : 'linear-gradient(135deg, var(--pink-bg), white)',
                  borderRadius: 16,
                  padding: '20px 16px',
                  textAlign: 'center',
                  marginBottom: 12,
                  color: isWithinWeek ? 'white' : 'var(--text)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {isWithinWeek && (
                    <div style={{
                      position: 'absolute', top: 8, right: 12,
                      background: 'rgba(255,255,255,0.25)', borderRadius: 12,
                      padding: '2px 10px', fontSize: 11, fontWeight: 600,
                    }}>
                      🔥 곧이에요!
                    </div>
                  )}
                  <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>다음 기념일</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{nearest.label}</div>
                  <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.1 }}>
                    D-{nearest.daysLeft}
                  </div>
                  {isWithinWeek && (
                    <div style={{ fontSize: 14, marginTop: 6, opacity: 0.9 }}>
                      ⏰ 약 {hoursLeft}시간 남음
                    </div>
                  )}
                  <div style={{
                    fontSize: 12, marginTop: 8,
                    opacity: isWithinWeek ? 0.8 : 0.6,
                    color: isWithinWeek ? 'white' : 'var(--text-light)',
                  }}>
                    {formatDate(nearest.date)}
                  </div>
                </div>
              )
            })()}

            {/* Remaining anniversaries in compact list */}
            {anniversaries.slice(1).map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < anniversaries.length - 2 ? '1px solid var(--pink-bg)' : 'none' }}>
                <span>{a.label}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, color: 'var(--pink)', fontWeight: 600 }}>D-{a.daysLeft}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{formatDate(a.date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Random Memory */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>💭 그때 그 날</div>
          {randomMemory ? (
            <div style={{ padding: '12px 14px', background: 'var(--pink-bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 12, color: 'var(--pink)', fontWeight: 600, marginBottom: 6 }}>
                {randomMemory.daysAgo}일 전 • {randomMemory.date}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                {randomMemory.content?.substring(0, 120)}{randomMemory.content?.length > 120 ? '...' : ''}
              </div>
              {randomMemory.photoURL && (
                <img src={randomMemory.photoURL} alt="" style={{ marginTop: 8, width: '100%', borderRadius: 8, maxHeight: 150, objectFit: 'cover' }} />
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: 16 }}>
              아직 추억을 쌓는 중 💕
            </div>
          )}
        </div>

        {/* Today's Message */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>💬 오늘의 한마디</div>
          {[user.uid, partnerUid].map(uid => {
            const m = messages[uid]
            const name = uid === user.uid ? myName : partnerName
            const animal = uid === user.uid ? myAnimal : partnerAnimal
            const isMe = uid === user.uid
            return (
              <div key={uid} style={{ padding: '10px 0', borderBottom: '1px solid var(--pink-bg)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>{animal} {name} {isMe ? '(나)' : ''}</div>
                {m?.text ? (
                  <div style={{ fontSize: 15, lineHeight: 1.5 }}>"{m.text}"</div>
                ) : (
                  <div style={{ fontSize: 14, color: 'var(--text-light)' }}>아직 메시지가 없어요</div>
                )}
              </div>
            )
          })}
          {editingMsg ? (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <input
                className="input-field"
                placeholder="한마디를 남겨보세요"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveMessage()}
                style={{ flex: 1 }}
                autoFocus
              />
              <button className="btn-primary" onClick={saveMessage} style={{ width: 'auto', padding: '12px 20px' }}>💕</button>
            </div>
          ) : (
            <button className="btn-secondary" onClick={() => { setEditingMsg(true); setNewMsg(messages[user.uid]?.text || '') }} style={{ marginTop: 12, width: '100%' }}>
              ✏️ 한마디 남기기
            </button>
          )}

          {/* Message History */}
          {msgHistory.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => setShowMsgHistory(!showMsgHistory)}
                style={{ fontSize: 12, color: 'var(--pink)', background: 'none', padding: 0, fontWeight: 500 }}
              >
                {showMsgHistory ? '▲ 기록 닫기' : `▼ 한마디 기록 보기 (${msgHistory.length})`}
              </button>
              {showMsgHistory && (
                <div className="fade-in" style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
                  {msgHistory.map(m => {
                    const isMe = m.uid === user.uid
                    const name = isMe ? myName : partnerName
                    const animal = isMe ? myAnimal : partnerAnimal
                    const ts = m.createdAt?.toDate ? m.createdAt.toDate() : new Date(m.createdAt)
                    const dateStr = `${ts.getMonth()+1}/${ts.getDate()}`
                    return (
                      <div key={m.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--pink-bg)', fontSize: 13 }}>
                        <span style={{ color: isMe ? 'var(--pink)' : 'var(--coral)', fontWeight: 600 }}>{animal} {name}</span>
                        <span style={{ color: 'var(--text-light)', marginLeft: 6 }}>{dateStr}</span>
                        <div style={{ marginTop: 2 }}>"{m.text}"</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Diaries */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>📖 최근 기록</div>
          {recentDiaries.length > 0 ? recentDiaries.map(d => (
            <div key={d.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--pink-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--pink)', fontWeight: 500 }}>
                  {d.authorUid === user.uid ? `${myAnimal} ${myName}` : `${partnerAnimal} ${partnerName}`}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{d.date}</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>{d.content?.substring(0, 80)}{d.content?.length > 80 ? '...' : ''}</div>
              {(d.photoURL || d.photoURLs?.[0]) && (
                <img src={d.photoURLs?.[0] || d.photoURL} alt="" style={{ marginTop: 8, width: '100%', borderRadius: 8, maxHeight: 120, objectFit: 'cover' }} />
              )}
            </div>
          )) : (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: 20 }}>
              아직 우리의 기록이 없어요 ✍️
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
