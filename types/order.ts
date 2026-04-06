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
}

export type PaidOrder = {
  id: string
  stripeSessionId: string
  stripePaymentIntentId: string | null
  stripeReceiptUrl: string | null
  currency: string
  total: number
  paymentStatus: "paid"
  customer: CustomerInfo
  items: OrderItem[]
  createdAt: string
}