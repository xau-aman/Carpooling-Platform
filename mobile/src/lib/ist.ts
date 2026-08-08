// Returns current IST date as YYYY-MM-DD string
export function istDateString(): string {
  const now = new Date()
  // IST = UTC + 5:30
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
  return ist.toISOString().split('T')[0]
}

// Returns current IST time as HH:MM string
export function istTimeString(): string {
  const now = new Date()
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
  const h = String(ist.getUTCHours()).padStart(2, '0')
  const m = String(ist.getUTCMinutes()).padStart(2, '0')
  return `${h}:${m}`
}
