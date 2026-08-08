export function istDateString(): string {
  const ist = new Date(Date.now() + (5.5 * 60 * 60 * 1000))
  return ist.toISOString().split('T')[0]
}

export function istTimeString(): string {
  const ist = new Date(Date.now() + (5.5 * 60 * 60 * 1000))
  return `${String(ist.getUTCHours()).padStart(2,'0')}:${String(ist.getUTCMinutes()).padStart(2,'0')}`
}
