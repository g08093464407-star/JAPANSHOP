'use client'

import { useEffect } from 'react'

type ProductViewHistoryProps = {
  productId: string
}

const STORAGE_KEY = 'sonyachna_recently_viewed_products'
const MAX_ITEMS = 8

export default function ProductViewHistory({
  productId,
}: ProductViewHistoryProps) {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const existing = raw ? (JSON.parse(raw) as string[]) : []

      const next = [productId, ...existing.filter((id) => id !== productId)].slice(
        0,
        MAX_ITEMS
      )

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // localStorage may be unavailable
    }
  }, [productId])

  return null
}