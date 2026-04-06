'use client'

import { createContext, useContext } from 'react'
import type { CartItem } from '@/types/cart'

interface AddToCartInput {
  id: string
  slug: string
  name: string
  price: number
  image: string
  stockStatus: 'in-stock' | 'limited' | 'out-of-stock'
}

interface CartContextValue {
  items: CartItem[]
  cartCount: number
  cartTotal: number
  lastAddedAt: number
  addItem: (item: AddToCartInput) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return context
}
