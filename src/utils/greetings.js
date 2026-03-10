export const defaultGreetings = [
  "오늘도 사랑해 💕",
  "자기야 좋은 하루!",
  "보고싶었어 🥰",
  "오늘 뭐했어?",
  "항상 고마워 ❤️",
  "오늘도 예쁘다 🌸",
  "밥은 먹었어? 🍚",
  "오늘 하루도 파이팅! 💪",
  "자기 생각하고 있었어 💭",
  "같이 있으면 행복해 😊",
  "우리 오늘 뭐 먹을까? 🍽️",
  "좋은 꿈 꿨어? 🌙",
  "자기가 제일 좋아 🥇",
  "오늘도 수고했어 ☺️",
  "빨리 보고 싶다 🏃",
  "자기야 사랑해 💗",
  "우리 만난 건 운명이야 ✨",
  "자기 덕분에 행복해 🌈",
  "세상에서 자기가 제일 소중해 💎",
  "영원히 함께하자 💍",
  "자기 미소가 최고야 😍",
  "오늘도 자기 생각뿐이야 🫠",
  "자기야 화이팅! 🔥",
  "우리 주말에 뭐 할까? 🎉",
  "자기랑 있으면 시간이 너무 빨라 ⏰",
]

export function getRandomGreeting(customGreetings = []) {
  const all = customGreetings.length > 0 ? customGreetings : defaultGreetings
  return all[Math.floor(Math.random() * all.length)]
}
