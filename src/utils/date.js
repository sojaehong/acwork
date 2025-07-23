export function getTodayDateKST() {
  const now = new Date()
  const kstOffset = 9 * 60 * 60 * 1000 // UTC+9 (KST)
  const kst = new Date(now.getTime() + kstOffset)
  const result = kst.toISOString().split('T')[0]
  return result
}
