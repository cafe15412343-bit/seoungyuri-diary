import { useState, useContext } from 'react'
import { AppContext } from '../App'
import { db } from '../firebase'
import { doc, updateDoc } from 'firebase/firestore'

export default function Settings() {
  const { user, couple, coupleId } = useContext(AppContext)
  const partnerUid = couple?.users?.find(u => u !== user.uid)

  const [startDate, setStartDate] = useState(couple?.startDate || '')
  const [myName, setMyName] = useState(couple?.names?.[user.uid] || '')
  const [partnerName, setPartnerName] = useState(couple?.names?.[partnerUid] || '')
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    const updates = {
      startDate,
      [`names.${user.uid}`]: myName.trim() || '나',
      [`names.${partnerUid}`]: partnerName.trim() || '상대방',
    }
    await updateDoc(doc(db, 'couples', coupleId), updates)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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

        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>📋 커플 코드</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--pink)', letterSpacing: 3, textAlign: 'center', padding: 12, background: 'var(--pink-bg)', borderRadius: 'var(--radius-sm)' }}>
            {couple?.code || '???'}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 8, textAlign: 'center' }}>
            이미 연결된 커플이에요 💑
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: 13 }}>
          커플 다이어리 v1.0 💕<br />
          Made with ❤️
        </div>
      </div>
    </div>
  )
}
