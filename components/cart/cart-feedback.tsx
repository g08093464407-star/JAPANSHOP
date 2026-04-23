'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
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
    }, 1800)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [lastAddedAt])

  return (
    <div
      className={`pointer-events-none fixed bottom-6 left-6 z-[80] transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      aria-live="polite"
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-[linear-gradient(135deg,rgba(240,253,244,0.98)_0%,rgba(236,253,245,0.98)_45%,rgba(220,252,231,0.98)_100%)] px-4 py-3 text-emerald-950 shadow-[0_18px_40px_rgba(16,24,40,0.10)] backdrop-blur-md">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <span className="text-sm font-medium">追加しました</span>

        <Link
          href="/cart"
          className="rounded-lg border border-emerald-300/70 bg-white/75 px-3 py-1.5 text-xs font-medium text-emerald-900 transition-all duration-300 hover:bg-white hover:shadow-sm"
        >
          カート ({cartCount})
        </Link>
      </div>
    </div>
  )
}