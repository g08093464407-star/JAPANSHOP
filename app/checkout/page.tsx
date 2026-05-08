'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { useCart } from '@/hooks/use-cart'
import { trackBeginCheckout } from '@/lib/analytics'
import { calculateJapanPostShipping } from '@/lib/shipping/japan-post'

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

function getShippingSizeSteps(currentSize: number) {
  const all = [60, 80, 100, 120, 140, 160, 170]
  return all.map((size) => ({
    size,
    active: currentSize === size,
    reached: currentSize >= size,
  }))
}

function ParcelIcon({ size }: { size: number }) {
  return (
    <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.96),rgba(255,250,242,0.72)_56%,rgba(244,234,217,0.88)_100%)] shadow-[0_20px_50px_rgba(58,42,22,0.08)]">
      <div className="pointer-events-none absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-[#f0ce83]/25 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-10 bottom-2 h-10 rounded-full bg-[#d8c5aa]/30 blur-2xl" />

      <div className="relative translate-y-1 scale-[1.04]">
        <svg viewBox="0 0 220 180" className="h-36 w-40" aria-hidden="true">
          <defs>
            <linearGradient id="checkout-box-front" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f7ead2" />
              <stop offset="100%" stopColor="#e2c08a" />
            </linearGradient>
            <linearGradient id="checkout-box-side" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e6c48e" />
              <stop offset="100%" stopColor="#bf8a3c" />
            </linearGradient>
            <linearGradient id="checkout-box-top" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff6e0" />
              <stop offset="100%" stopColor="#ebcf9a" />
            </linearGradient>
          </defs>

          <polygon points="110,20 170,52 110,84 50,52" fill="url(#checkout-box-top)" stroke="#c59a58" strokeWidth="2" />
          <polygon points="50,52 110,84 110,152 50,120" fill="url(#checkout-box-front)" stroke="#c59a58" strokeWidth="2" />
          <polygon points="170,52 110,84 110,152 170,120" fill="url(#checkout-box-side)" stroke="#b07d31" strokeWidth="2" />
          <path d="M110 20 L110 152" stroke="#d0a768" strokeWidth="2.5" strokeDasharray="7 5" />
          <path d="M96 28 L124 43" stroke="#e1bc7c" strokeWidth="6" strokeLinecap="round" />
          <path d="M110 84 L110 152" stroke="#d9ae69" strokeWidth="2" opacity="0.65" />
        </svg>
      </div>

      <div className="absolute right-4 top-4 rounded-full border border-[#e8d7b4] bg-white/85 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-[#9b6d24] shadow-sm">
        {size} SIZE
      </div>
    </div>
  )
}

