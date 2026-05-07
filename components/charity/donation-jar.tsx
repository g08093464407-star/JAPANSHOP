'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { HandCoins, Heart, Info, X } from 'lucide-react'

import { useCart } from '@/hooks/use-cart'
import { cn } from '@/lib/utils'

const DONATION_RATE = 0.05
const FULL_CHEST_AMOUNT = 1000

function formatYen(value: number) {
  return Math.max(0, Math.round(value)).toLocaleString('ja-JP')
}

function SonyachnaMark({ glowing }: { glowing: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(
        'h-full w-full transition duration-700',
        glowing ? 'opacity-20 drop-shadow-[0_0_18px_rgba(245,190,78,0.7)]' : 'opacity-12'
      )}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="donation-chest-mark" cx="36%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff7d9" />
          <stop offset="50%" stopColor="#d6a144" />
          <stop offset="100%" stopColor="#7d4f16" />
        </radialGradient>
      </defs>

      <g fill="url(#donation-chest-mark)">
        <path d="M50 8 C59 20, 59 27, 50 32 C41 27, 41 20, 50 8Z" />
        <path d="M72 15 C73 29, 69 35, 58 36 C57 25, 62 19, 72 15Z" />
        <path d="M90 38 C77 46, 70 46, 64 38 C72 30, 80 31, 90 38Z" />
        <path d="M88 64 C74 63, 68 59, 68 49 C79 48, 85 53, 88 64Z" />
        <path d="M50 92 C41 80, 41 73, 50 68 C59 73, 59 80, 50 92Z" />
        <path d="M28 85 C27 71, 31 65, 42 64 C43 75, 38 81, 28 85Z" />
        <path d="M10 62 C23 54, 30 54, 36 62 C28 70, 20 69, 10 62Z" />
        <path d="M12 36 C26 37, 32 41, 32 51 C21 52, 15 47, 12 36Z" />
        <path d="M28 15 C41 22, 44 28, 39 37 C29 32, 24 25, 28 15Z" />
      </g>
      <circle cx="50" cy="50" r="14" fill="#7d4f16" opacity="0.92" />
      <circle cx="45" cy="44" r="4" fill="rgba(255,255,255,0.45)" />
    </svg>
  )
}

