'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Box, ChevronLeft, ChevronRight, Info, MapPin, Package, ShoppingCart, Truck } from 'lucide-react'

import { useCart } from '@/hooks/use-cart'
import { trackBeginCheckout } from '@/lib/analytics'
import {
  calculateJapanPostShipping,
  getProductShippingProfile,
} from '@/lib/shipping/japan-post'
import { products } from '@/data/products'

type CustomerForm = {
  fullName: string
  email: string
  phone: string
  postalCode: string
  prefecture: string
  city: string
  addressLine1: string
  addressLine2: string
}

type FormErrors = Partial<Record<keyof CustomerForm, string>>

type PostalLookupStatus = 'idle' | 'loading' | 'success' | 'not_found' | 'error'

type ZipCloudResponse = {
  status: number
  message: string | null
  results:
    | {
        zipcode: string
        prefcode: string
        address1: string
        address2: string
        address3: string
        kana1: string
        kana2: string
        kana3: string
      }[]
    | null
}

const initialCustomer: CustomerForm = {
  fullName: '',
  email: '',
  phone: '',
  postalCode: '',
  prefecture: '',
  city: '',
  addressLine1: '',
  addressLine2: '',
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function getPostalCodeDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 7)
}

function formatPostalCode(value: string) {
  const digits = getPostalCodeDigits(value)

  if (digits.length <= 3) {
    return digits
  }

  return `${digits.slice(0, 3)}-${digits.slice(3)}`
}

function formatYen(amount: number) {
  return `¥${amount.toLocaleString()}`
}

const japanPostZoneLabels: Record<string, string> = {
  aichi: '愛知県内',
  hokkaido: '北海道',
  tohoku: '東北',
  kanto_shinetsu_hokuriku_tokai_kinki: '関東・信越・北陸・東海・近畿',
  chugoku_shikoku: '中国・四国',
  kyushu: '九州',
  okinawa: '沖縄',
}

const japanZoneVisuals = [
  { key: 'hokkaido', label: '北海道', shape: 'h-10 w-16', row: 'justify-end' },
  { key: 'tohoku', label: '東北', shape: 'h-12 w-12', row: 'justify-center' },
  {
    key: 'kanto_shinetsu_hokuriku_tokai_kinki',
    label: '本州中央',
    shape: 'h-16 w-20',
    row: 'justify-start',
  },
  { key: 'chugoku_shikoku', label: '中国・四国', shape: 'h-10 w-16', row: 'justify-center' },
  { key: 'kyushu', label: '九州', shape: 'h-12 w-12', row: 'justify-start' },
  { key: 'okinawa', label: '沖縄', shape: 'h-4 w-10', row: 'justify-end' },
] as const

function getZoneLabel(zone: string) {
  return japanPostZoneLabels[zone] ?? zone
}

function getPackageCapacityUnits(size: number) {
  if (size <= 60) return 2
  if (size <= 80) return 5
  if (size <= 100) return 8
  if (size <= 120) return 12
  if (size <= 140) return 16
  if (size <= 160) return 20
  return 24
}

function getCartVolumeUnits(items: { id: string; quantity: number }[]) {
  return items.reduce((sum, item) => {
    const quantity = Math.max(1, Number(item.quantity) || 1)
    const profile = getProductShippingProfile(item.id)

    return sum + profile.volumeUnits * quantity
  }, 0)
}

type SuggestedAddOnProduct = {
  id: string
  name: string
  slug: string
  price: number
  image: string
  description: string
  stockStatus: 'in-stock' | 'limited' | 'out-of-stock'
  volumeUnits: number
}

function getSuggestedAddOnProducts({
  currentItems,
  remainingUnits,
}: {
  currentItems: { id: string }[]
  remainingUnits: number
}): SuggestedAddOnProduct[] {
  if (remainingUnits <= 0) return []

  const currentIds = new Set(currentItems.map((item) => item.id))

  return products
    .filter((product) => !currentIds.has(product.id))
    .filter((product) => product.stockStatus !== 'out-of-stock')
    .map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      description: product.description,
      stockStatus: product.stockStatus,
      volumeUnits: getProductShippingProfile(product.id).volumeUnits,
    }))
    .filter((product) => product.volumeUnits <= remainingUnits)
    .sort((a, b) => a.volumeUnits - b.volumeUnits || a.price - b.price)
}

type PrefectureCell = {
  key: string
  label: string
  x: number
  y: number
  w: number
  h: number
}