function JapanZoneMap({ activeZone }: { activeZone: string | null }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,250,242,0.62))] p-5 shadow-[0_20px_50px_rgba(58,42,22,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(233,199,123,0.14),transparent_34%)]" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-neutral-500">JAPAN ZONE MAP</p>
          <p className="mt-2 text-sm font-semibold text-neutral-950">
            {activeZone ? getZoneLabel(activeZone) : '配送先待ち'}
          </p>
          <p className="mt-1 text-xs leading-6 text-neutral-500">
            入力された都道府県に応じて料金区分を自動で切り替えます。
          </p>
        </div>

        <div className="flex w-[112px] shrink-0 flex-col gap-2">
          {japanZoneVisuals.map((region) => {
            const isActive = activeZone === region.key

            return (
              <div key={region.key} className={`flex ${region.row}`}>
                <div
                  className={`relative ${region.shape} rounded-[18px] border text-[10px] font-medium tracking-[0.12em] transition-all duration-500 ${
                    isActive
                      ? 'border-[#d1a04d] bg-[linear-gradient(135deg,#fff7dc,#e8be66)] text-[#8f6221] shadow-[0_10px_24px_rgba(185,133,43,0.22)]'
                      : 'border-[#eadfce] bg-white/75 text-neutral-400 shadow-sm'
                  }`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-center">
                    {region.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ShippingCalculationPanel({
  itemCount,
  shippingAmount,
  shippingQuote,
}: {
  itemCount: number
  shippingAmount: number
  shippingQuote: ReturnType<typeof calculateJapanPostShipping> | null
}) {
  const size = shippingQuote?.size ?? 60
  const zoneLabel = shippingQuote ? getZoneLabel(shippingQuote.zone) : '都道府県入力後に判定'
  const sizeSteps = getShippingSizeSteps(size)

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[#eadfce] bg-[linear-gradient(135deg,#fffaf2_0%,#fffefb_48%,#f5ecdb_100%)] p-6 shadow-[0_24px_70px_rgba(58,42,22,0.08)] sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#e9c77b]/18 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-white/80 blur-3xl" />

      <div className="relative">
        <p className="text-xs tracking-[0.24em] text-neutral-500">LIVE SHIPPING CALCULATION</p>
        <h2 className="mt-3 font-serif text-2xl tracking-tight text-neutral-950">
          送料の計算について
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
          配送先の都道府県とカート内商品の量から、日本郵便ゆうパックの送料を自動計算しています。
        </p>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <ParcelIcon size={size} />
          <JapanZoneMap activeZone={shippingQuote?.zone ?? null} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm">
            <p className="text-[11px] tracking-[0.2em] text-neutral-500">ORIGIN</p>
            <p className="mt-2 text-sm font-semibold text-neutral-950">愛知県</p>
            <p className="mt-1 text-xs leading-5 text-neutral-500">発送元</p>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm">
            <p className="text-[11px] tracking-[0.2em] text-neutral-500">DESTINATION</p>
            <p className="mt-2 text-sm font-semibold text-neutral-950">
              {shippingQuote?.destinationPrefecture ?? '未入力'}
            </p>
            <p className="mt-1 text-xs leading-5 text-neutral-500">配送先都道府県</p>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm">
            <p className="text-[11px] tracking-[0.2em] text-neutral-500">ZONE</p>
            <p className="mt-2 text-sm font-semibold text-neutral-950">{zoneLabel}</p>
            <p className="mt-1 text-xs leading-5 text-neutral-500">料金区分</p>
          </div>

          <div className="rounded-2xl border border-[#dcc08a] bg-[linear-gradient(180deg,#fffdfa,#fff4dc)] p-4 shadow-sm">
            <p className="text-[11px] tracking-[0.2em] text-[#9b6d24]">RESULT</p>
            <p className="mt-2 font-serif text-2xl text-neutral-950">
              {shippingQuote ? formatYen(shippingAmount) : '未確定'}
            </p>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              {shippingQuote ? `${shippingQuote.carrier}${shippingQuote.service}` : '都道府県を入力すると表示'}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[28px] border border-white/80 bg-white/72 p-5 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="xl:max-w-sm">
              <p className="text-[11px] tracking-[0.2em] text-neutral-500">PACKAGE SCALE</p>
              <p className="mt-2 text-lg font-semibold text-neutral-950">
                {shippingQuote ? `${size}サイズに自動判定` : 'サイズ計算待ち'}
              </p>
              <p className="mt-2 text-xs leading-6 text-neutral-500">
                商品ごとの配送プロフィールを合算して、必要なゆうパックサイズを選びます。
              </p>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              {sizeSteps.map((step) => (
                <div
                  key={step.size}
                  className={`flex h-14 min-w-[58px] items-center justify-center rounded-full border px-3 text-sm font-semibold transition-all duration-500 ${
                    step.active
                      ? 'border-[#cf9e4b] bg-[linear-gradient(180deg,#fff6df,#e9be66)] text-[#8f6221] shadow-[0_12px_26px_rgba(185,133,43,0.22)]'
                      : step.reached
                        ? 'border-[#ead7b2] bg-white text-neutral-700 shadow-sm'
                        : 'border-[#eee4d6] bg-[#fffcf8] text-neutral-400'
                  }`}
                >
                  {step.size}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2]/80 p-4">
            <p className="text-xs tracking-[0.2em] text-neutral-500">STEP 1</p>
            <p className="mt-2 text-sm font-semibold text-neutral-950">配送先を入力</p>
            <p className="mt-2 text-xs leading-6 text-neutral-600">
              郵便番号または都道府県から配送地域を判定します。
            </p>
          </div>

          <div className="hidden text-neutral-300 lg:block">→</div>

          <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2]/80 p-4">
            <p className="text-xs tracking-[0.2em] text-neutral-500">STEP 2</p>
            <p className="mt-2 text-sm font-semibold text-neutral-950">商品量を集計</p>
            <p className="mt-2 text-xs leading-6 text-neutral-600">
              カート {itemCount}点 の内容から必要サイズを自動計算します。
            </p>
          </div>

          <div className="hidden text-neutral-300 lg:block">→</div>

          <div className="rounded-2xl border border-[#d6b278] bg-white p-4 shadow-sm">
            <p className="text-xs tracking-[0.2em] text-[#9b6d24]">RESULT</p>
            <p className="mt-2 font-serif text-2xl text-neutral-950">
              {shippingQuote ? `${size}サイズ / ${formatYen(shippingAmount)}` : '入力待ち'}
            </p>
            <p className="mt-2 text-xs leading-6 text-neutral-600">
              {shippingQuote
                ? `${zoneLabel}向けの ${shippingQuote.carrier}${shippingQuote.service} 料金です。`
                : '都道府県を入力すると結果がここに反映されます。'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FloatingCharityImpact({ donationPreview }: { donationPreview: number }) {
  return (
    <div className="relative mt-5 px-2 py-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_38%,rgba(241,193,94,0.22),transparent_24%),radial-gradient(circle_at_72%_20%,rgba(255,255,255,0.75),transparent_26%)]" />

      <div className="relative flex items-center gap-3">
        <div className="sonyachna-floating-sun relative flex h-16 w-16 shrink-0 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#f1c15e]/18 blur-xl" />
          <svg viewBox="0 0 100 100" className="relative h-14 w-14 drop-shadow-[0_14px_28px_rgba(185,133,43,0.20)]" aria-hidden="true">
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
          <p className="mt-1 text-sm text-neutral-700">
            このご購入で
            <span className="mx-1 inline-block whitespace-nowrap border-b border-[#c99a4a] font-serif text-xl text-neutral-950">
              + {formatYen(donationPreview)}
            </span>
            を積み立てます。
          </p>
          <p className="mt-1 text-xs text-neutral-500">追加料金ではありません。</p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  const { items, cartTotal } = useCart()

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
      `}</style>
    </main>
  )
}
