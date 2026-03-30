export const formatDate = (d) => {
  const date = new Date(d)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

export const getDaysDiff = (from, to = new Date()) => {
  const a = new Date(from)
  const b = new Date(to)
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  return Math.floor((b - a) / (1000 * 60 * 60 * 24))
}

export const getAnniversaries = (startDate) => {
  if (!startDate) return []
  const start = new Date(startDate)
  const now = new Date()
  const results = []

  // D+100, 200, 300, ...
  for (let d = 100; d <= 10000; d += 100) {
    const date = new Date(start)
    date.setDate(date.getDate() + d)
    const diff = getDaysDiff(now, date)
    if (diff >= -7 && diff <= 30) {
      results.push({ label: `${d}일`, date, daysLeft: diff })
    }
  }

  // Yearly anniversaries
  for (let y = 1; y <= 50; y++) {
    const date = new Date(start)
    date.setFullYear(date.getFullYear() + y)
    const diff = getDaysDiff(now, date)
    if (diff >= -7 && diff <= 30) {
      results.push({ label: `${y}주년`, date, daysLeft: diff })
    }
  }

  // Monthly (for first year)
  const daysDiff = getDaysDiff(start, now)
  if (daysDiff < 365) {
    for (let m = 1; m <= 12; m++) {
      const date = new Date(start)
      date.setMonth(date.getMonth() + m)
      const diff = getDaysDiff(now, date)
      if (diff >= -3 && diff <= 14) {
        results.push({ label: `${m}개월`, date, daysLeft: diff })
      }
    }
  }

  return results.sort((a, b) => a.daysLeft - b.daysLeft)
}

export const toDateString = (d = new Date()) => {
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const fileToBase64 = (file) => new Promise((resolve) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.readAsDataURL(file)
})
