export function createOrderId() {
  const now = new Date()
  const datePart = now
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14)

  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase()

  return `SYN-${datePart}-${randomPart}`
}