function SplitDigit({ char, index }: { char: string; index: number }) {
  const isDigit = /\d/.test(char)

  if (!isDigit) {
    return (
      <span className="flex h-10 items-center justify-center px-0.5 font-serif text-lg text-neutral-700 sm:h-11">
        {char}
      </span>
    )
  }

  return (
    <span className="relative flex h-10 w-7 overflow-hidden rounded-lg border border-[#d7c2a2] bg-[linear-gradient(180deg,#fffdf8_0%,#f5ead6_46%,#e7d0aa_47%,#fff8ea_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_18px_rgba(58,42,22,0.10)] sm:h-11 sm:w-8">
      <span className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 h-px bg-[#9b6d24]/24" />
      <span className="pointer-events-none absolute inset-x-1 top-1 h-px bg-white/80" />
      <span
        key={`${char}-${index}`}
        className="flex h-full w-full animate-[donationDigitFlip_620ms_cubic-bezier(0.16,1,0.3,1)] items-center justify-center font-serif text-xl font-semibold tabular-nums text-neutral-950 sm:text-2xl"
      >
        {char}
      </span>
    </span>
  )
}

function SplitFlapAmount({ amount }: { amount: number }) {
  const formatted = `¥${formatYen(amount)}`

  return (
    <div className="flex h-14 w-[178px] items-center justify-center rounded-2xl border border-[#d8c5aa] bg-[linear-gradient(135deg,#fffaf2_0%,#fffdf8_50%,#f1dfbf_100%)] px-3 shadow-[0_16px_38px_rgba(58,42,22,0.13)] sm:w-[190px]">
      <div className="flex items-center justify-center gap-1" aria-label={`寄付予定額 ${formatted}`}>
        {formatted.split('').map((char, index) => (
          <SplitDigit key={`${formatted}-${char}-${index}`} char={char} index={index} />
        ))}
      </div>
    </div>
  )
}

function FallingCoins({ burstKey }: { burstKey: number }) {
  if (!burstKey) return null

  return (
    <div key={burstKey} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {Array.from({ length: 8 }).map((_, index) => (
        <span
          key={`${burstKey}-${index}`}
          className="absolute top-[-18px] h-4 w-4 animate-[donationCoinFall_980ms_cubic-bezier(0.2,0.85,0.2,1)_forwards] rounded-full border border-[#f8dc8a] bg-[radial-gradient(circle_at_32%_28%,#fff8ca_0%,#f5c954_42%,#b9852b_100%)] shadow-[0_6px_14px_rgba(185,133,43,0.25)]"
          style={{
            left: `${22 + index * 8}%`,
            animationDelay: `${index * 54}ms`,
          }}
        />
      ))}
    </div>
  )
}

export default function DonationJar() {
  const { cartCount, cartTotal, lastAddedAt } = useCart()
  const pathname = usePathname()

  const [showInfo, setShowInfo] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  const previousLastAddedAt = useRef<number | null>(null)

  const shouldHide = useMemo(() => {
    if (!pathname) return false

    return (
      pathname.startsWith('/cart') ||
      pathname.startsWith('/checkout') ||
      pathname.startsWith('/orders') ||
      pathname.startsWith('/admin')
    )
  }, [pathname])

  const projectedDonation = useMemo(() => {
    return Math.round(cartTotal * DONATION_RATE)
  }, [cartTotal])

  const fillPercent = useMemo(() => {
    if (projectedDonation <= 0) return 0
    return Math.min(100, Math.round((projectedDonation / FULL_CHEST_AMOUNT) * 100))
  }, [projectedDonation])

  const isFull = projectedDonation >= FULL_CHEST_AMOUNT

  useEffect(() => {
    if (previousLastAddedAt.current === null) {
      previousLastAddedAt.current = lastAddedAt
      return
    }

    if (!lastAddedAt || previousLastAddedAt.current === lastAddedAt) return

    previousLastAddedAt.current = lastAddedAt
    setBurstKey((current) => current + 1)
  }, [lastAddedAt])

  if (shouldHide || cartCount === 0 || projectedDonation <= 0) {
    return null
  }

  return (
    <div className="fixed bottom-24 left-3 z-[82] hidden flex-col items-center gap-2 sm:flex lg:left-6">
      <div className="relative flex items-end gap-3">
        <Link
          href="/charity"
          aria-label="Sonyachnaの慈善活動ページへ"
          className={cn(
            'group relative flex h-[118px] w-[118px] items-end justify-center overflow-hidden rounded-[30px] border bg-[linear-gradient(145deg,#fffdf8_0%,#f8ead0_48%,#d8a954_100%)] shadow-[0_22px_55px_rgba(58,42,22,0.20)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(58,42,22,0.25)]',
            isFull
              ? 'border-[#f6d878] shadow-[0_0_0_1px_rgba(250,221,116,0.75),0_0_34px_rgba(250,206,80,0.62),0_24px_64px_rgba(58,42,22,0.24)] animate-[donationHolyGlow_2.2s_ease-in-out_infinite]'
              : 'border-[#dfc9aa]'
          )}
        >
          <FallingCoins burstKey={burstKey} />

          <div
            className="absolute bottom-0 left-0 right-0 rounded-b-[28px] bg-[linear-gradient(180deg,rgba(248,213,110,0.22)_0%,rgba(214,161,68,0.64)_48%,rgba(132,86,24,0.74)_100%)] transition-[height] duration-700 ease-out"
            style={{ height: `${fillPercent}%` }}
          />

          <div className="absolute inset-0 flex items-center justify-center p-7">
            <SonyachnaMark glowing={isFull} />
          </div>

          <div className="absolute inset-x-3 top-3 h-8 rounded-t-[22px] border border-white/58 bg-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-[1px]" />

          <div className="absolute inset-x-4 bottom-3 h-4 rounded-full bg-white/30 blur-[10px]" />

          <div className="absolute inset-0 rounded-[30px] ring-1 ring-inset ring-white/45 transition duration-500 group-hover:ring-white/75" />
        </Link>

        <div className="flex flex-col items-center gap-2">
          <SplitFlapAmount amount={projectedDonation} />

          <div className="grid w-[178px] grid-cols-3 gap-2 sm:w-[190px]">
            <Link
              href="/charity"
              aria-label="慈善活動ページへ"
              className="flex h-11 items-center justify-center rounded-2xl border border-[#d8c5aa] bg-white/92 text-neutral-800 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#9b6d24] hover:bg-[#fff8ea] hover:shadow-md"
            >
              <Heart className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => setShowInfo((current) => !current)}
              aria-label="寄付の説明を開く"
              className="flex h-11 items-center justify-center rounded-2xl border border-[#d8c5aa] bg-white/92 text-neutral-800 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#9b6d24] hover:bg-[#fff8ea] hover:shadow-md"
            >
              <Info className="h-4 w-4" />
            </button>

            <Link
              href="/charity#voluntary-donation"
              aria-label="任意の寄付へ"
              className="flex h-11 items-center justify-center rounded-2xl border border-[#d8c5aa] bg-white/92 text-neutral-800 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#9b6d24] hover:bg-[#fff8ea] hover:shadow-md"
            >
              <HandCoins className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {showInfo ? (
        <div className="relative ml-[122px] w-[190px] rounded-3xl border border-[#eadfce] bg-white/96 p-4 text-xs leading-6 text-neutral-700 shadow-[0_18px_46px_rgba(58,42,22,0.16)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => setShowInfo(false)}
            className="absolute right-3 top-3 rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="説明を閉じる"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="pr-6 font-medium text-neutral-950">5% for good</p>
          <p className="mt-2">
            カート内商品の5%を、決済完了後に活動資金として集計します。表示額は購入前の見込み額です。
          </p>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes donationDigitFlip {
          0% {
            opacity: 0;
            transform: translateY(-85%) rotateX(72deg);
            filter: blur(1.4px);
          }
          48% {
            opacity: 1;
            transform: translateY(8%) rotateX(-12deg);
            filter: blur(0.2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotateX(0deg);
            filter: blur(0);
          }
        }

        @keyframes donationCoinFall {
          0% {
            opacity: 0;
            transform: translateY(-18px) rotate(0deg) scale(0.85);
          }
          18% {
            opacity: 1;
          }
          78% {
            opacity: 1;
            transform: translateY(86px) rotate(260deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(96px) rotate(320deg) scale(0.74);
          }
        }

        @keyframes donationHolyGlow {
          0%,
          100% {
            filter: brightness(1) saturate(1);
          }
          50% {
            filter: brightness(1.12) saturate(1.08);
          }
        }
      `}</style>
    </div>
  )
}
