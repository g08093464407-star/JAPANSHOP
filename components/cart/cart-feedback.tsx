'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { cn } from '@/lib/utils'

export default function CartFeedback() {
  const { lastAddedAt, cartCount } = useCart()

  const [visible, setVisible] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  const previous = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (previous.current === null) {
      previous.current = lastAddedAt
      return
    }

    if (!lastAddedAt || previous.current === lastAddedAt) return

    previous.current = lastAddedAt
    setBurstKey((current) => current + 1)
    setVisible(true)

    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }

    timerRef.current = window.setTimeout(() => {
      setVisible(false)
    }, 1650)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [lastAddedAt])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-[120] flex items-center justify-center px-6 transition-all duration-300 ease-out',
        visible ? 'opacity-100' : 'opacity-0'
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        key={burstKey}
        className={cn(
          'flex flex-col items-center justify-center transition-all duration-500 ease-out',
          visible ? 'translate-y-0 scale-100' : 'translate-y-3 scale-95'
        )}
      >
        <div className="relative flex h-[136px] w-[136px] items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-emerald-300/30 blur-2xl" />
          <span className="absolute inset-[10px] rounded-full border border-emerald-300/60 animate-[cartFeedbackPulse_1.1s_ease-out]" />
          <span className="absolute inset-[22px] rounded-full border border-emerald-200/70 animate-[cartFeedbackPulse_1.1s_ease-out_120ms]" />

          <div className="relative flex h-[104px] w-[104px] items-center justify-center rounded-full border border-emerald-200/90 bg-[linear-gradient(145deg,rgba(242,253,246,0.98)_0%,rgba(214,250,224,0.98)_55%,rgba(170,240,190,0.96)_100%)] text-emerald-950 shadow-[0_24px_60px_rgba(16,24,40,0.18)]">
            <Check className="h-10 w-10 animate-[cartFeedbackCheck_520ms_cubic-bezier(0.2,0.9,0.25,1)_both]" strokeWidth={2.8} />

            <span className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white text-emerald-700 shadow-[0_10px_24px_rgba(16,24,40,0.16)] animate-[cartFeedbackBadge_560ms_cubic-bezier(0.2,0.9,0.25,1)_both_120ms]">
              <ShoppingBag className="h-4.5 w-4.5" strokeWidth={2.2} />
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/80 bg-white/88 px-5 py-3 text-center shadow-[0_20px_50px_rgba(16,24,40,0.10)] backdrop-blur-md">
          <p className="text-sm font-semibold text-neutral-950">カートに追加しました</p>
          <p className="mt-1 text-xs text-neutral-600">現在 {cartCount} 点の商品が入っています</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes cartFeedbackPulse {
          0% {
            opacity: 0;
            transform: scale(0.68);
          }
          45% {
            opacity: 0.85;
          }
          100% {
            opacity: 0;
            transform: scale(1.18);
          }
        }

        @keyframes cartFeedbackCheck {
          0% {
            opacity: 0;
            transform: scale(0.4) rotate(-10deg);
          }
          65% {
            opacity: 1;
            transform: scale(1.12) rotate(0deg);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes cartFeedbackBadge {
          0% {
            opacity: 0;
            transform: scale(0.3) translate(10px, 10px);
          }
          70% {
            opacity: 1;
            transform: scale(1.08) translate(0, 0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translate(0, 0);
          }
        }
      `}</style>
    </div>
  )
}
