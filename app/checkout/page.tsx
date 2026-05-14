'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, ChevronLeft, ChevronRight, Info, Package, ShoppingCart, Truck } from 'lucide-react'

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
  category?: string
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
      category: product.category,
      stockStatus: product.stockStatus,
      volumeUnits: getProductShippingProfile(product.id).volumeUnits,
    }))
    .filter((product) => product.volumeUnits <= remainingUnits)
    .sort((a, b) => a.volumeUnits - b.volumeUnits || a.price - b.price)
}

type JapanPostZoneKey =
  | 'aichi'
  | 'hokkaido'
  | 'tohoku'
  | 'kanto_shinetsu_hokuriku_tokai_kinki'
  | 'chugoku_shikoku'
  | 'kyushu'
  | 'okinawa'

const PREFECTURE_TO_ZONE_MAP: Record<string, JapanPostZoneKey> = {
  北海道: 'hokkaido',
  青森県: 'tohoku',
  岩手県: 'tohoku',
  宮城県: 'tohoku',
  秋田県: 'tohoku',
  山形県: 'tohoku',
  福島県: 'tohoku',
  茨城県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  栃木県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  群馬県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  埼玉県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  千葉県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  東京都: 'kanto_shinetsu_hokuriku_tokai_kinki',
  神奈川県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  山梨県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  新潟県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  長野県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  富山県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  石川県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  福井県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  静岡県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  岐阜県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  愛知県: 'aichi',
  三重県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  滋賀県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  京都府: 'kanto_shinetsu_hokuriku_tokai_kinki',
  大阪府: 'kanto_shinetsu_hokuriku_tokai_kinki',
  兵庫県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  奈良県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  和歌山県: 'kanto_shinetsu_hokuriku_tokai_kinki',
  鳥取県: 'chugoku_shikoku',
  島根県: 'chugoku_shikoku',
  岡山県: 'chugoku_shikoku',
  広島県: 'chugoku_shikoku',
  山口県: 'chugoku_shikoku',
  徳島県: 'chugoku_shikoku',
  香川県: 'chugoku_shikoku',
  愛媛県: 'chugoku_shikoku',
  高知県: 'chugoku_shikoku',
  福岡県: 'kyushu',
  佐賀県: 'kyushu',
  長崎県: 'kyushu',
  熊本県: 'kyushu',
  大分県: 'kyushu',
  宮崎県: 'kyushu',
  鹿児島県: 'kyushu',
  沖縄県: 'okinawa',
}

type JapanVisualZoneKey =
  | 'hokkaido'
  | 'tohoku'
  | 'kanto'
  | 'shinetsu_hokuriku'
  | 'tokai'
  | 'aichi'
  | 'kinki'
  | 'chugoku'
  | 'shikoku'
  | 'kyushu'
  | 'okinawa'

type JapanZoneShape = {
  key: JapanVisualZoneKey
  d: string
  center: { x: number; y: number }
  lift?: number
}

const RATE_ZONE_TO_VISUAL_ZONES: Record<JapanPostZoneKey, JapanVisualZoneKey[]> = {
  aichi: ['aichi'],
  hokkaido: ['hokkaido'],
  tohoku: ['tohoku'],
  kanto_shinetsu_hokuriku_tokai_kinki: [
    'kanto',
    'shinetsu_hokuriku',
    'tokai',
    'kinki',
  ],
  chugoku_shikoku: ['chugoku', 'shikoku'],
  kyushu: ['kyushu'],
  okinawa: ['okinawa'],
}

const PREFECTURE_TO_VISUAL_ZONE_MAP: Record<string, JapanVisualZoneKey> = {
  北海道: 'hokkaido',
  青森県: 'tohoku',
  岩手県: 'tohoku',
  宮城県: 'tohoku',
  秋田県: 'tohoku',
  山形県: 'tohoku',
  福島県: 'tohoku',
  茨城県: 'kanto',
  栃木県: 'kanto',
  群馬県: 'kanto',
  埼玉県: 'kanto',
  千葉県: 'kanto',
  東京都: 'kanto',
  神奈川県: 'kanto',
  山梨県: 'kanto',
  新潟県: 'shinetsu_hokuriku',
  長野県: 'shinetsu_hokuriku',
  富山県: 'shinetsu_hokuriku',
  石川県: 'shinetsu_hokuriku',
  福井県: 'shinetsu_hokuriku',
  静岡県: 'tokai',
  岐阜県: 'tokai',
  愛知県: 'aichi',
  三重県: 'tokai',
  滋賀県: 'kinki',
  京都府: 'kinki',
  大阪府: 'kinki',
  兵庫県: 'kinki',
  奈良県: 'kinki',
  和歌山県: 'kinki',
  鳥取県: 'chugoku',
  島根県: 'chugoku',
  岡山県: 'chugoku',
  広島県: 'chugoku',
  山口県: 'chugoku',
  徳島県: 'shikoku',
  香川県: 'shikoku',
  愛媛県: 'shikoku',
  高知県: 'shikoku',
  福岡県: 'kyushu',
  佐賀県: 'kyushu',
  長崎県: 'kyushu',
  熊本県: 'kyushu',
  大分県: 'kyushu',
  宮崎県: 'kyushu',
  鹿児島県: 'kyushu',
  沖縄県: 'okinawa',
}

