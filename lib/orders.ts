export type Order = {
  id: string
  items: any[]
  total: number
  customer: {
    fullName: string
    email: string
    postalCode: string
    prefecture: string
    city: string
    addressLine1: string
    addressLine2?: string
  }
  createdAt: string
}

const ORDERS_STORAGE_KEY = "sonyachna_orders"
const LAST_ORDER_STORAGE_KEY = "sonyachna_last_order"

function isBrowser() {
  return typeof window !== "undefined"
}

export function getOrders(): Order[] {
  if (!isBrowser()) return []

  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) return []

    return parsed
  } catch {
    return []
  }
}

export function saveOrder(order: Order) {
  if (!isBrowser()) return

  const existing = getOrders()
  const next = [order, ...existing]

  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(next))
  window.localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(order))
}

export function getLastOrder(): Order | null {
  if (!isBrowser()) return null

  try {
    const raw = window.localStorage.getItem(LAST_ORDER_STORAGE_KEY)
    if (!raw) return null

    return JSON.parse(raw) as Order
  } catch {
    return null
  }
}

export function clearLastOrder() {
  if (!isBrowser()) return
  window.localStorage.removeItem(LAST_ORDER_STORAGE_KEY)
}

export function createOrderId() {
  const now = new Date()
  const datePart = now
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14)

  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase()

  return `SYN-${datePart}-${randomPart}`
}
