export const THEMES = [
  {
    id: 'pink',
    name: '🌸 핑크',
    colors: {
      '--pink': '#FF6B8A',
      '--pink-light': '#FFB4C8',
      '--pink-bg': '#FFF0F3',
      '--coral': '#FF8A80',
      '--warm-white': '#FFFAF7',
      '--text': '#4A3B3B',
      '--text-light': '#8B7E7E',
    },
  },
  {
    id: 'lavender',
    name: '💜 라벤더',
    colors: {
      '--pink': '#9C77DB',
      '--pink-light': '#C9B1F0',
      '--pink-bg': '#F3EEFF',
      '--coral': '#B088E8',
      '--warm-white': '#FAF8FF',
      '--text': '#3B3450',
      '--text-light': '#7E7694',
    },
  },
  {
    id: 'mint',
    name: '🍃 민트',
    colors: {
      '--pink': '#4ECDC4',
      '--pink-light': '#A8E6CF',
      '--pink-bg': '#F0FFF8',
      '--coral': '#6BD4CB',
      '--warm-white': '#F7FFFC',
      '--text': '#2C4A42',
      '--text-light': '#6B8F84',
    },
  },
  {
    id: 'peach',
    name: '🍑 피치',
    colors: {
      '--pink': '#FF9A76',
      '--pink-light': '#FFCDB2',
      '--pink-bg': '#FFF5EE',
      '--coral': '#FFB89A',
      '--warm-white': '#FFFBF7',
      '--text': '#5A3E32',
      '--text-light': '#9B7E70',
    },
  },
  {
    id: 'ocean',
    name: '🌊 오션',
    colors: {
      '--pink': '#5B9BD5',
      '--pink-light': '#A8C8E8',
      '--pink-bg': '#EEF5FF',
      '--coral': '#7DB3E0',
      '--warm-white': '#F5F9FF',
      '--text': '#2C3E50',
      '--text-light': '#6B85A0',
    },
  },
  {
    id: 'rose',
    name: '🌹 로즈',
    colors: {
      '--pink': '#E74C7A',
      '--pink-light': '#F4A0B9',
      '--pink-bg': '#FFF0F5',
      '--coral': '#EF6F92',
      '--warm-white': '#FFFAFC',
      '--text': '#4A2030',
      '--text-light': '#8B6070',
    },
  },
  {
    id: 'night',
    name: '🌙 나이트',
    colors: {
      '--pink': '#FFB4C8',
      '--pink-light': '#553344',
      '--pink-bg': '#2A1A2A',
      '--coral': '#FF8A80',
      '--warm-white': '#1A1020',
      '--text': '#F0E0F0',
      '--text-light': '#A090A0',
    },
  },
  {
    id: 'cherry',
    name: '🍒 체리',
    colors: {
      '--pink': '#DC143C',
      '--pink-light': '#FF6B81',
      '--pink-bg': '#FFF0F2',
      '--coral': '#E8475F',
      '--warm-white': '#FFFAFA',
      '--text': '#4A1020',
      '--text-light': '#8B5060',
    },
  },
]

const THEME_KEY = 'couple-diary-theme'
const EFFECT_KEY = 'couple-diary-effect'

export function getSavedTheme() {
  return localStorage.getItem(THEME_KEY) || 'pink'
}

export function getSavedEffect() {
  return localStorage.getItem(EFFECT_KEY) || 'none'
}

export function saveTheme(themeId) {
  localStorage.setItem(THEME_KEY, themeId)
  applyTheme(themeId)
}

export function saveEffect(effect) {
  localStorage.setItem(EFFECT_KEY, effect)
}

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const root = document.documentElement
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}

export const EFFECTS = [
  { id: 'none', name: '없음', icon: '✕' },
  { id: 'cherry', name: '벚꽃', icon: '🌸' },
  { id: 'snow', name: '눈', icon: '❄️' },
  { id: 'hearts', name: '하트', icon: '💕' },
  { id: 'stars', name: '별', icon: '⭐' },
  { id: 'leaves', name: '낙엽', icon: '🍂' },
]