const JAPAN_ZONE_SHAPES: JapanZoneShape[] = [
  {
    key: 'hokkaido',
    d: 'M590,60 L640,50 L685,95 L645,135 L595,125 L575,90 Z',
    center: { x: 630, y: 92 },
    lift: 7,
  },
  {
    key: 'tohoku',
    d: 'M555,145 L590,135 L615,220 L620,275 L580,285 L565,220 Z',
    center: { x: 590, y: 213 },
    lift: 7,
  },
  {
    key: 'kanto',
    d: 'M545,295 L580,285 L605,340 L575,375 L545,365 L535,320 Z',
    center: { x: 570, y: 332 },
    lift: 6,
  },
  {
    key: 'shinetsu_hokuriku',
    d: 'M490,265 L550,230 L555,300 L535,315 L485,295 Z',
    center: { x: 522, y: 278 },
    lift: 5,
  },
  {
    key: 'tokai',
    d: 'M485,320 L535,320 L545,370 L515,395 L465,365 Z',
    center: { x: 508, y: 356 },
    lift: 5,
  },
  {
    key: 'aichi',
    d: 'M505,345 L522,345 L530,360 L518,374 L500,368 L497,354 Z',
    center: { x: 514, y: 360 },
    lift: 8,
  },
  {
    key: 'kinki',
    d: 'M435,335 L480,320 L485,385 L445,410 L415,385 Z',
    center: { x: 451, y: 371 },
    lift: 5,
  },
  {
    key: 'chugoku',
    d: 'M345,345 L430,335 L435,375 L335,385 Z',
    center: { x: 384, y: 360 },
    lift: 5,
  },
  {
    key: 'shikoku',
    d: 'M365,395 L425,385 L440,415 L375,430 Z',
    center: { x: 401, y: 409 },
    lift: 5,
  },
  {
    key: 'kyushu',
    d: 'M275,365 L340,345 L360,455 L290,495 L265,445 Z',
    center: { x: 308, y: 420 },
    lift: 6,
  },
  {
    key: 'okinawa',
    d: 'M150,520 L190,520 L190,540 L150,540 Z',
    center: { x: 170, y: 530 },
    lift: 3,
  },
]

const JAPAN_SILHOUETTE_PATHS = {
  mainland: 'M345,345 L430,335 L435,335 L480,320 L485,320 L490,265 L550,230 L555,145 L590,135 L615,220 L620,275 L605,340 L575,375 L545,370 L515,395 L485,385 L445,410 L440,415 L375,430 L365,395 L335,385 Z',
  hokkaido: 'M590,60 L640,50 L685,95 L645,135 L595,125 L575,90 Z',
  kyushu: 'M275,365 L340,345 L360,455 L290,495 L265,445 Z',
  shikoku: 'M365,395 L425,385 L440,415 L375,430 Z',
  okinawa: 'M150,520 L190,520 L190,540 L150,540 Z',
}

function getVisualZoneForPrefecture({
  prefecture,
  rateZone,
}: {
  prefecture: string
  rateZone: JapanPostZoneKey
}) {
  const normalizedPrefecture = normalizePrefectureName(prefecture)
  return PREFECTURE_TO_VISUAL_ZONE_MAP[normalizedPrefecture] ?? RATE_ZONE_TO_VISUAL_ZONES[rateZone][0]
}

function getVisualZoneCenter(visualZone: JapanVisualZoneKey) {
  return JAPAN_ZONE_SHAPES.find((shape) => shape.key === visualZone)?.center ?? { x: 160, y: 140 }
}

function normalizePrefectureName(value: string) {
  return value.trim().replace(/\s/g, '')
}

function getOriginPrefectureForItems(items: { id: string; quantity: number }[]) {
  for (const item of items) {
    const product = products.find((entry) => entry.id === item.id) as
      | (typeof products)[number]
      | (Record<string, unknown> & { id: string })
      | undefined

    if (!product) continue

    const originPrefecture =
      (typeof (product as Record<string, unknown>).shippingOriginPrefecture === 'string' &&
        (product as Record<string, unknown>).shippingOriginPrefecture) ||
      (typeof (product as Record<string, unknown>).originPrefecture === 'string' &&
        (product as Record<string, unknown>).originPrefecture)

    if (typeof originPrefecture === 'string' && originPrefecture.trim()) {
      return normalizePrefectureName(originPrefecture)
    }
  }

  return '愛知県'
}

