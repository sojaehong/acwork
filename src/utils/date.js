export function getTodayDateKST() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  const kst = new Date(now.getTime() - offset)
  const result = kst.toISOString().split('T')[0]
  return result
}
