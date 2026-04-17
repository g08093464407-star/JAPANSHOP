'use client'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? ''

type AnalyticsItem = {
  item_id: string
  item_name: string
  price: number
  quantity?: number
  item_category?: string
}

type ProductAnalyticsPayload = {
  id: string
  name: string
  price: number
  category?: string
}

type CartAnalyticsPayload = {
  id: string
  name: string
  price: number
  quantity: number
  category?: string
}

type PurchaseAnalyticsPayload = {
  orderId: string
  currency: string
  total: number
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
    category?: string
  }>
}

function canTrack() {
  return typeof window !== 'undefined' && !!window.gtag && !!GA_MEASUREMENT_ID
}

function sendEvent(eventName: string, params: Record<string, unknown>) {
  if (!canTrack()) return
  window.gtag?.('event', eventName, params)
}

function toAnalyticsItem(item: {
  id: string
  name: string
  price: number
  quantity?: number
  category?: string
}): AnalyticsItem {
  return {
    item_id: item.id,
    item_name: item.name,
    price: item.price,
    quantity: item.quantity,
    item_category: item.category,
  }
}

export function trackViewItem(product: ProductAnalyticsPayload) {
  sendEvent('view_item', {
    currency: 'JPY',
    value: product.price,
    items: [toAnalyticsItem(product)],
  })
}

export function trackAddToCart(item: CartAnalyticsPayload) {
  sendEvent('add_to_cart', {
    currency: 'JPY',
    value: item.price * item.quantity,
    items: [toAnalyticsItem(item)],
  })
}

export function trackBeginCheckout(payload: {
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
    category?: string
  }>
  total: number
}) {
  sendEvent('begin_checkout', {
    currency: 'JPY',
    value: payload.total,
    items: payload.items.map((item) => toAnalyticsItem(item)),
  })
}

export function trackPurchase(order: PurchaseAnalyticsPayload) {
  sendEvent('purchase', {
    transaction_id: order.orderId,
    currency: order.currency,
    value: order.total,
    items: order.items.map((item) => toAnalyticsItem(item)),
  })
}