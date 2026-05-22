export type CustomerInfo = {
  fullName: string
  email: string
  postalCode: string
  prefecture: string
  city: string
  addressLine1: string
  addressLine2?: string
}

export type OrderItem = {
  id: string
  slug: string
  name: string
  price: number
  image: string
  quantity: number
  lengthCm?: number | null
  widthCm?: number | null
  heightCm?: number | null
  volumeCm3?: number | null
  weightGrams?: number | null
}

export type OrderShippingSnapshot = {
  carrier: string
  service: string
  originPrefecture: string
  destinationPrefecture: string
  zone: string
  shippingSize: number
  boxType: number | null
  boxLabel: string
  boxInnerVolumeCm3: number | null
  boxUsableVolumeCm3: number | null
  totalVolumeCm3: number | null
  remainingVolumeCm3: number | null
  fillPercent: number | null
  totalWeightGrams: number | null
}

export type PaidOrder = {
  id: string // public order number: SYN-...
  internalOrderId: string | null // UUID from Postgres
  stripeSessionId: string
  stripePaymentIntentId: string | null
  stripeReceiptUrl: string | null
  currency: string
  total: number
  itemsSubtotal: number
  shippingAmount: number
  shippingSnapshot?: OrderShippingSnapshot | null
  paymentStatus: "paid"
  customer: CustomerInfo
  items: OrderItem[]
  createdAt: string
}
