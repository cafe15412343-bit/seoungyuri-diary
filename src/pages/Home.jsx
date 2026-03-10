import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../App'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { getDday, getUpcomingAnniversaries, formatDate } from '../utils/dday'

export default function Home() {
  const { user, couple, coupleId } = useContext(AppContext)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState({})
  const [recentDiaries, setRecentDiaries] = useState([])
  const [editingMsg, setEditingMsg] = useState(false)
  const [newMsg, setNewMsg] = useState('')

  const dday = getDday(couple?.startDate)
  const anniversaries = getUpcomingAnniversaries(couple?.startDate)
  const partnerUid = couple?.users?.find(u => u !== user.uid)
  const myName = couple?.names?.[user.uid] || '나'
  const partnerName = couple?.names?.[partnerUid] || '상대방'

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

  const saveMessage = async () => {
    if (!newMsg.trim()) return
    const today = new Date().toISOString().split('T')[0]
    await setDoc(doc(db, 'couples', coupleId, 'messages', 'today'), {
      [user.uid]: { text: newMsg.trim(), date: today },
      ...messages
    }, { merge: true })
    setEditingMsg(false)
    setNewMsg('')
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        💕 {myName} & {partnerName}
      </div>

      {/* D-Day */}
      <div style={{ padding: '0 20px' }}>
        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, var(--pink), var(--coral))', color: 'white' }}>
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
        </div>

        {/* Upcoming Anniversaries */}
        {anniversaries.length > 0 && (
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>💝 다가오는 기념일</div>
            {anniversaries.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < anniversaries.length - 1 ? '1px solid var(--pink-bg)' : 'none' }}>
                <span>{a.label}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, color: 'var(--pink)', fontWeight: 600 }}>D-{a.daysLeft}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{formatDate(a.date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Today's Message */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>💬 오늘의 한마디</div>
          {[user.uid, partnerUid].map(uid => {
            const m = messages[uid]
            const name = uid === user.uid ? myName : partnerName
            const isMe = uid === user.uid
            return (
              <div key={uid} style={{ padding: '10px 0', borderBottom: '1px solid var(--pink-bg)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>{name} {isMe ? '(나)' : ''}</div>
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
              <input className="input-field" placeholder="한마디를 남겨보세요" value={newMsg} onChange={e => setNewMsg(e.target.value)} style={{ flex: 1 }} />
              <button className="btn-primary" onClick={saveMessage} style={{ width: 'auto', padding: '12px 20px' }}>💕</button>
            </div>
          ) : (
            <button className="btn-secondary" onClick={() => { setEditingMsg(true); setNewMsg(messages[user.uid]?.text || '') }} style={{ marginTop: 12, width: '100%' }}>
              ✏️ 한마디 남기기
            </button>
          )}
        </div>

        {/* Recent Diaries */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>📔 최근 다이어리</div>
          {recentDiaries.length > 0 ? recentDiaries.map(d => (
            <div key={d.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--pink-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--pink)', fontWeight: 500 }}>
                  {d.authorUid === user.uid ? myName : partnerName}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{d.date}</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>{d.content?.substring(0, 80)}{d.content?.length > 80 ? '...' : ''}</div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: 20 }}>
              아직 기록이 없어요 ✍️
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
