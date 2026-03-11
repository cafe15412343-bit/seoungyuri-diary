import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../App'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, deleteDoc, doc } from 'firebase/firestore'

export default function Letters() {
  const { user, couple, coupleId } = useContext(AppContext)
  const [letters, setLetters] = useState([])
  const [showWrite, setShowWrite] = useState(false)
  const [content, setContent] = useState('')
  const [openDate, setOpenDate] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [openedLetter, setOpenedLetter] = useState(null)

  const partnerUid = couple?.users?.find(u => u !== user.uid)
  const myName = couple?.userNames?.[user.uid]?.myName || couple?.names?.[user.uid] || '나'
  const partnerName = couple?.userNames?.[user.uid]?.partnerName || (partnerUid ? couple?.names?.[partnerUid] : null) || '상대방'
  const myAnimal = couple?.animals?.[user.uid] || '💌'
  const partnerAnimal = couple?.animals?.[partnerUid] || '💌'

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!coupleId) return
    const q = query(collection(db, 'couples', coupleId, 'letters'), orderBy('openDate', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setLetters(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [coupleId])

  const handleSend = async () => {
    if (!content.trim() || !openDate) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'letters'), {
        title: title.trim() || '💌 비밀 편지',
        content: content.trim(),
        openDate,
        authorUid: user.uid,
        createdAt: new Date(),
        opened: false,
      })
      setContent('')
      setTitle('')
      setOpenDate('')
      setShowWrite(false)
    } catch (e) {
      alert('저장 실패: ' + e.message)
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (confirm('이 편지를 삭제할까요?')) {
      await deleteDoc(doc(db, 'couples', coupleId, 'letters', id))
    }
  }

  const canOpen = (letter) => letter.openDate <= today
  const isFromMe = (letter) => letter.authorUid === user.uid

  // Separate: openable, future, already opened
  const openable = letters.filter(l => canOpen(l) && !openedLetter?.id)
  const futureLocked = letters.filter(l => !canOpen(l))
  const pastOpened = letters.filter(l => canOpen(l))

  const getDaysUntil = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date(today)) / (1000 * 60 * 60 * 24))
    return diff
  }

  // Suggested dates
  const getDefaultDates = () => {
    const dates = []
    const start = couple?.startDate ? new Date(couple.startDate) : null
    if (start) {
      // 100일
      const d100 = new Date(start); d100.setDate(d100.getDate() + 100)
      if (d100.toISOString().split('T')[0] > today) dates.push({ label: '100일', date: d100.toISOString().split('T')[0] })
      // 200일
      const d200 = new Date(start); d200.setDate(d200.getDate() + 200)
      if (d200.toISOString().split('T')[0] > today) dates.push({ label: '200일', date: d200.toISOString().split('T')[0] })
      // 300일
      const d300 = new Date(start); d300.setDate(d300.getDate() + 300)
      if (d300.toISOString().split('T')[0] > today) dates.push({ label: '300일', date: d300.toISOString().split('T')[0] })
      // 1주년
      const y1 = new Date(start); y1.setFullYear(y1.getFullYear() + 1)
      if (y1.toISOString().split('T')[0] > today) dates.push({ label: '1주년', date: y1.toISOString().split('T')[0] })
    }
    // 크리스마스
    const xmas = new Date(new Date().getFullYear(), 11, 25).toISOString().split('T')[0]
    if (xmas > today) dates.push({ label: '크리스마스', date: xmas })
    // 1주일 후
    const week = new Date(); week.setDate(week.getDate() + 7)
    dates.push({ label: '1주일 후', date: week.toISOString().split('T')[0] })
    // 1개월 후
    const month = new Date(); month.setMonth(month.getMonth() + 1)
    dates.push({ label: '1개월 후', date: month.toISOString().split('T')[0] })

    return dates
  }

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>💌 타임캡슐 편지</span>
        <button
          onClick={() => setShowWrite(!showWrite)}
          style={{ fontSize: 14, background: 'var(--pink)', color: 'white', padding: '8px 16px', borderRadius: 20, fontWeight: 500 }}
        >
          {showWrite ? '✕ 닫기' : '✏️ 편지 쓰기'}
        </button>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Write Form */}
        {showWrite && (
          <div className="card fade-in" style={{ borderLeft: '4px solid var(--pink)', background: 'linear-gradient(135deg, #fff8e1, #fff3e0)' }}>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>💌 미래의 우리에게 편지 쓰기</div>

            <input
              className="input-field"
              placeholder="편지 제목 (선택)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ marginBottom: 8 }}
            />

            <textarea
              className="input-field"
              placeholder="미래의 우리에게 전하고 싶은 말을 적어보세요...&#10;&#10;지금의 마음, 약속, 고백, 뭐든 좋아! 💕"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
              style={{ marginBottom: 12, resize: 'none' }}
            />

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 8 }}>📅 언제 열어볼까?</div>

              {/* Quick date buttons */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {getDefaultDates().map(d => (
                  <button
                    key={d.label}
                    onClick={() => setOpenDate(d.date)}
                    style={{
                      padding: '6px 12px', borderRadius: 16, fontSize: 12,
                      background: openDate === d.date ? 'var(--pink)' : 'var(--pink-bg)',
                      color: openDate === d.date ? 'white' : 'var(--text)',
                      fontWeight: 500,
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <input
                type="date"
                className="input-field"
                value={openDate}
                onChange={e => setOpenDate(e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              />
            </div>

            <button
              className="btn-primary"
              onClick={handleSend}
              disabled={saving || !content.trim() || !openDate}
            >
              {saving ? '보내는 중...' : '💌 타임캡슐에 넣기'}
            </button>
          </div>
        )}

        {/* Opened letter modal */}
        {openedLetter && (
          <div className="card fade-in" style={{
            background: 'linear-gradient(135deg, #fff8e1, #fffde7)',
            border: '2px solid #ffd54f',
            position: 'relative',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 40 }}>💌</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--pink)', marginTop: 4 }}>
                {openedLetter.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                {isFromMe(openedLetter) ? `${myAnimal} ${myName}` : `${partnerAnimal} ${partnerName}`}가 {openedLetter.createdAt?.toDate ? 
                  new Date(openedLetter.createdAt.toDate()).toLocaleDateString('ko-KR') : 
                  ''}에 쓴 편지
              </div>
            </div>
            <div style={{
              padding: '20px',
              background: 'white',
              borderRadius: 12,
              fontSize: 15,
              lineHeight: 2,
              whiteSpace: 'pre-wrap',
              fontFamily: "'Noto Serif KR', serif",
              minHeight: 100,
            }}>
              {openedLetter.content}
            </div>
            <button
              onClick={() => setOpenedLetter(null)}
              className="btn-secondary"
              style={{ marginTop: 16, width: '100%' }}
            >
              닫기 💕
            </button>
          </div>
        )}

        {/* Openable Letters */}
        {pastOpened.length > 0 && (
          <>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--pink)', marginBottom: 8, marginTop: 8 }}>
              📬 열어볼 수 있는 편지
            </div>
            {pastOpened.map(l => (
              <div key={l.id} className="card" style={{
                padding: '14px 16px', marginBottom: 8,
                background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div onClick={() => setOpenedLetter(l)} style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      📬 {l.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                      {isFromMe(l) ? `${myName}` : `${partnerName}`}이(가) 쓴 편지 · 개봉일: {l.openDate}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setOpenedLetter(l)}
                      style={{
                        padding: '8px 16px', borderRadius: 16, fontSize: 13,
                        background: 'var(--pink)', color: 'white', fontWeight: 600,
                      }}
                    >
                      읽기 💌
                    </button>
                    {isFromMe(l) && (
                      <button onClick={() => handleDelete(l.id)} style={{ background: 'none', fontSize: 14, color: 'var(--text-light)' }}>🗑</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Future Letters */}
        {futureLocked.length > 0 && (
          <>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-light)', marginBottom: 8, marginTop: 16 }}>
              🔒 아직 열 수 없는 편지
            </div>
            {futureLocked.map(l => {
              const daysLeft = getDaysUntil(l.openDate)
              return (
                <div key={l.id} className="card" style={{
                  padding: '14px 16px', marginBottom: 8,
                  background: 'linear-gradient(135deg, #f3e5f5, #ede7f6)',
                  opacity: 0.85,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        🔒 {l.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                        {isFromMe(l) ? '내가 쓴 편지' : `${partnerName}이(가) 쓴 편지`} · D-{daysLeft}
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 14px', borderRadius: 16, fontSize: 13,
                      background: 'rgba(156,39,176,0.15)', color: '#7b1fa2', fontWeight: 600,
                    }}>
                      {l.openDate}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {letters.length === 0 && !showWrite && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💌</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>아직 편지가 없어요</div>
            <div style={{ fontSize: 14 }}>미래의 우리에게 편지를 써보세요!</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>기념일에 열어보면 감동 2배 🥹</div>
          </div>
        )}
      </div>
    </div>
  )
}
