import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../App'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, where } from 'firebase/firestore'

export default function Calendar() {
  const { user, couple, coupleId } = useContext(AppContext)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [newEvent, setNewEvent] = useState({ title: '', memo: '' })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const partnerUid = couple?.users?.find(u => u !== user.uid)
  const myName = couple?.names?.[user.uid] || '나'
  const partnerName = couple?.names?.[partnerUid] || '상대방'

  useEffect(() => {
    if (!coupleId) return
    const unsub = onSnapshot(collection(db, 'couples', coupleId, 'events'), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [coupleId])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const getDateStr = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const eventsForDay = (day) => events.filter(e => e.date === getDateStr(day))

  const prevMonth = () => setCurrentDate(new Date(year, month - 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1))

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !selectedDate) return
    await addDoc(collection(db, 'couples', coupleId, 'events'), {
      title: newEvent.title.trim(),
      memo: newEvent.memo.trim(),
      date: getDateStr(selectedDate),
      authorUid: user.uid,
      createdAt: new Date()
    })
    setNewEvent({ title: '', memo: '' })
    setShowAdd(false)
  }

  const handleDelete = async (id) => {
    if (confirm('일정을 삭제할까요?')) {
      await deleteDoc(doc(db, 'couples', coupleId, 'events', id))
    }
  }

  const today = new Date()
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <div className="fade-in">
      <div className="page-header">📅 캘린더</div>
      <div style={{ padding: '0 20px' }}>
        {/* Month Nav */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button onClick={prevMonth} style={{ background: 'none', fontSize: 20, padding: '4px 12px' }}>‹</button>
            <span style={{ fontWeight: 700, fontSize: 18 }}>{year}년 {month + 1}월</span>
            <button onClick={nextMonth} style={{ background: 'none', fontSize: 20, padding: '4px 12px' }}>›</button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 8 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
              <div key={d} style={{ fontSize: 12, color: d === '일' ? '#e74c3c' : d === '토' ? '#3498db' : 'var(--text-light)', fontWeight: 500 }}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {days.map((day, i) => (
              <button
                key={i}
                onClick={() => day && (setSelectedDate(day), setShowAdd(false))}
                style={{
                  padding: '8px 0',
                  background: selectedDate === day ? 'var(--pink)' : isToday(day) ? 'var(--pink-bg)' : 'none',
                  color: selectedDate === day ? 'white' : day ? 'var(--text)' : 'transparent',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: isToday(day) ? 700 : 400,
                  position: 'relative',
                }}
              >
                {day || ''}
                {day && eventsForDay(day).length > 0 && (
                  <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: selectedDate === day ? 'white' : 'var(--coral)' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Date Events */}
        {selectedDate && (
          <div className="card fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>
                {month + 1}월 {selectedDate}일
              </span>
              <button
                onClick={() => setShowAdd(true)}
                style={{ fontSize: 13, background: 'var(--pink-bg)', color: 'var(--pink)', padding: '6px 14px', borderRadius: 15, fontWeight: 500 }}
              >
                + 일정 추가
              </button>
            </div>

            {eventsForDay(selectedDate).map(e => (
              <div key={e.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--pink-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 15 }}>💕 {e.title}</div>
                  {e.memo && <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>{e.memo}</div>}
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                    {e.authorUid === user.uid ? myName : partnerName}
                  </div>
                </div>
                {e.authorUid === user.uid && (
                  <button onClick={() => handleDelete(e.id)} style={{ background: 'none', fontSize: 12, color: 'var(--text-light)' }}>🗑</button>
                )}
              </div>
            ))}

            {eventsForDay(selectedDate).length === 0 && !showAdd && (
              <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: 16, fontSize: 14 }}>
                일정이 없어요 📭
              </div>
            )}

            {showAdd && (
              <div className="fade-in" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--pink-bg)' }}>
                <input className="input-field" placeholder="일정 제목" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} style={{ marginBottom: 8 }} />
                <input className="input-field" placeholder="메모 (선택)" value={newEvent.memo} onChange={e => setNewEvent({ ...newEvent, memo: e.target.value })} style={{ marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-primary" onClick={handleAddEvent} style={{ flex: 1 }}>저장</button>
                  <button className="btn-secondary" onClick={() => setShowAdd(false)}>취소</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
