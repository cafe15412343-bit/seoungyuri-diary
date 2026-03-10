export function getDday(startDate) {
  if (!startDate) return null
  const start = new Date(startDate)
  const now = new Date()
  start.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return diff + 1 // D+1 from first day
}

export function getUpcomingAnniversaries(startDate) {
  if (!startDate) return []
  const start = new Date(startDate)
  const now = new Date()
  start.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)

  const results = []
  const dayDiff = Math.floor((now - start) / (1000 * 60 * 60 * 24))

  // D+100, 200, 300, ...
  for (let d = 100; d <= 10000; d += 100) {
    if (d > dayDiff) {
      const date = new Date(start)
      date.setDate(date.getDate() + d - 1)
      const daysLeft = Math.floor((date - now) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 100) {
        results.push({ label: `${d}일`, date, daysLeft })
      }
      if (results.length >= 2) break
    }
  }

  // Yearly anniversaries
  for (let y = 1; y <= 50; y++) {
    const anniv = new Date(start)
    anniv.setFullYear(anniv.getFullYear() + y)
    const daysLeft = Math.floor((anniv - now) / (1000 * 60 * 60 * 24))
    if (daysLeft > 0 && daysLeft <= 365) {
      results.push({ label: `${y}주년 💕`, date: anniv, daysLeft })
    }
  }

  return results.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 3)
}

export function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}
