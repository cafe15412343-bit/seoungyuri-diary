// Seeded random based on date string
function seededRandom(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  }
  return () => {
    h = (h * 16807 + 12345) & 0x7fffffff
    return (h % 1000) / 1000
  }
}

export function getDailyFortune(dateStr) {
  const rand = seededRandom(dateStr + 'couple-fortune')

  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const score = () => Math.floor(rand() * 41) + 60 // 60~100

  const overallScore = score()
  const overallDescs = [
    '오늘은 서로에게 따뜻한 말 한마디가 큰 힘이 되는 날이에요 💕',
    '함께 있는 것만으로도 행복한 에너지가 가득한 하루예요 ✨',
    '작은 서프라이즈가 큰 감동을 줄 수 있는 날이에요 🎁',
    '서로의 이야기에 귀 기울이면 더 깊은 사랑을 느낄 수 있어요 💗',
    '오늘 하루 웃음이 끊이지 않을 거예요! 😊',
    '서로를 위한 작은 배려가 빛나는 날이에요 🌟',
    '함께 새로운 경험을 해보면 좋은 날이에요 🌈',
    '따뜻한 포옹 한 번이 모든 걸 해결해주는 날이에요 🤗',
    '서로에 대한 감사함을 느끼게 되는 특별한 하루예요 💖',
    '오늘은 추억을 만들기 딱 좋은 날이에요! 📸',
  ]

  const dateTags = ['🍽️ 맛집탐방', '🎬 영화관', '🚶 산책', '☕ 카페투어', '🏠 집데이트', '🎮 게임', '🛍️ 쇼핑', '🌳 공원', '📚 북카페', '🎨 전시회', '🎤 노래방', '🍰 베이킹']
  const dateDescs = [
    '오늘은 맛있는 걸 함께 먹으면 행복 지수가 최고! 🍽️',
    '편안한 분위기에서 함께 시간을 보내면 좋겠어요 ☕',
    '활동적인 데이트가 더 즐거운 하루를 만들어줄 거예요 🏃',
    '새로운 장소를 탐험하면 설렘이 가득할 거예요 ✨',
    '조용한 곳에서 둘만의 시간을 가져보세요 💕',
    '함께 웃을 수 있는 활동이 최고의 선택이에요 😄',
  ]

  const loveScore = score()
  const loveDescs = [
    '눈을 마주치면 심장이 쿵쾅거리는 날이에요 💓',
    '스킨십이 더 달콤하게 느껴지는 하루예요 🥰',
    '서로의 마음이 더 가까워지는 것을 느낄 수 있어요 💑',
    '사랑한다는 말이 더 특별하게 들리는 날이에요 💕',
    '함께 있는 순간들이 소중하게 느껴질 거예요 ✨',
    '서로에 대한 신뢰가 더 깊어지는 날이에요 🤝',
    '달달한 대화가 끊이지 않는 하루가 될 거예요 💬',
    '오늘은 서로에게 더 솔직해질 수 있는 날이에요 💖',
  ]

  const advices = [
    '오늘은 "사랑해" 한 번 더 말해보세요! 💕',
    '상대방이 좋아하는 간식을 사다주면 어떨까요? 🍫',
    '함께 찍은 사진을 공유해보세요 📸',
    '서로의 하루를 자세히 물어봐 주세요 💬',
    '손을 꼭 잡고 걸어보세요 🤝',
    '오늘의 감사한 점 3가지를 서로 말해보세요 🙏',
    '갑자기 포옹해보세요, 효과 만점! 🤗',
    '함께 요리해보는 건 어떨까요? 🍳',
    '서로에게 편지를 써보세요 ✉️',
    '오늘 하루 서로 칭찬 릴레이를 해보세요! 🌟',
    '커플 셀카를 찍어 추억으로 남겨보세요 📱',
    '상대방의 장점 5가지를 말해주세요 💗',
  ]

  return {
    overall: { score: overallScore, desc: pick(overallDescs) },
    date: { tag: pick(dateTags), desc: pick(dateDescs) },
    love: { score: loveScore, desc: pick(loveDescs) },
    advice: pick(advices),
  }
}

export const ZODIAC_INFO = {
  seungbin: { name: '승빈', zodiac: '♏ 전갈자리', animal: '🐰 토끼띠' },
  girlfriend: { zodiac: '♉ 황소자리', animal: '🐂 소띠' },
}
