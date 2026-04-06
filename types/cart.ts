export interface CartItem {
  id: string
  slug: string
  name: string
  price: number
  image: string
  quantity: number
  stockStatus: 'in-stock' | 'limited' | 'out-of-stock'
}
