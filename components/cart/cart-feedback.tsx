'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'

export default function CartFeedback() {
  const { lastAddedAt, cartCount } = useCart()

  const [visible, setVisible] = useState(false)
  const previous = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (previous.current === null) {
      previous.current = lastAddedAt
      return
    }

    if (!lastAddedAt || previous.current === lastAddedAt) return

    previous.current = lastAddedAt
    setVisible(true)

    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }

    timerRef.current = window.setTimeout(() => {
      setVisible(false)
    }, 2600)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [lastAddedAt])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <div className="flex items-center gap-4 rounded-2xl bg-foreground px-5 py-4 text-background shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5" />
          <span className="text-sm font-medium">
            カートに追加しました
          </span>
        </div>

        <Link
          href="/cart"
          className="rounded-lg bg-background/10 px-3 py-1 text-xs font-medium hover:bg-background/20 transition"
        >
          カートを見る ({cartCount})
        </Link>
      </div>
    </div>
  )
}