const JAPAN_PREFECTURE_TILES: PrefectureCell[] = [
  { key: '北海道', label: '北海道', x: 304, y: 32, w: 62, h: 32 },
  { key: '青森県', label: '青森', x: 294, y: 94, w: 26, h: 22 },
  { key: '秋田県', label: '秋田', x: 264, y: 118, w: 24, h: 22 },
  { key: '岩手県', label: '岩手', x: 294, y: 120, w: 24, h: 22 },
  { key: '山形県', label: '山形', x: 262, y: 144, w: 24, h: 22 },
  { key: '宮城県', label: '宮城', x: 292, y: 146, w: 24, h: 22 },
  { key: '福島県', label: '福島', x: 278, y: 172, w: 28, h: 22 },
  { key: '新潟県', label: '新潟', x: 236, y: 176, w: 30, h: 22 },
  { key: '富山県', label: '富山', x: 208, y: 198, w: 22, h: 20 },
  { key: '石川県', label: '石川', x: 182, y: 198, w: 22, h: 20 },
  { key: '福井県', label: '福井', x: 184, y: 222, w: 22, h: 20 },
  { key: '長野県', label: '長野', x: 236, y: 202, w: 28, h: 24 },
  { key: '群馬県', label: '群馬', x: 268, y: 198, w: 22, h: 20 },
  { key: '栃木県', label: '栃木', x: 294, y: 196, w: 22, h: 20 },
  { key: '茨城県', label: '茨城', x: 320, y: 194, w: 22, h: 22 },
  { key: '埼玉県', label: '埼玉', x: 270, y: 222, w: 22, h: 20 },
  { key: '東京都', label: '東京', x: 296, y: 222, w: 18, h: 18 },
  { key: '千葉県', label: '千葉', x: 320, y: 220, w: 24, h: 20 },
  { key: '神奈川県', label: '神奈川', x: 294, y: 244, w: 24, h: 18 },
  { key: '山梨県', label: '山梨', x: 246, y: 228, w: 20, h: 18 },
  { key: '静岡県', label: '静岡', x: 246, y: 252, w: 38, h: 18 },
  { key: '岐阜県', label: '岐阜', x: 214, y: 228, w: 28, h: 22 },
  { key: '愛知県', label: '愛知', x: 210, y: 254, w: 32, h: 20 },
  { key: '三重県', label: '三重', x: 186, y: 252, w: 20, h: 24 },
  { key: '滋賀県', label: '滋賀', x: 186, y: 228, w: 18, h: 18 },
  { key: '京都府', label: '京都', x: 160, y: 232, w: 22, h: 18 },
  { key: '大阪府', label: '大阪', x: 158, y: 254, w: 18, h: 18 },
  { key: '兵庫県', label: '兵庫', x: 132, y: 246, w: 24, h: 18 },
  { key: '奈良県', label: '奈良', x: 184, y: 276, w: 18, h: 18 },
  { key: '和歌山県', label: '和歌山', x: 158, y: 278, w: 22, h: 20 },
  { key: '鳥取県', label: '鳥取', x: 104, y: 244, w: 24, h: 18 },
  { key: '岡山県', label: '岡山', x: 108, y: 264, w: 24, h: 18 },
  { key: '島根県', label: '島根', x: 76, y: 242, w: 24, h: 18 },
  { key: '広島県', label: '広島', x: 78, y: 264, w: 26, h: 18 },
  { key: '山口県', label: '山口', x: 50, y: 254, w: 24, h: 20 },
  { key: '徳島県', label: '徳島', x: 154, y: 304, w: 22, h: 18 },
  { key: '香川県', label: '香川', x: 128, y: 300, w: 20, h: 16 },
  { key: '愛媛県', label: '愛媛', x: 106, y: 318, w: 26, h: 18 },
  { key: '高知県', label: '高知', x: 136, y: 322, w: 28, h: 18 },
  { key: '福岡県', label: '福岡', x: 40, y: 300, w: 22, h: 18 },
  { key: '佐賀県', label: '佐賀', x: 18, y: 306, w: 18, h: 18 },
  { key: '長崎県', label: '長崎', x: 0, y: 324, w: 18, h: 18 },
  { key: '大分県', label: '大分', x: 64, y: 300, w: 22, h: 18 },
  { key: '熊本県', label: '熊本', x: 34, y: 324, w: 22, h: 18 },
  { key: '宮崎県', label: '宮崎', x: 68, y: 324, w: 22, h: 18 },
  { key: '鹿児島県', label: '鹿児島', x: 42, y: 348, w: 30, h: 22 },
  { key: '沖縄県', label: '沖縄', x: 10, y: 396, w: 26, h: 18 },
]

const prefecturePointMap = Object.fromEntries(
  JAPAN_PREFECTURE_TILES.map((pref) => [pref.key, {
    x: pref.x + pref.w / 2,
    y: pref.y + pref.h / 2,
  }])
)

function buildRoutePath(start: { x: number; y: number }, end: { x: number; y: number }) {
  const curveX = (start.x + end.x) / 2
  const lift = Math.max(26, Math.abs(start.x - end.x) * 0.18)
  const controlY = Math.min(start.y, end.y) - lift

  return `M ${start.x} ${start.y} Q ${curveX} ${controlY} ${end.x} ${end.y}`
}

