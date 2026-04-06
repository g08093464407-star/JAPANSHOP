export interface Product {
  id: string
  slug: string
  name: string
  price: number
  image: string
  images?: string[]
  description: string
  origin: string
  ingredients: string
  allergens: string
  shelfLife: string
  storage: string
  stockStatus: 'in-stock' | 'limited' | 'out-of-stock'
  category?: string
  tag?: string
}

export interface FAQItem {
  question: string
  answer: string
}
