import { useState, useEffect, useContext, useRef } from 'react'
import { AppContext } from '../App'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

const defaultItems = [
  { emoji: '🍗', name: '치킨' },
  { emoji: '🍕', name: '피자' },
  { emoji: '🥡', name: '중식' },
  { emoji: '🍚', name: '한식' },
  { emoji: '🍣', name: '일식' },
  { emoji: '🍜', name: '분식' },
  { emoji: '☕', name: '카페' },
  { emoji: '🍔', name: '버거' },
  { emoji: '🥘', name: '찌개' },
  { emoji: '🌮', name: '멕시칸' },
  { emoji: '🥗', name: '샐러드' },
  { emoji: '🍝', name: '파스타' },
  { emoji: '🍛', name: '카레' },
  { emoji: '🥐', name: '베이커리' },
  { emoji: '🧇', name: '브런치' },
  { emoji: '🍱', name: '도시락' },
]

export default function RandomPick() {
  const { coupleId } = useContext(AppContext)
  const [items, setItems] = useState(defaultItems)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [showManage, setShowManage] = useState(false)
  const [newItem, setNewItem] = useState({ emoji: '🍴', name: '' })
  const [showEffect, setShowEffect] = useState(false)
  const spinRef = useRef(null)
  const [displayIdx, setDisplayIdx] = useState(0)

  useEffect(() => {
    if (!coupleId) return
    const unsub = onSnapshot(doc(db, 'couples', coupleId, 'settings', 'randomPick'), (snap) => {
      if (snap.exists() && snap.data().items?.length > 0) {
        setItems(snap.data().items)
      }
    })
    return unsub
  }, [coupleId])

  const saveItems = async (newItems) => {
    setItems(newItems)
    await setDoc(doc(db, 'couples', coupleId, 'settings', 'randomPick'), { items: newItems })
  }

  const spin = () => {
    if (spinning || items.length === 0) return
    setSpinning(true)
    setResult(null)
    setShowEffect(false)

    let count = 0
    const total = 20 + Math.floor(Math.random() * 10)
    
    spinRef.current = setInterval(() => {
      setDisplayIdx(Math.floor(Math.random() * items.length))
      count++
      if (count >= total) {
        clearInterval(spinRef.current)
        const winner = items[Math.floor(Math.random() * items.length)]
        setResult(winner)
        setSpinning(false)
        setShowEffect(true)
        setTimeout(() => setShowEffect(false), 2000)
      }
    }, 80 + count * 5)
  }

  const addItem = () => {
    if (!newItem.name.trim()) return
    saveItems([...items, { emoji: newItem.emoji, name: newItem.name.trim() }])
    setNewItem({ emoji: '🍴', name: '' })
  }

  const removeItem = (idx) => {
    saveItems(items.filter((_, i) => i !== idx))
  }

  return (
    <div className="fade-in">
      <div className="page-header">🎰 오늘 뭐 먹지?</div>
      <div style={{ padding: '0 20px' }}>
        {/* Slot machine display */}
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{
            fontSize: 64,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
            transition: 'transform 0.1s',
            transform: spinning ? 'scale(1.1)' : 'scale(1)',
          }}>
            {result ? result.emoji : (spinning ? items[displayIdx]?.emoji : '🎰')}
          </div>
          <div style={{
            fontSize: result ? 28 : 20,
            fontWeight: 700,
            color: result ? 'var(--pink)' : 'var(--text)',
            marginBottom: 20,
            minHeight: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {result ? result.name : (spinning ? items[displayIdx]?.name : '뽑기를 돌려보세요!')}
          </div>
          
          {result && (
            <div className="fade-in" style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 16 }}>
              오늘은 {result.name} 먹자! 🎉
            </div>
          )}

          <button
            className="btn-primary"
            onClick={spin}
            disabled={spinning}
            style={{
              fontSize: 18,
              padding: '16px 32px',
              transform: spinning ? 'scale(0.95)' : 'scale(1)',
            }}
          >
            {spinning ? '🎰 돌리는 중...' : '🎰 뽑기!'}
          </button>
        </div>

        {/* Item list */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>📋 후보 목록</span>
            <button
              onClick={() => setShowManage(!showManage)}
              style={{ fontSize: 13, background: 'var(--pink-bg)', color: 'var(--pink)', padding: '6px 14px', borderRadius: 15, fontWeight: 500 }}
            >
              {showManage ? '완료' : '편집'}
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {items.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                background: 'var(--pink-bg)',
                borderRadius: 20,
                fontSize: 14,
              }}>
                <span>{item.emoji}</span>
                <span>{item.name}</span>
                {showManage && (
                  <button onClick={() => removeItem(i)} style={{ background: 'none', fontSize: 12, color: '#e74c3c', marginLeft: 4 }}>✕</button>
                )}
              </div>
            ))}
          </div>

          {showManage && (
            <div className="fade-in" style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <input
                className="input-field"
                placeholder="이모지"
                value={newItem.emoji}
                onChange={e => setNewItem({ ...newItem, emoji: e.target.value })}
                style={{ width: 60, textAlign: 'center' }}
              />
              <input
                className="input-field"
                placeholder="메뉴 이름"
                value={newItem.name}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                style={{ flex: 1 }}
              />
              <button className="btn-primary" onClick={addItem} style={{ width: 'auto', padding: '12px 20px' }}>+</button>
            </div>
          )}
        </div>

        {/* Effect overlay */}
        {showEffect && (
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999 }}>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="confetti" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                fontSize: 16 + Math.random() * 16,
              }}>
                {['🎉', '🎊', '✨', '⭐', '🌟'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
