'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Coins, Heart, Leaf, Sprout } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { cn } from '@/lib/utils'

const DONATION_RATE = 0.05
const VISUAL_FULL_AMOUNT = 2500

function formatYen(value: number) {
  return `¥${Math.max(0, Math.floor(value)).toLocaleString('ja-JP')}`
}

function RollingDigit({ char, index, pulseKey }: { char: string; index: number; pulseKey: number }) {
  if (!/\d/.test(char)) {
    return <span className="inline-flex w-[0.55em] justify-center">{char}</span>
  }

  return (
    <span className="relative inline-flex h-[1.18em] w-[0.62em] overflow-hidden align-[-0.08em]">
      <span
        key={`${pulseKey}-${index}-${char}`}
        className="absolute left-0 top-0 inline-flex w-full animate-[donationDigitRoll_560ms_cubic-bezier(0.16,1,0.3,1)] flex-col items-center"
      >
        <span className="h-[1.18em] opacity-0">{char}</span>
        <span className="h-[1.18em]">{char}</span>
      </span>
    </span>
  )
}

function RollingAmount({ amount, pulseKey }: { amount: number; pulseKey: number }) {
  const formatted = formatYen(amount)

  return (
    <span className="font-serif text-[26px] font-semibold leading-none tracking-tight text-neutral-950">
      {formatted.split('').map((char, index) => (
        <RollingDigit key={`${index}-${char}`} char={char} index={index} pulseKey={pulseKey} />
      ))}
    </span>
  )
}

export default function DonationJar() {
  const { cartCount, cartTotal, lastAddedAt } = useCart()
  const pathname = usePathname()

  const [pulseKey, setPulseKey] = useState(0)
  const [isPulsing, setIsPulsing] = useState(false)
  const [coinBurstKey, setCoinBurstKey] = useState(0)

  const previousLastAddedAt = useRef<number | null>(null)
  const pulseTimerRef = useRef<number | null>(null)

  const shouldHide = useMemo(() => {
    if (!pathname) return false
    return (
      pathname.startsWith('/cart') ||
      pathname.startsWith('/checkout') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/orders')
    )
  }, [pathname])

  const projectedDonation = useMemo(() => {
    return Math.floor(cartTotal * DONATION_RATE)
  }, [cartTotal])

  const fillLevel = useMemo(() => {
    if (projectedDonation <= 0) return 8
    return Math.min(92, Math.max(16, Math.round((projectedDonation / VISUAL_FULL_AMOUNT) * 100)))
  }, [projectedDonation])

  useEffect(() => {
    if (previousLastAddedAt.current === null) {
      previousLastAddedAt.current = lastAddedAt
      return
    }

    if (!lastAddedAt || previousLastAddedAt.current === lastAddedAt) return

    previousLastAddedAt.current = lastAddedAt
    setPulseKey((current) => current + 1)
    setCoinBurstKey((current) => current + 1)
    setIsPulsing(true)

    if (pulseTimerRef.current) {
      window.clearTimeout(pulseTimerRef.current)
    }

    pulseTimerRef.current = window.setTimeout(() => {
      setIsPulsing(false)
    }, 980)

    return () => {
      if (pulseTimerRef.current) {
        window.clearTimeout(pulseTimerRef.current)
      }
    }
  }, [lastAddedAt])

  if (shouldHide || cartCount === 0 || projectedDonation <= 0) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed left-4 z-[86] hidden transition-all duration-500 ease-out sm:block',
        pathname?.startsWith('/product/') ? 'bottom-28' : 'bottom-24',
        isPulsing ? 'scale-[1.025]' : 'scale-100'
      )}
      aria-live="polite"
    >
      <div className="relative w-[220px] overflow-hidden rounded-[30px] border border-[#e6d7c1] bg-white/92 p-4 shadow-[0_24px_70px_rgba(58,42,22,0.14)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-[#ffe5a6]/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-10 h-32 w-32 rounded-full bg-emerald-100/45 blur-3xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[0.24em] text-neutral-500">5% FOR GOOD</p>
            <p className="mt-1 text-sm font-medium text-neutral-950">やさしい循環</p>
          </div>

          <Link
            href="/charity"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfce] bg-[#fffaf2] text-[#7c5318] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            aria-label="チャリティーページを見る"
          >
            <Heart className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative mt-4 grid grid-cols-[74px_1fr] items-center gap-3">
          <div className="relative h-[92px] w-[74px]">
            <div className="absolute inset-x-2 top-0 h-4 rounded-t-full border border-[#decdb3] bg-white/80" />
            <div className="absolute inset-x-0 bottom-0 h-[82px] overflow-hidden rounded-b-[26px] rounded-t-[16px] border border-[#decdb3] bg-[linear-gradient(180deg,#fffdf8_0%,#fff4dc_100%)] shadow-inner">
              <div
                className="absolute bottom-0 left-0 right-0 bg-[linear-gradient(180deg,#ffe9a8_0%,#d6a144_48%,#9b6d24_100%)] transition-all duration-700 ease-out"
                style={{ height: `${fillLevel}%` }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.62),transparent_42%,rgba(92,61,24,0.12))]" />
              <div className="absolute left-1/2 top-5 h-8 w-8 -translate-x-1/2 rounded-full border border-white/70 bg-white/24" />
            </div>

            <div key={coinBurstKey} className="pointer-events-none absolute inset-0">
              {[0, 1, 2, 3, 4].map((coin) => (
                <span
                  key={coin}
                  className="absolute left-1/2 top-2 h-2.5 w-2.5 rounded-full border border-[#9b6d24]/40 bg-[#f4c96b] opacity-0 shadow-sm animate-[donationCoinDrop_900ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{
                    marginLeft: `${[-22, -10, 3, 14, 24][coin]}px`,
                    animationDelay: `${coin * 54}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] leading-5 text-neutral-500">このカートからの見込み寄付</p>
            <div className="mt-1">
              <RollingAmount amount={projectedDonation} pulseKey={pulseKey} />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-neutral-600">
              決済完了後に、売上の5%を活動資金として集計します。
            </p>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2]/84 px-2 py-2 text-center">
            <Leaf className="mx-auto h-3.5 w-3.5 text-[#5f7d4d]" />
            <p className="mt-1 text-[10px] text-neutral-600">自然</p>
          </div>
          <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2]/84 px-2 py-2 text-center">
            <Sprout className="mx-auto h-3.5 w-3.5 text-[#5f7d4d]" />
            <p className="mt-1 text-[10px] text-neutral-600">未来</p>
          </div>
          <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2]/84 px-2 py-2 text-center">
            <Coins className="mx-auto h-3.5 w-3.5 text-[#9b6d24]" />
            <p className="mt-1 text-[10px] text-neutral-600">循環</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes donationDigitRoll {
          0% {
            transform: translateY(-1.18em);
            opacity: 0.55;
            filter: blur(1px);
          }
          46% {
            opacity: 1;
            filter: blur(0.2px);
          }
          100% {
            transform: translateY(0);
            opacity: 1;
            filter: blur(0);
          }
        }

        @keyframes donationCoinDrop {
          0% {
            opacity: 0;
            transform: translateY(-16px) scale(0.65) rotate(-20deg);
          }
          24% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(58px) scale(1) rotate(18deg);
          }
        }
      `}</style>
    </div>
  )
}
