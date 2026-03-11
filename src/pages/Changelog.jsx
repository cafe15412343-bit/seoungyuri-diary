export default function Changelog() {
  const logs = [
    {
      version: 'v3.5',
      date: '2026.03.11',
      title: '대규모 업데이트! 🚀',
      items: [
        { type: 'new', text: '🎨 테마 8종 추가 (핑크/라벤더/민트/피치/오션/로즈/나이트/체리)' },
        { type: 'new', text: '✨ 배경 효과 6종 (없음/벚꽃/눈/하트/별/낙엽)' },
        { type: 'new', text: '🎯 위시리스트 — 같이 하고 싶은 것 리스트 + 카테고리 필터' },
        { type: 'new', text: '💌 타임캡슐 편지함 — 미래 날짜에 열리는 편지' },
        { type: 'new', text: '💰 데이트 가계부 — 지출 기록 + 월별 통계 + 자동 정산' },
        { type: 'new', text: '🔮 커플 운세 리뉴얼 — 별자리/띠 기반 매일 바뀌는 맞춤 운세' },
        { type: 'new', text: '💬 인사 메시지 귤이야/숭이야 호칭 추가 (35개)' },
        { type: 'improve', text: '📖 다이어리 → "우리의 기록"으로 변경' },
        { type: 'improve', text: '📖 하루 여러 글 작성 가능 + 밴드 스타일 피드' },
        { type: 'improve', text: '📷 사진 여러 장 첨부 + 미리보기 지원' },
        { type: 'improve', text: '💬 오늘의 한마디 수정 가능 + 기록 히스토리' },
        { type: 'fix', text: '👤 이름 설정 버그 수정 (서로 독립 저장)' },
        { type: 'fix', text: '💗 약속 하트 즉시 반영 + 다른 하트 눌리는 버그 수정' },
        { type: 'fix', text: '📷 사진 업로드 안 되는 문제 해결' },
        { type: 'fix', text: '📱 PC/모바일 데이터 동기화 (역할 선택 시스템)' },
      ],
    },
    {
      version: 'v2.0',
      date: '2026.03.10',
      title: '커플 다이어리 출시 🎉',
      items: [
        { type: 'new', text: '💕 D-Day 카운터 + 기념일 알림' },
        { type: 'new', text: '📔 다이어리 기능' },
        { type: 'new', text: '📋 커플 약속 체크리스트 + 스트릭' },
        { type: 'new', text: '🎰 랜덤 뽑기' },
        { type: 'new', text: '📅 캘린더' },
        { type: 'new', text: '💓 하트 보내기 + 접속 상태 표시' },
        { type: 'new', text: '🐾 동물 이모지 프로필' },
        { type: 'new', text: '📱 PWA 지원 (홈 화면 추가)' },
        { type: 'new', text: '🔗 커플 코드로 연결 + 다기기 접속' },
      ],
    },
  ]

  const typeStyle = {
    new: { bg: '#e8f5e9', color: '#2e7d32', label: 'NEW' },
    improve: { bg: '#e3f2fd', color: '#1565c0', label: '개선' },
    fix: { bg: '#fff3e0', color: '#e65100', label: '수정' },
  }

  return (
    <div className="fade-in">
      <div className="page-header">📋 업데이트 내역</div>
      <div style={{ padding: '0 20px' }}>
        {logs.map(log => (
          <div key={log.version} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span style={{
                  background: 'linear-gradient(135deg, var(--pink), var(--coral))',
                  color: 'white', padding: '4px 12px', borderRadius: 12,
                  fontSize: 13, fontWeight: 700, marginRight: 8,
                }}>
                  {log.version}
                </span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{log.title}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{log.date}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {log.items.map((item, i) => {
                const s = typeStyle[item.type]
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, lineHeight: 1.5 }}>
                    <span style={{
                      background: s.bg, color: s.color,
                      padding: '1px 8px', borderRadius: 8,
                      fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2,
                    }}>
                      {s.label}
                    </span>
                    <span>{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-light)', fontSize: 13 }}>
          Made with ❤️ by 숭이
        </div>
      </div>
    </div>
  )
}
