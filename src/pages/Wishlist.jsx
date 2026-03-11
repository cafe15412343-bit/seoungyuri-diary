import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../App'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, deleteDoc, doc, updateDoc } from 'firebase/firestore'

const CATEGORIES = [
  { id: 'travel', icon: '✈️', label: '여행' },
  { id: 'food', icon: '🍽️', label: '맛집' },
  { id: 'activity', icon: '🎯', label: '활동' },
  { id: 'bucket', icon: '⭐', label: '버킷리스트' },
  { id: 'gift', icon: '🎁', label: '선물' },
  { id: 'etc', icon: '📌', label: '기타' },
]

export default function Wishlist() {
  const { user, couple, coupleId } = useContext(AppContext)
  const [wishes, setWishes] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newCategory, setNewCategory] = useState('etc')
  const [filter, setFilter] = useState('all') // 'all', 'todo', 'done', or category id
  const [saving, setSaving] = useState(false)

  const partnerUid = couple?.users?.find(u => u !== user.uid)
  const myName = couple?.userNames?.[user.uid]?.myName || couple?.names?.[user.uid] || '나'
  const partnerName = couple?.userNames?.[user.uid]?.partnerName || (partnerUid ? couple?.names?.[partnerUid] : null) || '상대방'

  useEffect(() => {
    if (!coupleId) return
    const q = query(collection(db, 'couples', coupleId, 'wishes'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setWishes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [coupleId])

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'wishes'), {
        title: newTitle.trim(),
        note: newNote.trim(),
        category: newCategory,
        done: false,
        doneDate: null,
        createdBy: user.uid,
        createdAt: new Date(),
      })
      setNewTitle('')
      setNewNote('')
      setNewCategory('etc')
      setShowAdd(false)
    } catch (e) {
      alert('저장 실패: ' + e.message)
    }
    setSaving(false)
  }

  const toggleDone = async (wish) => {
    const newDone = !wish.done
    await updateDoc(doc(db, 'couples', coupleId, 'wishes', wish.id), {
      done: newDone,
      doneDate: newDone ? new Date().toISOString().split('T')[0] : null,
    })
  }

  const handleDelete = async (id) => {
    if (confirm('이 위시를 삭제할까요?')) {
      await deleteDoc(doc(db, 'couples', coupleId, 'wishes', id))
    }
  }

  const getCategoryInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[5]

  const filteredWishes = wishes.filter(w => {
    if (filter === 'all') return true
    if (filter === 'todo') return !w.done
    if (filter === 'done') return w.done
    return w.category === filter
  })

  const doneCount = wishes.filter(w => w.done).length
  const todoCount = wishes.filter(w => !w.done).length

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🎯 위시리스트</span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{ fontSize: 14, background: 'var(--pink)', color: 'white', padding: '8px 16px', borderRadius: 20, fontWeight: 500 }}
        >
          {showAdd ? '✕ 닫기' : '➕ 추가'}
        </button>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Stats */}
        <div className="card" style={{
          display: 'flex', justifyContent: 'space-around', textAlign: 'center',
          background: 'linear-gradient(135deg, var(--pink), var(--coral))', color: 'white',
        }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{wishes.length}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>전체</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{todoCount}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>남은 꿈</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{doneCount}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>이룬 꿈 ✨</div>
          </div>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="card fade-in" style={{ borderLeft: '4px solid var(--pink)' }}>
            <input
              className="input-field"
              placeholder="같이 하고 싶은 것을 적어보세요 💕"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAdd()}
            />
            <textarea
              className="input-field"
              placeholder="메모 (선택)"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={2}
              style={{ marginTop: 8, resize: 'none' }}
            />
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6 }}>카테고리</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setNewCategory(c.id)}
                    style={{
                      padding: '6px 12px', borderRadius: 16, fontSize: 13,
                      background: newCategory === c.id ? 'linear-gradient(135deg, var(--pink), var(--coral))' : 'var(--pink-bg)',
                      color: newCategory === c.id ? 'white' : 'var(--text)',
                      fontWeight: 500, transition: 'all 0.2s',
                    }}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary" onClick={handleAdd} disabled={saving || !newTitle.trim()} style={{ marginTop: 12 }}>
              {saving ? '저장 중...' : '💫 위시 추가'}
            </button>
          </div>
        )}

        {/* Filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 8 }}>
          {[
            { id: 'all', label: '전체' },
            { id: 'todo', label: '🔲 남은' },
            { id: 'done', label: '✅ 완료' },
            ...CATEGORIES,
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '6px 14px', borderRadius: 16, fontSize: 12, whiteSpace: 'nowrap',
                background: filter === f.id ? 'var(--pink)' : 'var(--pink-bg)',
                color: filter === f.id ? 'white' : 'var(--text)',
                fontWeight: 500, flexShrink: 0,
              }}
            >
              {f.icon || ''} {f.label}
            </button>
          ))}
        </div>

        {/* Wish List */}
        {filteredWishes.map(w => {
          const cat = getCategoryInfo(w.category)
          return (
            <div
              key={w.id}
              className="card"
              style={{
                padding: '14px 16px', marginBottom: 8,
                opacity: w.done ? 0.7 : 1,
                background: w.done ? 'linear-gradient(135deg, #f1f8e9, #e8f5e9)' : 'white',
                transition: 'all 0.3s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => toggleDone(w)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: w.done ? '#4caf50' : 'var(--pink-bg)',
                    fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}
                >
                  {w.done ? '✅' : '⭕'}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600, fontSize: 15,
                    textDecoration: w.done ? 'line-through' : 'none',
                    color: w.done ? '#4caf50' : 'var(--text)',
                  }}>
                    {cat.icon} {w.title}
                  </div>
                  {w.note && (
                    <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>{w.note}</div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>
                    {w.done && w.doneDate ? `✨ ${w.doneDate} 달성!` : ''}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(w.id)}
                  style={{ background: 'none', fontSize: 14, color: 'var(--text-light)', flexShrink: 0 }}
                >
                  🗑
                </button>
              </div>
            </div>
          )
        })}

        {filteredWishes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌟</div>
            {filter === 'done' ? '아직 이룬 꿈이 없어요! 화이팅 💪' :
             filter === 'todo' ? '모든 위시를 이뤘어요! 🎉' :
             '같이 하고 싶은 것을 적어보세요!'}
          </div>
        )}
      </div>
    </div>
  )
}