function JapanPrefectureMap({
  destinationPrefecture,
}: {
  destinationPrefecture: string | null
}) {
  const origin = prefecturePointMap['愛知県']
  const destination = destinationPrefecture ? prefecturePointMap[destinationPrefecture] : null
  const routePath = destination ? buildRoutePath(origin, destination) : null

  return (
    <div className="relative min-h-[470px] overflow-hidden rounded-[34px] bg-transparent p-2 sm:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_62%_16%,rgba(255,255,255,0.8),transparent_28%),radial-gradient(circle_at_24%_74%,rgba(212,161,68,0.1),transparent_26%)]" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#b39a75]">
            PREFECTURE MAP
          </p>
          <h3 className="mt-2 font-serif text-xl text-neutral-950">
            名古屋から{destinationPrefecture ?? '配送先'}へ
          </h3>
          <p className="mt-2 text-xs leading-6 text-neutral-500">
            愛知県を起点に、配送先の都道府県を地図上で確認できます。
          </p>
        </div>

        <div className="rounded-full border border-[#eadfce] bg-white/78 px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-sm">
          {destinationPrefecture ?? '未判定'}
        </div>
      </div>

      <div className="relative z-10 mt-4 aspect-[1/1.08] w-full">
        <svg viewBox="0 0 380 430" className="h-auto w-full max-w-[520px]" aria-hidden="true">
          <defs>
            <linearGradient id="checkout-route-base" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(185,133,43,0.12)" />
              <stop offset="100%" stopColor="rgba(185,133,43,0.25)" />
            </linearGradient>
            <linearGradient id="checkout-route-glow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,237,196,0)" />
              <stop offset="50%" stopColor="rgba(212,161,68,1)" />
              <stop offset="100%" stopColor="rgba(255,237,196,0)" />
            </linearGradient>
          </defs>

          {JAPAN_PREFECTURE_TILES.map((pref) => {
            const isOrigin = pref.key === '愛知県'
            const isDestination = destinationPrefecture === pref.key
            const isHighlighted = isOrigin || isDestination

            return (
              <g key={pref.key}>
                <rect
                  x={pref.x}
                  y={pref.y}
                  rx="9"
                  ry="9"
                  width={pref.w}
                  height={pref.h}
                  className={isHighlighted ? 'transition-all duration-700' : 'transition-all duration-500'}
                  fill={isHighlighted ? '#f7d78e' : 'rgba(255,255,255,0.74)'}
                  stroke={isHighlighted ? '#d4a144' : 'rgba(214, 197, 170, 0.9)'}
                  strokeWidth={isHighlighted ? '2.2' : '1.2'}
                />
              </g>
            )
          })}

          {routePath ? (
            <>
              <path
                d={routePath}
                fill="none"
                stroke="url(#checkout-route-base)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d={routePath}
                fill="none"
                stroke="url(#checkout-route-glow)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="44 220"
                className="sonyachna-route-flow-solid"
              />
            </>
          ) : null}

          <g transform={`translate(${origin.x}, ${origin.y})`}>
            <circle r="10" fill="rgba(212,161,68,0.18)" className="sonyachna-origin-pulse" />
            <circle r="5.5" fill="#b9852b" stroke="#ffffff" strokeWidth="2" />
          </g>

          {destination ? (
            <g transform={`translate(${destination.x}, ${destination.y})`}>
              <circle r="11" fill="rgba(212,161,68,0.18)" className="sonyachna-route-pulse" />
              <circle r="6" fill="#f0bf53" stroke="#ffffff" strokeWidth="2" />
            </g>
          ) : null}
        </svg>

        <div className="pointer-events-none absolute left-0 top-0 z-20">
          <div className="rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] text-white shadow-sm">
            Nagoya
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductSuggestionCard({
  product,
  onAdd,
  onQuickView,
}: {
  product: SuggestedAddOnProduct
  onAdd: (product: SuggestedAddOnProduct) => void
  onQuickView: (product: SuggestedAddOnProduct) => void
}) {
  return (
    <div className="group overflow-hidden rounded-[22px] bg-white/82 p-2 shadow-[0_14px_28px_rgba(58,42,22,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_34px_rgba(58,42,22,0.11)]">
      <button
        type="button"
        onClick={() => onQuickView(product)}
        className="relative block aspect-[1.12/1] w-full overflow-hidden rounded-[18px] bg-[#fffaf2]"
        aria-label={`${product.name}を確認`}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 50vw, 220px"
        />

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(0,0,0,0.22)_100%)] opacity-0 transition group-hover:opacity-100" />
      </button>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onAdd(product)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition hover:scale-105 hover:bg-neutral-800"
          aria-label={`${product.name}をカートに追加`}
        >
          <ShoppingCart className="h-4 w-4" />
        </button>

        <Link
          href={`/product/${product.slug}`}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#eadfce] bg-white text-neutral-900 shadow-sm transition hover:scale-105 hover:bg-[#fff3dc]"
          aria-label={`${product.name}の商品ページへ`}
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="px-1 pb-1 pt-2">
        <p className="line-clamp-1 text-xs font-medium text-neutral-800">
          {product.name}
        </p>
        <p className="mt-1 text-xs text-neutral-500">{formatYen(product.price)}</p>
      </div>
    </div>
  )
}

