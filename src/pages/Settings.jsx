import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../App'
import { db } from '../firebase'
import { doc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { defaultGreetings } from '../utils/greetings'
import { THEMES, EFFECTS, getSavedTheme, getSavedEffect, saveTheme, saveEffect } from '../utils/themes'

const ANIMALS = ['🐰','🐻','🐱','🐶','🐼','🦊','🐯','🐨','🐸','🐧','🦁','🐷','🐹','🐮','🐵','🦄','🐻‍❄️','🐺','🦋','🐝']

export default function Settings() {
  const { user, couple, coupleId, logout } = useContext(AppContext)
  const partnerUid = couple?.users?.find(u => u !== user.uid)

  const [startDate, setStartDate] = useState(couple?.startDate || '')
  const [myName, setMyName] = useState(couple?.userNames?.[user.uid]?.myName || couple?.names?.[user.uid] || '')
  const [partnerName, setPartnerName] = useState(couple?.userNames?.[user.uid]?.partnerName || (partnerUid ? couple?.names?.[partnerUid] : '') || '')
  const [myAnimal, setMyAnimal] = useState(couple?.animals?.[user.uid] || '')
  const [saved, setSaved] = useState(false)
  const [showAnimalPicker, setShowAnimalPicker] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(getSavedTheme)
  const [currentEffect, setCurrentEffect] = useState(getSavedEffect)

  // Custom greetings
  const [greetings, setGreetings] = useState([])
  const [showGreetings, setShowGreetings] = useState(false)
  const [newGreeting, setNewGreeting] = useState('')

  useEffect(() => {
    if (!coupleId) return
    const unsub = onSnapshot(doc(db, 'couples', coupleId, 'settings', 'greetings'), (snap) => {
      if (snap.exists() && snap.data().list?.length > 0) {
        setGreetings(snap.data().list)
      } else {
        setGreetings(defaultGreetings)
      }
    })
    return unsub
  }, [coupleId])

  const handleSave = async () => {
    const updates = {
      startDate,
      [`userNames.${user.uid}`]: {
        myName: myName.trim() || '나',
        partnerName: partnerName.trim() || '상대방',
      },
      [`names.${user.uid}`]: myName.trim() || '나',
      [`animals.${user.uid}`]: myAnimal,
    }
    // Also update partner's name in the old names map if partnerUid exists
    if (partnerUid) {
      updates[`names.${partnerUid}`] = partnerName.trim() || '상대방'
    }
    await updateDoc(doc(db, 'couples', coupleId), updates)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const saveGreetings = async (list) => {
    setGreetings(list)
    await setDoc(doc(db, 'couples', coupleId, 'settings', 'greetings'), { list })
  }

  const addGreeting = () => {
    if (!newGreeting.trim()) return
    saveGreetings([...greetings, newGreeting.trim()])
    setNewGreeting('')
  }

  const removeGreeting = (idx) => {
    saveGreetings(greetings.filter((_, i) => i !== idx))
  }

  return (
    <div className="fade-in">
      <div className="page-header">⚙️ 설정</div>
      <div style={{ padding: '0 20px' }}>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>💕 커플 정보</div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6, display: 'block' }}>만난 날</label>
            <input
              type="date"
              className="input-field"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6, display: 'block' }}>내 이름</label>
            <input
              className="input-field"
              placeholder="내 이름"
              value={myName}
              onChange={e => setMyName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6, display: 'block' }}>상대방 이름</label>
            <input
              className="input-field"
              placeholder="상대방 이름"
              value={partnerName}
              onChange={e => setPartnerName(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={handleSave}>
            {saved ? '✅ 저장되었어요!' : '💾 저장하기'}
          </button>
        </div>

        {/* Animal Emoji Picker */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>🐾 내 동물 이모지</div>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 48 }}>{myAnimal || '❓'}</span>
          </div>
          <button
            className="btn-secondary"
            onClick={() => setShowAnimalPicker(!showAnimalPicker)}
            style={{ width: '100%', marginBottom: showAnimalPicker ? 12 : 0 }}
          >
            {showAnimalPicker ? '닫기' : '동물 선택하기 🐾'}
          </button>
          {showAnimalPicker && (
            <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {ANIMALS.map(a => (
                <button
                  key={a}
                  onClick={() => { setMyAnimal(a); setShowAnimalPicker(false) }}
                  style={{
                    fontSize: 32,
                    padding: 8,
                    background: myAnimal === a ? 'var(--pink-bg)' : 'transparent',
                    borderRadius: 12,
                    border: myAnimal === a ? '2px solid var(--pink)' : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
          {myAnimal && (
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 8, textAlign: 'center' }}>
              위의 저장하기 버튼을 눌러야 반영돼요!
            </p>
          )}
        </div>

        {/* Custom Greetings */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>💬 인사 메시지 관리</span>
            <button
              onClick={() => setShowGreetings(!showGreetings)}
              style={{ fontSize: 13, background: 'var(--pink-bg)', color: 'var(--pink)', padding: '6px 14px', borderRadius: 15, fontWeight: 500 }}
            >
              {showGreetings ? '닫기' : '편집'}
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 8 }}>
            홈 화면에 랜덤으로 표시되는 인사 메시지 ({greetings.length}개)
          </p>
          {showGreetings && (
            <div className="fade-in">
              <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                {greetings.map((g, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--pink-bg)', fontSize: 14 }}>
                    <span>{g}</span>
                    <button onClick={() => removeGreeting(i)} style={{ background: 'none', fontSize: 12, color: '#e74c3c' }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input-field"
                  placeholder="새 인사 메시지"
                  value={newGreeting}
                  onChange={e => setNewGreeting(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn-primary" onClick={addGreeting} style={{ width: 'auto', padding: '12px 20px' }}>+</button>
              </div>
            </div>
          )}
        </div>

        {/* Theme */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>🎨 테마 색상</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => { setCurrentTheme(t.id); saveTheme(t.id) }}
                style={{
                  padding: '10px 4px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                  background: currentTheme === t.id ? t.colors['--pink'] : 'var(--pink-bg)',
                  color: currentTheme === t.id ? 'white' : 'var(--text)',
                  border: currentTheme === t.id ? 'none' : `2px solid ${t.colors['--pink']}40`,
                  transition: 'all 0.2s',
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Effects */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>✨ 배경 효과</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {EFFECTS.map(e => (
              <button
                key={e.id}
                onClick={() => { setCurrentEffect(e.id); saveEffect(e.id) }}
                style={{
                  padding: '12px 8px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                  background: currentEffect === e.id ? 'linear-gradient(135deg, var(--pink), var(--coral))' : 'var(--pink-bg)',
                  color: currentEffect === e.id ? 'white' : 'var(--text)',
                  transition: 'all 0.2s',
                }}
              >
                {e.icon} {e.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>📋 커플 코드</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--pink)', letterSpacing: 3, textAlign: 'center', padding: 12, background: 'var(--pink-bg)', borderRadius: 'var(--radius-sm)' }}>
            {couple?.code || '???'}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 8, textAlign: 'center' }}>
            이미 연결된 커플이에요 💑
          </p>
        </div>

        <div className="card">
          <button
            onClick={() => { if (confirm('로그아웃하면 이 기기에서 커플 데이터 연결이 해제됩니다. 코드만 있으면 다시 접속할 수 있어요.')) logout() }}
            style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500 }}
          >
            🔓 이 기기에서 로그아웃
          </button>
        </div>

        <div className="card" style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: 13 }}>
          커플 다이어리 v2.0 🌸<br />
          Made with ❤️
        </div>
      </div>
    </div>
  )
}
