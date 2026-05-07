'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { HandCoins, Heart, Info, X } from 'lucide-react'

import { useCart } from '@/hooks/use-cart'
import { cn } from '@/lib/utils'

const DONATION_RATE = 0.05
const FULL_SUN_AMOUNT = 1000

type FillStyle = CSSProperties & {
  '--fill': string
}

type CoinStyle = CSSProperties & {
  '--start-x': string
  '--end-x': string
  '--fall-y': string
  '--rot': string
  '--delay': string
  '--duration': string
}

const sunPetals = [
  'M50 9 C60 20, 61 26, 50 31 C39 26, 40 20, 50 9Z',
  'M71 15 C73 30, 70 36, 59 37 C57 26, 61 20, 71 15Z',
  'M88 36 C75 45, 69 46, 64 37 C72 29, 79 30, 88 36Z',
  'M88 64 C73 63, 67 59, 68 48 C79 47, 84 53, 88 64Z',
  'M50 91 C40 80, 39 74, 50 69 C61 74, 60 80, 50 91Z',
  'M29 85 C27 70, 30 64, 41 63 C43 74, 39 80, 29 85Z',
  'M12 64 C25 55, 31 54, 36 63 C28 71, 21 70, 12 64Z',
  'M12 36 C27 37, 33 41, 32 52 C21 53, 16 47, 12 36Z',
  'M29 15 C42 22, 45 28, 39 37 C29 32, 25 25, 29 15Z',
]

function formatYen(value: number) {
  return Math.max(0, Math.round(value)).toLocaleString('ja-JP')
}

function DonationSun({
  fillPercent,
  isFull,
  burstKey,
}: {
  fillPercent: number
  isFull: boolean
  burstKey: number
}) {
  const fillStyle: FillStyle = {
    '--fill': `${fillPercent}%`,
  }

  return (
    <Link
      href="/charity"
      aria-label="Sonyachnaの慈善活動ページへ"
      className={cn(
        'group relative flex h-[122px] w-[122px] items-center justify-center overflow-visible rounded-full transition duration-500 hover:-translate-y-1',
        isFull
          ? 'drop-shadow-[0_0_24px_rgba(251,202,86,0.78)]'
          : 'drop-shadow-[0_18px_35px_rgba(58,42,22,0.16)]'
      )}
    >
      <FallingCoins burstKey={burstKey} />

      <span
        className={cn(
          'pointer-events-none absolute inset-1 rounded-full transition duration-700',
          isFull
            ? 'animate-[donationSunHalo_2.2s_ease-in-out_infinite] bg-[#ffd36b]/22 blur-xl'
            : 'bg-[#d6a144]/8 blur-lg'
        )}
      />

      <svg
        viewBox="0 0 100 100"
        className="relative h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="donationSunFilledGradient" cx="35%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#fff4bc" />
            <stop offset="42%" stopColor="#e9b85b" />
            <stop offset="100%" stopColor="#a86d1d" />
          </radialGradient>

          <linearGradient id="donationSunOutlineGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255, 226, 159, 0.72)" />
            <stop offset="48%" stopColor="rgba(184, 127, 37, 0.58)" />
            <stop offset="100%" stopColor="rgba(91, 56, 14, 0.38)" />
          </linearGradient>

          <clipPath id="donationSunFillClip">
            <rect
              x="0"
              y={100 - fillPercent}
              width="100"
              height={fillPercent}
              className="transition-all duration-700 ease-out"
            />
          </clipPath>

          <filter id="donationSunSoftGlow" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0.96  0 1 0 0 0.67  0 0 1 0 0.22  0 0 0 0.62 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          className={cn(
            'transition duration-700',
            isFull ? 'animate-[donationSunPulse_2.4s_ease-in-out_infinite]' : ''
          )}
          filter={isFull ? 'url(#donationSunSoftGlow)' : undefined}
        >
          <g className="opacity-42">
            {sunPetals.map((path, index) => (
              <path
                key={`outline-${index}`}
                d={path}
                fill="rgba(255,255,255,0.10)"
                stroke="url(#donationSunOutlineGradient)"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
            ))}

            <circle
              cx="50"
              cy="50"
              r="13"
              fill="rgba(255,255,255,0.12)"
              stroke="url(#donationSunOutlineGradient)"
              strokeWidth="2.2"
            />
          </g>

          <g clipPath="url(#donationSunFillClip)" style={fillStyle}>
            {sunPetals.map((path, index) => (
              <path
                key={`filled-${index}`}
                d={path}
                fill="url(#donationSunFilledGradient)"
                className="transition duration-700"
              />
            ))}

            <circle cx="50" cy="50" r="13" fill="url(#donationSunFilledGradient)" />
            <circle cx="45" cy="44" r="4" fill="rgba(255,255,255,0.38)" />
          </g>

          <g className="pointer-events-none opacity-60 transition duration-700 group-hover:opacity-90">
            <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(214,161,68,0.18)" strokeWidth="0.8" />
          </g>
        </g>
      </svg>
    </Link>
  )
}

