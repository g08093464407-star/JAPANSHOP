'use client'

import { useEffect, useRef } from 'react'
import { trackViewItem } from '@/lib/analytics'

type ProductViewTrackerProps = {
  product: {
    id: string
    name: string
    price: number
    category?: string
  }
}

export default function ProductViewTracker({
  product,
}: ProductViewTrackerProps) {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current) return

    trackViewItem({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
    })

    trackedRef.current = true
  }, [product])

  return null
}