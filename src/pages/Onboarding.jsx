import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'

export default function Onboarding() {
  const { couple, generateCode, joinWithCode, loginWithCode } = useContext(AppContext)
  const [mode, setMode] = useState(null) // 'create' | 'join' | 'login'
  const [code, setCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const waitingForPartner = couple && couple.users.length < 2

  const handleCreate = async () => {
    setLoading(true)
    try {
      const c = await generateCode()
      setGeneratedCode(c)
      setMode('created')
    } catch (e) {
      setError('코드 생성에 실패했어요')
    }
    setLoading(false)
  }

  const handleJoin = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      await joinWithCode(code.trim())
      navigate('/')
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      await loginWithCode(code.trim())
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="fade-in" style={{ padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>💑</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>커플 다이어리</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: 40, lineHeight: 1.6 }}>
        둘만의 소중한 기록을 시작해요 ✨
      </p>

      {!mode && !waitingForPartner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn-primary" onClick={handleCreate} disabled={loading}>
            💌 초대 코드 만들기
          </button>
          <button className="btn-secondary" onClick={() => setMode('join')} style={{ width: '100%' }}>
            🔗 초대 코드 입력하기
          </button>
          <button
            onClick={() => setMode('login')}
            style={{ background: 'none', color: 'var(--text-light)', fontSize: 14, marginTop: 8 }}
          >
            📱 다른 기기에서 접속하기
          </button>
        </div>
      )}

      {(mode === 'created' || waitingForPartner) && (
        <div className="card fade-in">
          <p style={{ marginBottom: 12, fontWeight: 500 }}>상대방에게 이 코드를 보내주세요 💕</p>
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: 4,
            color: 'var(--pink)',
            padding: '16px 0',
            background: 'var(--pink-bg)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 12,
          }}>
            {generatedCode || couple?.code || '...'}
          </div>
          <button className="btn-secondary" onClick={() => {
            navigator.clipboard?.writeText(generatedCode || couple?.code || '')
          }} style={{ width: '100%' }}>
            📋 코드 복사
          </button>
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-light)' }}>
            상대방이 코드를 입력하면 자동으로 연결돼요 🥰
          </p>
        </div>
      )}

      {mode === 'join' && (
        <div className="card fade-in">
          <p style={{ marginBottom: 16, fontWeight: 500 }}>상대방에게 받은 코드를 입력해요</p>
          <input
            className="input-field"
            placeholder="초대 코드 6자리"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={{ textAlign: 'center', fontSize: 20, letterSpacing: 4, fontWeight: 700, marginBottom: 16 }}
          />
          <button className="btn-primary" onClick={handleJoin} disabled={loading || code.length < 6}>
            {loading ? '연결 중...' : '💕 연결하기'}
          </button>
          <button
            style={{ marginTop: 12, background: 'none', color: 'var(--text-light)', fontSize: 14 }}
            onClick={() => { setMode(null); setCode(''); setError('') }}
          >
            ← 돌아가기
          </button>
        </div>
      )}

      {mode === 'login' && (
        <div className="card fade-in">
          <p style={{ marginBottom: 8, fontWeight: 500 }}>📱 다른 기기에서 접속</p>
          <p style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-light)' }}>
            기존 커플 코드를 입력하면 같은 데이터에 접근할 수 있어요
          </p>
          <input
            className="input-field"
            placeholder="커플 코드 6자리"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={{ textAlign: 'center', fontSize: 20, letterSpacing: 4, fontWeight: 700, marginBottom: 16 }}
          />
          <button className="btn-primary" onClick={handleLogin} disabled={loading || code.length < 6}>
            {loading ? '접속 중...' : '🔑 접속하기'}
          </button>
          <button
            style={{ marginTop: 12, background: 'none', color: 'var(--text-light)', fontSize: 14 }}
            onClick={() => { setMode(null); setCode(''); setError('') }}
          >
            ← 돌아가기
          </button>
        </div>
      )}

      {error && <p style={{ color: '#e74c3c', marginTop: 16, fontSize: 14 }}>{error}</p>}
    </div>
  )
}