function getOriginZoneForItems(items: { id: string; quantity: number }[]) {
  for (const item of items) {
    const product = products.find((entry) => entry.id === item.id) as
      | (typeof products)[number]
      | (Record<string, unknown> & { id: string })
      | undefined

    if (!product) continue

    const originZone =
      (typeof (product as Record<string, unknown>).shippingOriginZone === 'string' &&
        (product as Record<string, unknown>).shippingOriginZone) ||
      (typeof (product as Record<string, unknown>).originZone === 'string' &&
        (product as Record<string, unknown>).originZone)

    if (originZone && originZone in japanPostZoneLabels) {
      return originZone as JapanPostZoneKey
    }
  }

  const originPrefecture = getOriginPrefectureForItems(items)
  return PREFECTURE_TO_ZONE_MAP[originPrefecture] ?? 'aichi'
}

function buildZoneRoutePath(start: { x: number; y: number }, end: { x: number; y: number }) {
  const controlX = (start.x + end.x) / 2
  const lift = Math.max(18, Math.abs(start.x - end.x) * 0.18)
  const controlY = Math.min(start.y, end.y) - lift

  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`
}

function JapanZoneMap({
  originPrefecture,
  originZone,
  destinationPrefecture,
  destinationZone,
}: {
  originPrefecture: string
  originZone: JapanPostZoneKey
  destinationPrefecture: string
  destinationZone: JapanPostZoneKey
}) {
  const [hoveredZone, setHoveredZone] = useState<JapanVisualZoneKey | null>(null)
  const originVisualZone = getVisualZoneForPrefecture({
    prefecture: originPrefecture,
    rateZone: originZone,
  })
  const destinationVisualZone = getVisualZoneForPrefecture({
    prefecture: destinationPrefecture,
    rateZone: destinationZone,
  })
  const isSameVisualZone = originVisualZone === destinationVisualZone
  const originCenter = getVisualZoneCenter(originVisualZone)
  const destinationCenter = getVisualZoneCenter(destinationVisualZone)
  const routePath = !isSameVisualZone ? buildZoneRoutePath(originCenter, destinationCenter) : null

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-[#eadfce] bg-white/62 p-4 shadow-[0_18px_42px_rgba(58,42,22,0.06)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.88),transparent_34%),radial-gradient(circle_at_50%_108%,rgba(212,161,68,0.12),transparent_34%)]" />

      <div className="relative z-10">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[#b39a75]">
          ROUTE ZONES
        </p>
        <h3 className="mt-1.5 font-serif text-lg text-neutral-950">配送ルート</h3>
      </div>

      <div className="relative z-10 mt-2 overflow-hidden rounded-[22px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.66),rgba(253,250,243,0.80))] px-2 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
        <svg
          viewBox="120 34 590 535"
          className="h-[264px] w-full drop-shadow-[0_20px_24px_rgba(58,42,22,0.08)]"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="checkout-zone-surface" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.88)" />
              <stop offset="50%" stopColor="rgba(253,243,218,0.78)" />
              <stop offset="100%" stopColor="rgba(224,184,102,0.32)" />
            </linearGradient>
            <linearGradient id="checkout-zone-active" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff4cc" />
              <stop offset="46%" stopColor="#f2cc78" />
              <stop offset="100%" stopColor="#c99337" />
            </linearGradient>
            <linearGradient id="checkout-zone-depth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b9852b" />
              <stop offset="100%" stopColor="#7c561a" />
            </linearGradient>
            <linearGradient id="checkout-zone-route-base" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff0b8" />
              <stop offset="44%" stopColor="#d4a144" />
              <stop offset="100%" stopColor="#a86f21" />
            </linearGradient>
            <linearGradient id="checkout-zone-route-glow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,248,229,0.96)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <filter id="checkout-zone-active-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="checkout-zone-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="rgba(58,42,22,0.13)" />
            </filter>
          </defs>

          <ellipse cx="415" cy="552" rx="220" ry="16" fill="rgba(58,42,22,0.06)" />

          <g opacity="0.22" transform="translate(0 9)">
            <path d={JAPAN_SILHOUETTE_PATHS.mainland} fill="rgba(58,42,22,0.08)" />
            <path d={JAPAN_SILHOUETTE_PATHS.hokkaido} fill="rgba(58,42,22,0.08)" />
            <path d={JAPAN_SILHOUETTE_PATHS.kyushu} fill="rgba(58,42,22,0.08)" />
            <path d={JAPAN_SILHOUETTE_PATHS.shikoku} fill="rgba(58,42,22,0.08)" />
            <path d={JAPAN_SILHOUETTE_PATHS.okinawa} fill="rgba(58,42,22,0.08)" />
          </g>

          {JAPAN_ZONE_SHAPES.map((shape) => {
            const isOrigin = shape.key === originVisualZone
            const isDestination = shape.key === destinationVisualZone
            const isHovered = hoveredZone === shape.key
            const isActive = isOrigin || isDestination || isHovered
            const fill = isActive ? 'url(#checkout-zone-active)' : 'url(#checkout-zone-surface)'
            const stroke = isActive ? '#d4a144' : 'rgba(196,170,129,0.86)'

            return (
              <g
                key={shape.key}
                onMouseEnter={() => setHoveredZone(shape.key)}
                onMouseLeave={() => setHoveredZone(null)}
                className="sonyachna-map-zone"
                style={{
                  transform: isActive ? `translateY(-${shape.lift ?? 3}px)` : 'translateY(0)',
                  transformOrigin: `${shape.center.x}px ${shape.center.y}px`,
                }}
              >
                <path
                  d={shape.d}
                  fill="url(#checkout-zone-depth)"
                  transform="translate(0 7)"
                  opacity={isActive ? 0.46 : 0.18}
                />

                {isActive ? (
                  <path
                    d={shape.d}
                    fill="rgba(212,161,68,0.14)"
                    filter="url(#checkout-zone-active-glow)"
                    className="sonyachna-zone-soft-pulse"
                  />
                ) : null}

                <path
                  d={shape.d}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isActive ? '2.2' : '1.15'}
                  vectorEffect="non-scaling-stroke"
                  filter={isActive ? 'url(#checkout-zone-active-glow)' : 'url(#checkout-zone-shadow)'}
                />

                <path
                  d={shape.d}
                  fill="none"
                  stroke="rgba(255,255,255,0.58)"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                  opacity={isActive ? 0.80 : 0.44}
                />

                {isActive ? (
                  <circle
                    cx={shape.center.x}
                    cy={shape.center.y}
                    r="5.2"
                    fill={isOrigin ? '#b9852b' : '#f0bf53'}
                    stroke="#fffaf0"
                    strokeWidth="2.2"
                  />
                ) : null}
              </g>
            )
          })}

          {routePath ? (
            <>
              <path
                d={routePath}
                fill="none"
                stroke="url(#checkout-zone-route-base)"
                strokeWidth="4.2"
                strokeLinecap="round"
                opacity="0.88"
              />
              <path
                d={routePath}
                fill="none"
                stroke="url(#checkout-zone-route-glow)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="52 230"
                className="sonyachna-zone-route-flow"
              />
            </>
          ) : null}
        </svg>
      </div>
    </div>
  )
}

function PackageVolumeVisualizer({
  size,
  usedUnits,
  capacityUnits,
  fillPercent,
  isReadyToShip,
}: {
  size: number
  usedUnits: number
  capacityUnits: number
  fillPercent: number
  isReadyToShip: boolean
}) {
  const maxItems = 9
  const visibleCubes = Math.max(1, Math.min(maxItems, Math.round((fillPercent / 100) * maxItems)))

  const originX = 160
  const originY = 118
  const halfW = 20
  const halfH = 10
  const cubeLift = 20
  const wallHeight = 54
  const flapDepth = 38

  type IsoPoint = { x: number; y: number }

  const project = (col: number, row: number): IsoPoint => ({
    x: originX + (col - row) * halfW,
    y: originY + (col + row) * halfH,
  })

  const lift = (point: IsoPoint): IsoPoint => ({ x: point.x, y: point.y - wallHeight })
  const formatPoints = (points: IsoPoint[]) => points.map((point) => `${point.x},${point.y}`).join(' ')
  const extendEdge = (a: IsoPoint, b: IsoPoint, distance: number): IsoPoint[] => {
    const center = { x: originX, y: originY + 30 - wallHeight }
    const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const vector = { x: middle.x - center.x, y: middle.y - center.y }
    const length = Math.max(1, Math.hypot(vector.x, vector.y))
    const unit = { x: vector.x / length, y: vector.y / length }

    return [
      a,
      b,
      { x: b.x + unit.x * distance, y: b.y + unit.y * distance },
      { x: a.x + unit.x * distance, y: a.y + unit.y * distance },
    ]
  }

  const floorBack = project(0, 0)
  const floorRight = project(3, 0)
  const floorFront = project(3, 3)
  const floorLeft = project(0, 3)
  const rimBack = lift(floorBack)
  const rimRight = lift(floorRight)
  const rimFront = lift(floorFront)
  const rimLeft = lift(floorLeft)

  const backLeftFlap = extendEdge(rimLeft, rimBack, flapDepth)
  const backRightFlap = extendEdge(rimBack, rimRight, flapDepth)
  const frontLeftFlap = extendEdge(rimLeft, rimFront, flapDepth)
  const frontRightFlap = extendEdge(rimFront, rimRight, flapDepth)

  const cubeCenters = Array.from({ length: maxItems }).map((_, index) => {
    const row = Math.floor(index / 3)
    const col = index % 3
    return {
      key: `cube-${index}`,
      center: project(col + 0.5, row + 0.5),
      delay: `${index * 0.34}s`,
    }
  })

  const renderCube = (
    center: { x: number; y: number },
    key: string,
    delay: string
  ) => {
    const bottomTop = { x: center.x, y: center.y - 7 }
    const bottomRight = { x: center.x + 14, y: center.y }
    const bottomBottom = { x: center.x, y: center.y + 7 }
    const bottomLeft = { x: center.x - 14, y: center.y }

    const topTop = { x: bottomTop.x, y: bottomTop.y - cubeLift }
    const topRight = { x: bottomRight.x, y: bottomRight.y - cubeLift }
    const topBottom = { x: bottomBottom.x, y: bottomBottom.y - cubeLift }
    const topLeft = { x: bottomLeft.x, y: bottomLeft.y - cubeLift }

    return (
      <g
        key={key}
        className={isReadyToShip ? 'sonyachna-pack-cube-settled' : 'sonyachna-pack-cycle-cube'}
        style={{ ['--cube-delay' as string]: delay } as { [key: string]: string }}
      >
        <polygon
          points={formatPoints([topTop, topRight, topBottom, topLeft])}
          fill={`url(#cube-top-${size})`}
          stroke="#d4a144"
          strokeWidth="0.8"
        />
        <polygon
          points={formatPoints([topLeft, topBottom, bottomBottom, bottomLeft])}
          fill={`url(#cube-left-${size})`}
          stroke="#aa7722"
          strokeWidth="0.75"
        />
        <polygon
          points={formatPoints([topRight, topBottom, bottomBottom, bottomRight])}
          fill={`url(#cube-right-${size})`}
          stroke="#8d631c"
          strokeWidth="0.75"
        />
      </g>
    )
  }

  return (
    <div
      className={`relative isolate mx-auto flex min-h-[188px] w-full max-w-[228px] items-center justify-center overflow-hidden rounded-[28px] border border-[#eadfce]/75 bg-[radial-gradient(circle_at_50%_0%,#ffffff_0%,#fdfaf3_56%,#f1e4cf_100%)] shadow-[0_14px_32px_rgba(58,42,22,0.055)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isReadyToShip ? 'sonyachna-box-stage-ready' : ''
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_16%,rgba(255,255,255,0.78),transparent_24%),radial-gradient(circle_at_70%_72%,rgba(212,161,68,0.14),transparent_28%)]" />
      <div className={`pointer-events-none absolute left-1/2 top-1/2 h-20 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#edc46a]/20 blur-3xl transition-all duration-700 ${isReadyToShip ? 'scale-[1.45] opacity-100' : 'opacity-50'}`} />

      <svg
        viewBox="0 0 320 260"
        className={`relative z-10 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isReadyToShip
            ? 'h-[202px] w-[202px] drop-shadow-[0_22px_38px_rgba(58,42,22,0.20)]'
            : 'h-[198px] w-[198px] drop-shadow-[0_16px_28px_rgba(58,42,22,0.16)]'
        }`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`box-floor-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff8e7" />
            <stop offset="58%" stopColor="#efcf84" />
            <stop offset="100%" stopColor="#d3a043" />
          </linearGradient>
          <linearGradient id={`box-wall-left-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f6e2b4" />
            <stop offset="100%" stopColor="#d1a04a" />
          </linearGradient>
          <linearGradient id={`box-wall-right-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ebbd64" />
            <stop offset="100%" stopColor="#a87022" />
          </linearGradient>
          <linearGradient id={`box-glass-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.46)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.14)" />
          </linearGradient>
          <linearGradient id={`cube-top-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff6dc" />
            <stop offset="55%" stopColor="#efc76b" />
            <stop offset="100%" stopColor="#d2a044" />
          </linearGradient>
          <linearGradient id={`cube-left-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d8aa4e" />
            <stop offset="100%" stopColor="#b47d22" />
          </linearGradient>
          <linearGradient id={`cube-right-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cb9638" />
            <stop offset="100%" stopColor="#8e6119" />
          </linearGradient>
          <linearGradient id={`packed-top-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff7e7" />
            <stop offset="100%" stopColor="#e8bd65" />
          </linearGradient>
          <linearGradient id={`packed-left-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f1ca72" />
            <stop offset="100%" stopColor="#d6a342" />
          </linearGradient>
          <linearGradient id={`packed-right-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0ad4b" />
            <stop offset="100%" stopColor="#b37a1d" />
          </linearGradient>
          <filter id={`packed-box-glow-${size}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isReadyToShip ? 'opacity-0 scale-[0.92] -translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}>
          <polygon
            points={formatPoints([floorBack, floorRight, floorFront, floorLeft])}
            fill={`url(#box-floor-${size})`}
            stroke="#cf9b40"
            strokeWidth="1.2"
          />

          <polygon
            points={formatPoints([floorBack, floorLeft, rimLeft, rimBack])}
            fill={`url(#box-wall-left-${size})`}
            stroke="#d4a144"
            strokeWidth="1.1"
            opacity="0.88"
          />
          <polygon
            points={formatPoints([floorBack, floorRight, rimRight, rimBack])}
            fill={`url(#box-wall-right-${size})`}
            stroke="#b9852b"
            strokeWidth="1.1"
            opacity="0.92"
          />

          <g>
            {cubeCenters.slice(0, visibleCubes).map((cube) => renderCube(cube.center, cube.key, cube.delay))}
          </g>

          <polygon
            points={formatPoints([floorLeft, floorFront, rimFront, rimLeft])}
            fill={`url(#box-glass-${size})`}
            stroke="#d4a144"
            strokeWidth="1.05"
            opacity="0.38"
          />
          <polygon
            points={formatPoints([floorFront, floorRight, rimRight, rimFront])}
            fill={`url(#box-glass-${size})`}
            stroke="#d4a144"
            strokeWidth="1.05"
            opacity="0.30"
          />

          <polygon points={formatPoints(backLeftFlap)} fill="rgba(255,246,220,0.70)" stroke="#d4a144" strokeWidth="1" />
          <polygon points={formatPoints(backRightFlap)} fill="rgba(246,214,137,0.68)" stroke="#ce9a3d" strokeWidth="1" />
          <polygon points={formatPoints(frontLeftFlap)} fill="rgba(255,255,255,0.24)" stroke="#d4a144" strokeWidth="1" />
          <polygon points={formatPoints(frontRightFlap)} fill="rgba(255,255,255,0.18)" stroke="#d4a144" strokeWidth="1" />
        </g>

        <g className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isReadyToShip ? 'opacity-100 scale-100 translate-y-0' : 'pointer-events-none opacity-0 scale-[0.92] translate-y-2'}`}>
          <g className="sonyachna-packed-box-pulse" filter={`url(#packed-box-glow-${size})`}>
            <path d="M92 98 L160 66 L228 98 L160 130 Z" fill={`url(#packed-top-${size})`} stroke="#d4a144" strokeWidth="1.4" />
            <path d="M92 98 L160 130 L160 204 L92 172 Z" fill={`url(#packed-left-${size})`} stroke="#d4a144" strokeWidth="1.4" />
            <path d="M228 98 L160 130 L160 204 L228 172 Z" fill={`url(#packed-right-${size})`} stroke="#b9852b" strokeWidth="1.4" />
            <path d="M92 98 L160 66 L228 98 L228 172 L160 204 L92 172 Z" fill="none" stroke="#f6e3b0" strokeWidth="1.9" className="sonyachna-box-shimmer-outline" />
          </g>
        </g>
      </svg>

      <div className="absolute bottom-2 left-1/2 z-20 w-[78%] -translate-x-1/2">
        <div className="mb-1 flex justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#b39a75]">
            {size} size
          </span>
          <span className="text-[9px] font-bold text-[#b39a75]">
            {fillPercent}% full
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#eadfce]/50">
          <div
            className="h-full bg-gradient-to-r from-[#d4a144] to-[#f7d78e] transition-all duration-1000 ease-out"
            style={{ width: `${fillPercent}%` }}
          />
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
    <div className="group relative overflow-hidden rounded-[26px] bg-white/80 shadow-[0_16px_34px_rgba(58,42,22,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(58,42,22,0.13)]">
      <button
        type="button"
        onClick={() => onQuickView(product)}
        className="relative block aspect-square w-full overflow-hidden bg-[#fffaf2]"
        aria-label={`${product.name}を確認`}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition duration-700 group-hover:scale-[1.07]"
          sizes="(max-width: 768px) 50vw, 240px"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.00)_0%,rgba(0,0,0,0.10)_52%,rgba(0,0,0,0.36)_100%)]" />
        <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-900 shadow-[0_10px_22px_rgba(0,0,0,0.14)] backdrop-blur-md">
          {formatYen(product.price)}
        </div>
      </button>

      <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-95">
        <button
          type="button"
          onClick={() => onAdd(product)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-neutral-950 shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition hover:scale-105 hover:bg-white"
          aria-label={`${product.name}をカートに追加`}
        >
          <ShoppingCart className="h-4 w-4" />
        </button>

        <Link
          href={`/product/${product.slug}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-neutral-950 shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition hover:scale-105 hover:bg-white"
          aria-label={`${product.name}の商品ページへ`}
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
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
  const isReadyToShip = fillPercent >= 94 || suggestedAddOns.length === 0
  const [suggestionPage, setSuggestionPage] = useState(0)
  const [quickViewProduct, setQuickViewProduct] =
    useState<SuggestedAddOnProduct | null>(null)
  const suggestionPageCount = Math.max(1, Math.ceil(suggestedAddOns.length / 4))
  const visibleSuggestions = suggestedAddOns.slice(suggestionPage * 4, suggestionPage * 4 + 4)
  const originPrefecture = getOriginPrefectureForItems(items)
  const originZone = getOriginZoneForItems(items)

  useEffect(() => {
    setSuggestionPage(0)
  }, [shippingQuote?.destinationPrefecture, items.length, remainingUnits])

  if (!shippingQuote) {
    return (
      <div className="relative overflow-hidden rounded-[28px] border border-[#eadfce] bg-white/70 p-5 shadow-[0_16px_36px_rgba(58,42,22,0.06)] backdrop-blur-md">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#e9c77b]/14 blur-3xl" />
        <div className="relative flex items-start justify-between gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.26em] text-[#b39a75]">
              LIVE LOGISTICS
            </p>
            <h2 className="mt-2 font-serif text-xl tracking-tight text-neutral-950">
              配送料の計算
            </h2>
            <p className="mt-2 text-sm leading-7 text-neutral-600">
              郵便番号を入力すると、梱包と送料の案内がここに表示されます。
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fdf7e8] text-[#b9852b] shadow-sm">
            <Truck className="h-5 w-5" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[30px] border border-[#eadfce] bg-white/62 p-5 shadow-[0_16px_38px_rgba(58,42,22,0.06)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#e9c77b]/12 blur-3xl" />

        <div className="relative z-10 mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[#b39a75]" />
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#b39a75]">
                Smart box
              </p>
            </div>
            <h3 className="mt-2 font-serif text-xl text-neutral-950">
              箱の余白を、もう少しおいしく
            </h3>
          </div>

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

        <p className="relative z-10 mb-5 text-sm leading-7 text-neutral-600">
          同じ送料のまま一緒に入れられる商品だけを表示しています。箱の空きスペースを無駄にせず、少しだけ賢く買い足せるための提案です。
        </p>

        <div className="relative z-10 grid gap-5 xl:grid-cols-12 xl:items-start">
          <div
            className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isReadyToShip
                ? 'xl:col-span-12 xl:mx-auto xl:max-w-[430px] xl:scale-[1.06] xl:-translate-y-1 xl:z-20'
                : 'xl:col-span-4 xl:z-10'
            }`}
          >
            <PackageVolumeVisualizer
              size={size}
              usedUnits={usedUnits}
              capacityUnits={capacityUnits}
              fillPercent={fillPercent}
              isReadyToShip={isReadyToShip}
            />
          </div>

          <div
            className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isReadyToShip
                ? 'xl:col-span-12 xl:-mt-24 xl:mx-auto xl:max-w-[560px] xl:translate-y-10 xl:scale-[0.9] opacity-45 blur-[0.8px] xl:z-10'
                : 'xl:col-span-8 opacity-100 blur-0 xl:translate-y-0 xl:scale-100 xl:z-20'
            }`}
          >
            {visibleSuggestions.length > 0 ? (
              <div className="grid grid-cols-[repeat(2,minmax(118px,142px))] justify-start gap-3 sm:grid-cols-[repeat(4,minmax(112px,132px))] xl:grid-cols-[repeat(2,minmax(118px,142px))] 2xl:grid-cols-[repeat(3,minmax(118px,142px))]">
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
              <div className="rounded-[24px] border border-[#eadfce] bg-white/76 p-5 text-center text-xs leading-6 text-neutral-500">
                現在の箱はこれ以上おすすめできる商品がありません。発送準備が整っています。
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[30px] border border-[#eadfce] bg-white/56 p-4 shadow-[0_16px_36px_rgba(58,42,22,0.055)] backdrop-blur-xl">
        <div className="grid gap-4 xl:grid-cols-[1fr_0.78fr] xl:items-stretch">
          <JapanZoneMap
            originPrefecture={originPrefecture}
            originZone={originZone}
            destinationPrefecture={shippingQuote.destinationPrefecture}
            destinationZone={shippingQuote.zone as JapanPostZoneKey}
          />

          <div className="rounded-[26px] bg-[#fffaf2]/76 p-5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#b39a75]">
              SHIPPING
            </p>
            <h3 className="mt-2 font-serif text-lg text-neutral-950">
              配送料の内訳
            </h3>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-dashed border-[#e6d7c1] pb-3">
                <span className="text-neutral-600">基本運賃</span>
                <span className="font-medium text-neutral-900">
                  {formatYen(shippingAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-dashed border-[#e6d7c1] pb-3">
                <span className="text-neutral-600">梱包サイズ</span>
                <span className="font-medium text-neutral-900">{shippingQuote.size}サイズ</span>
              </div>

              <div className="flex items-center justify-between border-b border-dashed border-[#e6d7c1] pb-3">
                <span className="text-neutral-600">発送元</span>
                <span className="text-right font-medium text-neutral-900">
                  {originPrefecture}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-dashed border-[#e6d7c1] pb-3">
                <span className="text-neutral-600">配送区分</span>
                <span className="text-right font-medium text-neutral-900">
                  {getZoneLabel(shippingQuote.zone)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-semibold text-neutral-900">送料合計</span>
                <span className="font-serif text-2xl text-[#b9852b]">
                  {formatYen(shippingAmount)}
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-6 text-neutral-500">
              愛知県発送・日本郵便ゆうパック基準で自動計算しています。
            </p>
          </div>
        </div>
      </section>

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
      description: product.description,
      category: product.category,
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

        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-y-5">
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

          <aside className="order-2 h-fit lg:sticky lg:top-24 lg:order-2 lg:w-full">
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

          <section className="order-3 mt-0 lg:order-3 lg:col-span-1">
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
            stroke-dashoffset: 268;
            opacity: 0;
          }
          16% {
            opacity: 0.95;
          }
          72% {
            opacity: 0.95;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        .sonyachna-route-flow-solid {
          animation: sonyachnaRouteFlowSolid 3.2s cubic-bezier(0.45, 0, 0.25, 1) infinite;
          filter: drop-shadow(0 0 8px rgba(255,255,255,0.95));
        }

        @keyframes sonyachnaCubeDropIntoBox {
          0% {
            opacity: 0;
            transform: translateY(-74px) scale(0.78);
            filter: blur(8px);
          }
          16% {
            opacity: 1;
            transform: translateY(0) scale(1.015);
            filter: blur(0);
          }
          78% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
          100% {
            opacity: 0;
            transform: translateY(0) scale(0.98);
            filter: blur(1px);
          }
        }

        @keyframes sonyachnaPackedBoxPulse {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1) drop-shadow(0 0 0 rgba(212,161,68,0));
          }
          50% {
            transform: scale(1.02);
            filter: brightness(1.08) drop-shadow(0 0 18px rgba(212,161,68,0.30));
          }
        }

        @keyframes sonyachnaShimmerOutline {
          0% {
            stroke-dasharray: 0 820;
            stroke-dashoffset: 0;
            opacity: 0.45;
          }
          42% {
            stroke-dasharray: 360 460;
            opacity: 1;
          }
          100% {
            stroke-dasharray: 0 820;
            stroke-dashoffset: -820;
            opacity: 0.46;
          }
        }

        .sonyachna-pack-cycle-cube {
          animation: sonyachnaCubeDropIntoBox 5.8s cubic-bezier(0.22, 1, 0.36, 1) infinite both;
          animation-delay: var(--cube-delay);
          transform-box: fill-box;
          transform-origin: center;
        }

        .sonyachna-box-stage-ready {
          box-shadow: 0 22px 46px rgba(58, 42, 22, 0.10);
        }

        .sonyachna-packed-box-pulse {
          animation: sonyachnaPackedBoxPulse 2.8s ease-in-out infinite;
          transform-origin: center;
        }

        .sonyachna-box-shimmer-outline {
          animation: sonyachnaShimmerOutline 4s linear infinite;
        }

        @keyframes sonyachnaZoneRouteFlow {
          0% {
            stroke-dashoffset: 320;
            opacity: 0.22;
          }
          35% {
            opacity: 0.92;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0.18;
          }
        }

        @keyframes sonyachnaZoneSoftPulse {
          0%, 100% {
            opacity: 0.18;
          }
          50% {
            opacity: 0.38;
          }
        }

        .sonyachna-zone-route-flow {
          animation: sonyachnaZoneRouteFlow 2.8s linear infinite;
          filter: drop-shadow(0 0 7px rgba(255,248,229,0.92));
        }

        .sonyachna-zone-soft-pulse {
          animation: sonyachnaZoneSoftPulse 2.8s ease-in-out infinite;
        }

        .sonyachna-map-zone {
          transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease;
          cursor: default;
        }
      `}</style>
    </main>
  )
}