function FallingCoins({ burstKey }: { burstKey: number }) {
  if (!burstKey) return null

  const coins: CoinStyle[] = Array.from({ length: 10 }).map((_, index): CoinStyle => {
    const spread = [-34, 18, -8, 36, 4, -24, 28, -15, 13, 0][index] ?? 0
    const end = [-5, 2, -2, 5, 0, 3, -4, 1, -1, 4][index] ?? 0

    return {
      '--start-x': `${spread}px`,
      '--end-x': `${end}px`,
      '--fall-y': `${92 + (index % 3) * 7}px`,
      '--rot': `${220 + index * 42}deg`,
      '--delay': `${index * 62}ms`,
      '--duration': `${1120 + (index % 4) * 80}ms`,
    }
  })

  return (
    <div
      key={burstKey}
      className="pointer-events-none absolute -left-7 -right-7 -top-16 bottom-0 z-30 overflow-visible"
      aria-hidden="true"
    >
      {coins.map((style, index) => (
        <span
          key={`${burstKey}-${index}`}
          className="donation-coin absolute left-1/2 top-0 h-5 w-5 animate-[donationCoinIntoSun_var(--duration)_cubic-bezier(0.18,0.72,0.22,1)_forwards] rounded-full"
          style={style}
        >
          <span className="absolute inset-0 rounded-full border border-[#ffe79a] bg-[radial-gradient(circle_at_30%_25%,#fffbd2_0%,#f7d66d_34%,#d49a2d_68%,#8e5b18_100%)] shadow-[0_6px_14px_rgba(185,133,43,0.34)]" />
          <span className="absolute inset-[4px] rounded-full border border-[#fff2b2]/70" />
          <span className="absolute inset-x-[7px] top-[5px] h-[3px] rounded-full bg-white/45" />
        </span>
      ))}
    </div>
  )
}

function RetroDigit({ char, index }: { char: string; index: number }) {
  const isDigit = /\d/.test(char)

  if (!isDigit) {
    return (
      <span className="flex h-11 items-center justify-center px-0.5 font-serif text-xl font-semibold text-[#4e3518]">
        {char}
      </span>
    )
  }

  return (
    <span className="relative flex h-11 w-[29px] overflow-hidden rounded-[9px] border border-[#8c6b3c] bg-[linear-gradient(180deg,#3a2815_0%,#5a3d1e_44%,#1e150c_45%,#3f2a14_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-10px_16px_rgba(0,0,0,0.24),0_8px_16px_rgba(58,42,22,0.16)]">
      <span className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 h-px bg-black/45" />
      <span className="pointer-events-none absolute inset-x-1 top-1 h-px bg-white/18" />
      <span
        key={`${char}-${index}`}
        className="flex h-full w-full animate-[donationCashDigitRoll_860ms_cubic-bezier(0.2,0.86,0.22,1)] items-center justify-center font-serif text-2xl font-semibold tabular-nums text-[#ffe6a3] [text-shadow:0_1px_0_rgba(0,0,0,0.45)]"
      >
        {char}
      </span>
    </span>
  )
}

function RetroCashCounter({ amount }: { amount: number }) {
  const formatted = `¥${formatYen(amount)}`

  return (
    <div className="flex h-[58px] w-[192px] items-center justify-center rounded-[18px] border border-[#9d7844] bg-[linear-gradient(180deg,#8a6130_0%,#c09149_10%,#5c3e1e_28%,#2c1d10_100%)] px-3 shadow-[0_18px_42px_rgba(58,42,22,0.20),inset_0_1px_0_rgba(255,255,255,0.28)]">
      <div className="flex items-center justify-center gap-1 rounded-[12px] border border-black/35 bg-[#21160d] px-2 py-1 shadow-[inset_0_10px_18px_rgba(0,0,0,0.38)]" aria-label={`寄付予定額 ${formatted}`}>
        {formatted.split('').map((char, index) => (
          <RetroDigit key={`${formatted}-${char}-${index}`} char={char} index={index} />
        ))}
      </div>
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
    return Math.min(100, Math.round((projectedDonation / FULL_SUN_AMOUNT) * 100))
  }, [projectedDonation])

  const isFull = projectedDonation >= FULL_SUN_AMOUNT

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
      <div className="relative flex items-center gap-3">
        <DonationSun
          fillPercent={fillPercent}
          isFull={isFull}
          burstKey={burstKey}
        />

        <div className="flex flex-col items-center gap-2">
          <RetroCashCounter amount={projectedDonation} />

          <div className="grid w-[192px] grid-cols-3 gap-2">
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
        <div className="relative ml-[134px] w-[192px] rounded-3xl border border-[#eadfce] bg-white/96 p-4 text-xs leading-6 text-neutral-700 shadow-[0_18px_46px_rgba(58,42,22,0.16)] backdrop-blur-md">
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
        @keyframes donationCashDigitRoll {
          0% {
            opacity: 0;
            transform: translateY(-105%) rotateX(78deg);
            filter: blur(1.1px);
          }
          42% {
            opacity: 1;
            transform: translateY(14%) rotateX(-10deg);
            filter: blur(0.2px);
          }
          72% {
            transform: translateY(-3%) rotateX(4deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotateX(0deg);
            filter: blur(0);
          }
        }

        @keyframes donationCoinIntoSun {
          0% {
            opacity: 0;
            transform: translateX(var(--start-x)) translateY(-18px) rotateY(70deg) rotateZ(0deg) scale(0.68);
          }
          15% {
            opacity: 1;
          }
          55% {
            opacity: 1;
            transform: translateX(calc((var(--start-x) + var(--end-x)) / 2)) translateY(calc(var(--fall-y) * 0.56)) rotateY(210deg) rotateZ(calc(var(--rot) * 0.62)) scale(1);
          }
          82% {
            opacity: 0.92;
            transform: translateX(var(--end-x)) translateY(var(--fall-y)) rotateY(320deg) rotateZ(var(--rot)) scale(0.78);
            filter: blur(0);
          }
          100% {
            opacity: 0;
            transform: translateX(var(--end-x)) translateY(calc(var(--fall-y) + 8px)) rotateY(360deg) rotateZ(calc(var(--rot) + 42deg)) scale(0.35);
            filter: blur(1px);
          }
        }

        @keyframes donationSunPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.035);
          }
        }

        @keyframes donationSunHalo {
          0%,
          100% {
            opacity: 0.54;
            transform: scale(0.96);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }
      `}</style>
    </div>
  )
}