function ProductQuickViewOverlay({
  product,
  onClose,
  onAdd,
}: {
  product: SuggestedAddOnProduct | null
  onClose: () => void
  onAdd: (product: SuggestedAddOnProduct) => void
}) {
  if (!product) return null

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/24 p-4 backdrop-blur-sm animate-checkoutOverlayIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-[32px] bg-white p-5 shadow-[0_28px_80px_rgba(0,0,0,0.22)] animate-checkoutQuickViewIn"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-neutral-100">
          <Image src={product.image} alt={product.name} fill className="object-cover" />
        </div>

        <h3 className="mt-4 text-xl font-semibold text-neutral-900">
          {product.name}
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-7 text-neutral-500">
          {product.description}
        </p>

        <p className="mt-3 text-lg font-semibold text-neutral-950">
          {formatYen(product.price)}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              onAdd(product)
              onClose()
            }}
            className="flex-1 rounded-xl bg-neutral-950 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            カートに追加
          </button>

          <Link
            href={`/product/${product.slug}`}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 transition hover:bg-neutral-50"
            aria-label="商品ページへ"
          >
            <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function ShippingCalculationPanel({
  itemCount,
  shippingAmount,
  shippingQuote,
  items,
  onAddSuggestedProduct,
}: {
  itemCount: number
  shippingAmount: number
  shippingQuote: ReturnType<typeof calculateJapanPostShipping> | null
  items: { id: string; quantity: number }[]
  onAddSuggestedProduct: (product: SuggestedAddOnProduct) => void
}) {
  const size = shippingQuote?.size ?? 60
  const capacityUnits = getPackageCapacityUnits(size)
  const usedUnits = getCartVolumeUnits(items)
  const remainingUnits = Math.max(0, capacityUnits - usedUnits)
  const fillPercent = Math.min(100, Math.round((usedUnits / capacityUnits) * 100))
  const suggestedAddOns = getSuggestedAddOnProducts({
    currentItems: items,
    remainingUnits,
  })
  const [suggestionPage, setSuggestionPage] = useState(0)
  const [quickViewProduct, setQuickViewProduct] =
    useState<SuggestedAddOnProduct | null>(null)
  const suggestionPageCount = Math.max(1, Math.ceil(suggestedAddOns.length / 4))
  const visibleSuggestions = suggestedAddOns.slice(suggestionPage * 4, suggestionPage * 4 + 4)

  useEffect(() => {
    setSuggestionPage(0)
  }, [shippingQuote?.destinationPrefecture, items.length, remainingUnits])

  if (!shippingQuote) {
    return (
      <div className="relative overflow-hidden rounded-[34px] border border-[#eadfce] bg-white/70 p-6 shadow-[0_18px_44px_rgba(58,42,22,0.06)] backdrop-blur-md sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#e9c77b]/14 blur-3xl" />
        <div className="relative flex items-start justify-between gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#b39a75]">
              LIVE LOGISTICS
            </p>
            <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950">
              配送料の計算
            </h2>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              郵便番号を入力すると、配送地域・梱包サイズ・送料の計算がここに表示されます。
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fdf7e8] text-[#b9852b] shadow-sm">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        <div className="relative mt-6 rounded-2xl border border-dashed border-[#e2d0b5] bg-[#fffaf2]/72 px-4 py-4 text-xs leading-6 text-neutral-500">
          配送先が確定するまで、詳細な物流インフォグラフィックは折りたたんでいます。
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-[42px] border border-[#eadfce] bg-[#fdfaf3]/42 p-5 shadow-[0_22px_58px_rgba(230,215,193,0.24)] backdrop-blur-xl sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute inset-0 opacity-[0.045]" aria-hidden="true">
        <svg width="100%" height="100%" viewBox="0 0 420 420" preserveAspectRatio="none">
          <path d="M0 98 Q210 152 420 92" stroke="currentColor" fill="none" strokeWidth="1" />
          <path d="M36 0 Q158 210 48 420" stroke="currentColor" fill="none" strokeWidth="1" />
          <path d="M368 0 Q256 212 374 420" stroke="currentColor" fill="none" strokeWidth="1" />
          <path d="M0 318 Q210 258 420 326" stroke="currentColor" fill="none" strokeWidth="1" />
        </svg>
      </div>

      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#e9c77b]/18 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-8 h-48 w-48 rounded-full bg-white/80 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-5">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#b39a75]">
              LIVE LOGISTICS
            </span>
            <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950">
              配送料の計算
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
              配送先・梱包サイズ・料金区分をもとに、ゆうパック送料を自動計算しています。
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fdf7e8] text-[#b9852b] shadow-sm">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 xl:grid-cols-12">
          <div className="space-y-7 xl:col-span-5">
            <div className="relative flex flex-col items-center justify-center rounded-[34px] bg-white/78 p-7 shadow-[0_18px_42px_rgba(58,42,22,0.06)]">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-[#b39a75]" />
                <h3 className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#b39a75]">
                  Package volume
                </h3>
              </div>

              <div className="mt-6 flex flex-col items-center">
              <div className="flex flex-col items-center">
                <div className="relative flex h-36 w-36 items-center justify-center">
                  <div className="absolute bottom-3 left-1/2 h-3 w-24 -translate-x-1/2 rounded-full bg-[#b39a75]/18 blur-md" />
                  <Box
                    className="relative h-32 w-32 text-[#d2b07a] drop-shadow-[0_18px_26px_rgba(185,133,43,0.16)] transition-all duration-700"
                    strokeWidth={1.05}
                  />
                  <div className="absolute bottom-10 left-1/2 h-12 w-[74px] -translate-x-1/2 overflow-hidden rounded-b-[16px] rounded-t-md border border-[#d4a144]/20 bg-white/30">
                    <div
                      className="absolute bottom-0 left-0 w-full bg-[linear-gradient(180deg,#f5d88f,#d4a144)] transition-all duration-1000"
                      style={{ height: `${fillPercent}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#8a724d] shadow-sm">
                      {shippingQuote.size}サイズ
                    </span>
                  </div>
                </div>

                <div className="mt-4 w-full space-y-2">
                  <div className="flex justify-between text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                    <span>Box capacity</span>
                    <span>{usedUnits}/{capacityUnits} units</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-[#d4a144] transition-all duration-1000 ease-out"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                  <div className="text-right text-[11px] text-neutral-500">
                    余白 {remainingUnits} units
                  </div>
                </div>
              </div>
            </div>

            <div>
                <div className="flex items-center justify-between gap-4 px-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    Space available for
                  </h4>
                  {suggestionPageCount > 1 ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSuggestionPage((prev) => Math.max(0, prev - 1))}
                        disabled={suggestionPage === 0}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#eadfce] bg-white text-neutral-700 transition hover:bg-[#fff3dc] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="前の候補へ"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSuggestionPage((prev) => Math.min(suggestionPageCount - 1, prev + 1))}
                        disabled={suggestionPage >= suggestionPageCount - 1}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#eadfce] bg-white text-neutral-700 transition hover:bg-[#fff3dc] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="次の候補へ"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>

                {visibleSuggestions.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {visibleSuggestions.map((product) => (
                      <ProductSuggestionCard
                        key={product.id}
                        product={product}
                        onAdd={onAddSuggestedProduct}
                        onQuickView={setQuickViewProduct}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-[#eadfce] bg-white/76 p-4 text-center text-xs leading-6 text-neutral-500">
                    現在の内容で、このサイズにほぼ最適化されています。
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative flex min-h-[470px] flex-col justify-center xl:col-span-7">
            <JapanPrefectureMap destinationPrefecture={shippingQuote.destinationPrefecture} />

            <div className="relative z-10 mt-6 grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400">From</p>
                <p className="mt-1 font-medium text-neutral-800">Nagoya, Aichi</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400">To</p>
                <p className="mt-1 font-medium text-neutral-800">
                  {shippingQuote.destinationPrefecture}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between border-b border-dashed border-[#e6d7c1] pb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#d4a144]" />
              <span className="text-sm text-neutral-600">
                基本運賃 ({getZoneLabel(shippingQuote.zone)})
              </span>
            </div>
            <span className="font-medium text-neutral-900">
              {formatYen(shippingAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-dashed border-[#e6d7c1] pb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#d4a144]/55" />
              <span className="text-sm text-neutral-600">梱包サイズ</span>
            </div>
            <span className="font-medium text-neutral-900">
              {shippingQuote.size}サイズ
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-neutral-900">
                推定配送料合計
              </span>
              <span className="text-[10px] text-neutral-400">
                愛知県発送・日本郵便ゆうパック基準
              </span>
            </div>
            <div className="text-right">
              <div className="font-serif text-3xl text-[#b9852b]">
                {formatYen(shippingAmount)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-[#fdfaf3] p-4 text-[#8a724d]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs leading-5">
            安全にお届けするため、商品量に応じた最小限の梱包サイズで計算します。配送先入力後、送料はこの画面で即時更新されます。
          </p>
        </div>
      </div>

      <ProductQuickViewOverlay
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAdd={onAddSuggestedProduct}
      />
    </div>
  )
}

function FloatingCharityImpact({ donationPreview }: { donationPreview: number }) {
  return (
    <div className="relative mt-5 px-3 py-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_38%,rgba(241,193,94,0.24),transparent_28%),radial-gradient(circle_at_72%_20%,rgba(255,255,255,0.78),transparent_30%)]" />

      <div className="relative flex items-center gap-4">
        <div className="sonyachna-floating-sun relative flex h-20 w-20 shrink-0 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#f1c15e]/20 blur-xl" />
          <svg viewBox="0 0 100 100" className="relative h-[72px] w-[72px] drop-shadow-[0_14px_28px_rgba(185,133,43,0.22)]" aria-hidden="true">
            <defs>
              <radialGradient id="checkout-charity-sun-core" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#fff4c8" />
                <stop offset="48%" stopColor="#e9ba5d" />
                <stop offset="100%" stopColor="#b97922" />
              </radialGradient>
              <linearGradient id="checkout-charity-sun-ray" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff0b8" />
                <stop offset="50%" stopColor="#e8b354" />
                <stop offset="100%" stopColor="#a86d1d" />
              </linearGradient>
            </defs>
            <g fill="url(#checkout-charity-sun-ray)">
              <path d="M50 8 C61 20, 62 27, 50 32 C38 27, 39 20, 50 8Z" />
              <path d="M72 15 C74 31, 70 38, 58 38 C58 27, 62 20, 72 15Z" />
              <path d="M90 36 C76 46, 69 47, 63 37 C72 29, 80 30, 90 36Z" />
              <path d="M88 65 C73 64, 67 59, 68 48 C79 47, 85 53, 88 65Z" />
              <path d="M50 92 C39 80, 38 73, 50 68 C62 73, 61 80, 50 92Z" />
              <path d="M28 85 C26 70, 30 63, 42 62 C43 74, 39 80, 28 85Z" />
              <path d="M10 64 C24 54, 31 53, 37 63 C28 71, 20 70, 10 64Z" />
              <path d="M12 35 C27 36, 33 41, 32 52 C21 53, 15 47, 12 35Z" />
              <path d="M28 15 C42 22, 45 29, 39 38 C29 33, 24 25, 28 15Z" />
            </g>
            <circle cx="50" cy="50" r="17" fill="url(#checkout-charity-sun-core)" />
            <circle cx="44" cy="43" r="4.5" fill="rgba(255,255,255,0.48)" />
          </svg>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.24em] text-neutral-500">FOR GOOD</p>
          <p className="mt-1 text-[15px] leading-7 text-neutral-700">
            ご購入により、Sonyachnaのチャリティ基金は
            <span className="mx-1 whitespace-nowrap font-semibold text-neutral-950">
              {formatYen(donationPreview)}
            </span>
            増える予定です。心より感謝いたします。
          </p>
          <p className="mt-1 text-xs text-neutral-500">追加料金ではありません。</p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  const { items, cartTotal, addItem } = useCart()

  const [customer, setCustomer] = useState<CustomerForm>(initialCustomer)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [postalLookupStatus, setPostalLookupStatus] =
    useState<PostalLookupStatus>('idle')
  const [postalLookupMessage, setPostalLookupMessage] = useState('')

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const shippingQuote = useMemo(() => {
    const prefecture = customer.prefecture.trim()

    if (!prefecture || items.length === 0) {
      return null
    }

    try {
      return calculateJapanPostShipping({
        destinationPrefecture: prefecture,
        items,
      })
    } catch {
      return null
    }
  }, [customer.prefecture, items])

  const shippingAmount = shippingQuote?.amount ?? 0
  const checkoutTotal = cartTotal + shippingAmount
  const donationPreview = Math.round(cartTotal * 0.05)

  const handleSuggestedAddToCart = (product: SuggestedAddOnProduct) => {
  addItem({
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    stockStatus: product.stockStatus,
  })
}


  useEffect(() => {
    if (items.length === 0) return

    const checkoutSignature = items
      .map((item) => `${item.id}:${item.quantity}`)
      .sort()
      .join('|')
    const trackingKey = `sonyachna_begin_checkout_${checkoutSignature}_${cartTotal}`

    try {
      if (window.sessionStorage.getItem(trackingKey)) return
      window.sessionStorage.setItem(trackingKey, '1')
    } catch {
      // sessionStorage may be unavailable; analytics should not block checkout
    }

    trackBeginCheckout({
      total: cartTotal,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    })
  }, [cartTotal, items])

  useEffect(() => {
    const digits = getPostalCodeDigits(customer.postalCode)

    if (digits.length === 0) {
      setPostalLookupStatus('idle')
      setPostalLookupMessage('')
      return
    }

    if (digits.length < 7) {
      setPostalLookupStatus('idle')
      setPostalLookupMessage('')
      return
    }

    const controller = new AbortController()

    async function lookupAddress() {
      setPostalLookupStatus('loading')
      setPostalLookupMessage('住所を検索しています...')

      try {
        const response = await fetch(
          `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${encodeURIComponent(
            digits
          )}`,
          {
            method: 'GET',
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          setPostalLookupStatus('error')
          setPostalLookupMessage(
            '住所を自動取得できませんでした。手入力してください。'
          )
          return
        }

        const data = (await response.json()) as ZipCloudResponse
        const result = data.results?.[0]

        if (!result) {
          setPostalLookupStatus('not_found')
          setPostalLookupMessage(
            '該当する住所が見つかりませんでした。手入力してください。'
          )
          return
        }

        setCustomer((prev) => ({
          ...prev,
          prefecture: result.address1,
          city: result.address2,
          addressLine1: result.address3,
        }))

        setErrors((prev) => ({
          ...prev,
          prefecture: undefined,
          city: undefined,
          addressLine1: undefined,
        }))

        setPostalLookupStatus('success')
        setPostalLookupMessage('住所を自動入力しました。')
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error('Postal code lookup failed:', error)
        setPostalLookupStatus('error')
        setPostalLookupMessage(
          '住所を自動取得できませんでした。手入力してください。'
        )
      }
    }

    void lookupAddress()

    return () => {
      controller.abort()
    }
  }, [customer.postalCode])

  const handleChange = (field: keyof CustomerForm, value: string) => {
    let nextValue = value

    if (field === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 11)

      if (digits.length <= 3) {
        nextValue = digits
      } else if (digits.length <= 7) {
        nextValue = `${digits.slice(0, 3)}-${digits.slice(3)}`
      } else {
        nextValue = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
      }
    }

    if (field === 'email') {
      nextValue = value.trim()
    }

    if (field === 'postalCode') {
      nextValue = formatPostalCode(value)
    }

    setCustomer((prev) => ({
      ...prev,
      [field]: nextValue,
    }))

    setErrors((prev) => {
      if (!prev[field]) return prev
      return { ...prev, [field]: undefined }
    })

    if (submitError) {
      setSubmitError('')
    }

    if (field === 'postalCode') {
      setPostalLookupMessage('')
      setPostalLookupStatus('idle')
    }
  }

  const validateForm = () => {
    const nextErrors: FormErrors = {}

    if (!customer.fullName.trim()) {
      nextErrors.fullName = 'お名前を入力してください。'
    }

    if (!customer.email.trim()) {
      nextErrors.email = 'メールアドレスを入力してください。'
    } else if (!isValidEmail(customer.email.trim())) {
      nextErrors.email = '有効なメールアドレスを入力してください。'
    }

    const phoneDigits = customer.phone.replace(/\D/g, '')

    if (!phoneDigits) {
      nextErrors.phone = '電話番号を入力してください。'
    } else if (phoneDigits.length < 11) {
      nextErrors.phone = '有効な電話番号を入力してください。'
    }

    if (!customer.postalCode.trim()) {
      nextErrors.postalCode = '郵便番号を入力してください。'
    } else if (getPostalCodeDigits(customer.postalCode).length !== 7) {
      nextErrors.postalCode = '郵便番号は7桁で入力してください。'
    }

    if (!customer.prefecture.trim()) {
      nextErrors.prefecture = '都道府県を入力してください。'
    }

    if (!customer.city.trim()) {
      nextErrors.city = '市区町村を入力してください。'
    }

    if (!customer.addressLine1.trim()) {
      nextErrors.addressLine1 = '住所を入力してください。'
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const handleCheckout = async () => {
    if (items.length === 0) {
      setSubmitError('カートが空です。商品を追加してからお進みください。')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customer: {
            ...customer,
            fullName: customer.fullName.trim(),
            email: customer.email.trim(),
            phone: customer.phone.trim(),
            postalCode: customer.postalCode.trim(),
            prefecture: customer.prefecture.trim(),
            city: customer.city.trim(),
            addressLine1: customer.addressLine1.trim(),
            addressLine2: customer.addressLine2.trim(),
          },
        }),
      })

      const data = (await response.json()) as { url?: string; error?: string }

      if (!response.ok) {
        setSubmitError(data.error ?? '決済ページの作成に失敗しました。')
        setIsSubmitting(false)
        return
      }

      if (!data.url) {
        setSubmitError('Stripe の決済URLを取得できませんでした。')
        setIsSubmitting(false)
        return
      }

      window.location.href = data.url
    } catch (error) {
      console.error('Checkout request failed:', error)
      setSubmitError('通信エラーが発生しました。時間をおいて再度お試しください。')
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#fffaf2] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[32px] border border-[#eadfce] bg-white p-10 text-center shadow-[0_24px_70px_rgba(58,42,22,0.08)] sm:p-16">
            <p className="text-xs tracking-[0.24em] text-neutral-500">CHECKOUT</p>

            <h1 className="mt-4 font-serif text-3xl tracking-tight text-neutral-950">
              カートが空です
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
              ご購入手続きに進むには、まず商品をカートに追加してください。
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-950 px-6 text-sm font-medium text-white transition hover:opacity-90"
              >
                商品一覧へ戻る
              </Link>

              <Link
                href="/stories"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#d8c5aa] bg-white px-6 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                ストーリーから選ぶ
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fffaf2] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="mb-2 text-sm text-neutral-500">
            <Link href="/" className="hover:underline">
              Home
            </Link>{' '}
            /{' '}
            <Link href="/cart" className="hover:underline">
              Cart
            </Link>{' '}
            / Checkout
          </p>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs tracking-[0.24em] text-neutral-500">SECURE CHECKOUT</p>
              <h1 className="mt-2 font-serif text-3xl tracking-tight text-neutral-950 sm:text-4xl">
                ご購入手続き
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
                配送先情報をご入力ください。お支払いはStripeの安全な決済ページで行われます。
              </p>
            </div>

            <div className="rounded-2xl border border-[#eadfce] bg-white px-5 py-4 shadow-sm">
              <p className="text-xs tracking-[0.2em] text-neutral-500">ORDER SUMMARY</p>
              <p className="mt-2 text-lg font-semibold text-neutral-950">
                {itemCount}点 / {formatYen(checkoutTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="order-1 space-y-6 lg:order-1">
            <div className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <h2 className="font-serif text-2xl tracking-tight text-neutral-950">配送先情報</h2>
                <p className="mt-2 text-sm leading-7 text-neutral-600">
                  注文確認メールと配送手配に使用します。入力内容をご確認ください。
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-neutral-800">
                    お名前
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={customer.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="山田 花子"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                  {errors.fullName ? <p className="mt-2 text-xs text-red-600">{errors.fullName}</p> : null}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-neutral-800">
                    メールアドレス
                  </label>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={customer.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="example@email.com"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                  {errors.email ? (
                    <p className="mt-2 text-xs text-red-600">{errors.email}</p>
                  ) : (
                    <p className="mt-2 text-xs text-neutral-500">
                      注文確認メール、追跡情報、レシート案内を送信します。
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-neutral-800">
                    電話番号
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={customer.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="090-1234-5678"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                  {errors.phone ? (
                    <p className="mt-2 text-xs text-red-600">{errors.phone}</p>
                  ) : (
                    <p className="mt-2 text-xs text-neutral-500">
                      配送会社の連絡用です。通常こちらからお電話することはありません。
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="postalCode" className="mb-2 block text-sm font-medium text-neutral-800">
                    郵便番号
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={customer.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    placeholder="470-0353"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                  {errors.postalCode ? (
                    <p className="mt-2 text-xs text-red-600">{errors.postalCode}</p>
                  ) : postalLookupMessage ? (
                    <p
                      className={`mt-2 text-xs ${
                        postalLookupStatus === 'success'
                          ? 'text-[#3f6d52]'
                          : postalLookupStatus === 'loading'
                            ? 'text-neutral-500'
                            : 'text-amber-700'
                      }`}
                    >
                      {postalLookupMessage}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-neutral-500">7桁入力すると住所を自動入力します。</p>
                  )}
                </div>

                <div>
                  <label htmlFor="prefecture" className="mb-2 block text-sm font-medium text-neutral-800">
                    都道府県
                  </label>
                  <input
                    id="prefecture"
                    type="text"
                    autoComplete="address-level1"
                    value={customer.prefecture}
                    onChange={(e) => handleChange('prefecture', e.target.value)}
                    placeholder="愛知県"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                  {errors.prefecture ? <p className="mt-2 text-xs text-red-600">{errors.prefecture}</p> : null}
                </div>

                <div>
                  <label htmlFor="city" className="mb-2 block text-sm font-medium text-neutral-800">
                    市区町村
                  </label>
                  <input
                    id="city"
                    type="text"
                    autoComplete="address-level2"
                    value={customer.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="豊田市"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                  {errors.city ? <p className="mt-2 text-xs text-red-600">{errors.city}</p> : null}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="addressLine1" className="mb-2 block text-sm font-medium text-neutral-800">
                    住所
                  </label>
                  <input
                    id="addressLine1"
                    type="text"
                    autoComplete="address-line1"
                    value={customer.addressLine1}
                    onChange={(e) => handleChange('addressLine1', e.target.value)}
                    placeholder="〇〇町 1-2-3"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                  {errors.addressLine1 ? <p className="mt-2 text-xs text-red-600">{errors.addressLine1}</p> : null}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="addressLine2" className="mb-2 block text-sm font-medium text-neutral-800">
                    建物名・部屋番号 <span className="text-neutral-400">（任意）</span>
                  </label>
                  <input
                    id="addressLine2"
                    type="text"
                    autoComplete="address-line2"
                    value={customer.addressLine2}
                    onChange={(e) => handleChange('addressLine2', e.target.value)}
                    placeholder="サンプルマンション 301"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                </div>
              </div>
            </div>
          </section>

          <aside className="order-2 h-fit lg:sticky lg:top-24 lg:order-2">
            <div className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.2em] text-neutral-500">ORDER DETAILS</p>
                  <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950">ご注文内容</h2>
                </div>

                <Link
                  href="/cart"
                  className="text-sm font-medium text-neutral-600 underline-offset-4 transition hover:text-neutral-900 hover:underline"
                >
                  カートを見る
                </Link>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex items-start gap-4 rounded-2xl border border-neutral-100 bg-[#fffaf2] p-3"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-neutral-900">{item.name}</p>
                      <p className="mt-1 text-xs text-neutral-500">数量: {item.quantity}</p>
                      <p className="mt-2 text-sm font-semibold text-neutral-900">
                        {formatYen(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-neutral-200 pt-5 text-sm">
                <div className="flex items-center justify-between text-neutral-600">
                  <span>商品数</span>
                  <span>{itemCount}点</span>
                </div>

                <div className="flex items-center justify-between text-neutral-600">
                  <span>送料</span>
                  <span>{shippingQuote ? formatYen(shippingAmount) : '都道府県入力後に確定'}</span>
                </div>

                {shippingQuote ? (
                  <p className="text-[11px] leading-5 text-neutral-500">
                    日本郵便ゆうパック{shippingQuote.size}サイズ・愛知県発送で自動計算しています。
                  </p>
                ) : null}

                <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-semibold text-neutral-900">
                  <span>合計</span>
                  <span>{formatYen(checkoutTotal)}</span>
                </div>
              </div>

              {submitError ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? '決済ページへ接続中...' : 'Stripeで安全に支払う'}
              </button>

              <p className="mt-4 text-xs leading-6 text-neutral-500">
                ボタンを押すとStripeの安全な決済ページへ移動します。
              </p>
            </div>

            <FloatingCharityImpact donationPreview={donationPreview} />
          </aside>

          <section className="order-3 lg:order-3 lg:col-span-1">
            <ShippingCalculationPanel
              itemCount={itemCount}
              shippingAmount={shippingAmount}
              shippingQuote={shippingQuote}
              items={items}
              onAddSuggestedProduct={handleSuggestedAddToCart}
            />
          </section>
        </div>
      </div>

      <style jsx global>{`
        @keyframes sonyachnaCheckoutSunFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            filter: drop-shadow(0 0 12px rgba(233, 186, 93, 0.24));
          }
          35% {
            transform: translate3d(0, -4px, 0) scale(1.035) rotate(2deg);
            filter: drop-shadow(0 0 22px rgba(233, 186, 93, 0.36));
          }
          70% {
            transform: translate3d(0, 2px, 0) scale(0.99) rotate(-1deg);
            filter: drop-shadow(0 0 16px rgba(185, 133, 43, 0.26));
          }
        }

        .sonyachna-floating-sun {
          animation: sonyachnaCheckoutSunFloat 4.8s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes sonyachnaRouteFlowSolid {
          0% {
            stroke-dashoffset: 264;
            opacity: 0.3;
          }
          35% {
            opacity: 0.95;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0.2;
          }
        }

        @keyframes sonyachnaRoutePulse {
          0%, 100% {
            transform: scale(0.92);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.24);
            opacity: 1;
          }
        }

        @keyframes sonyachnaOriginPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.32;
          }
          50% {
            transform: scale(1.22);
            opacity: 0.18;
          }
        }

        .sonyachna-route-flow-solid {
          animation: sonyachnaRouteFlowSolid 2.8s linear infinite;
        }

        .sonyachna-route-pulse {
          animation: sonyachnaRoutePulse 1.9s ease-in-out infinite;
          transform-origin: center;
        }

        .sonyachna-origin-pulse {
          animation: sonyachnaOriginPulse 2.2s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
    </main>
  )
}
