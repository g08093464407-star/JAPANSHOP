'use client'

import { useEffect, useMemo, useState } from 'react'
import { CartContext } from '@/hooks/use-cart'
import type { CartItem } from '@/types/cart'

const CART_STORAGE_KEY = 'sonyachna-cart'

interface AddToCartInput {
  id: string
  slug: string
  name: string
  price: number
  image: string
  stockStatus: 'in-stock' | 'limited' | 'out-of-stock'
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [lastAddedAt, setLastAddedAt] = useState(0)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)

      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[]
        setItems(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error)
      setItems([])
    } finally {
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error)
    }
  }, [items, isHydrated])

  const addItem = (item: AddToCartInput) => {
    if (item.stockStatus === 'out-of-stock') return

    setItems((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id)

      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }

      return [
        ...prev,
        {
          ...item,
          quantity: 1,
        },
      ]
    })

    setLastAddedAt(Date.now())
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear cart from localStorage:', error)
    }

    setItems([])
  }

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        cartTotal,
        lastAddedAt,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}