'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileDown,
  Home,
  Mail,
  PackageCheck,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react'

import { useCart } from '@/hooks/use-cart'
import type { PaidOrder } from '@/types/order'

type LoadStatus = 'loading' | 'ready' | 'invalid' | 'not_found' | 'error'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatDate(value: string) {
  const date = new Date(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function extractTokenFromTrackingUrl(trackingUrl: string) {
  if (!trackingUrl) {
    return ''
  }

  try {
    const url = new URL(trackingUrl)
    return url.searchParams.get('token')?.trim() ?? ''
  } catch {
    const match = trackingUrl.match(/[?&]token=([^&]+)/)
    return match?.[1] ? decodeURIComponent(match[1]) : ''
  }
}

function SonyachnaSealMoment() {
  const [pressed, setPressed] = useState(false)

  return (
    <div
      className="group relative mt-6 cursor-pointer overflow-hidden rounded-2xl border border-[#eadfce] bg-[radial-gradient(circle_at_50%_20%,#fff7dd_0%,#fffdf8_42%,#f4ead9_100%)] p-6 shadow-sm transition duration-500 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(185,133,43,0.16)]"
      onMouseEnter={() => setPressed(true)}
      onMouseLeave={() => setPressed(false)}
    >
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#f0c36c]/20 blur-2xl" />
      <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-[#b9852b]/10 blur-2xl" />

      <div className="relative flex flex-col items-center justify-center text-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full border border-[#d8b26f]/40 bg-[radial-gradient(circle_at_35%_28%,#fff0b8_0%,#d6a144_48%,#9a681f_100%)] shadow-[0_18px_38px_rgba(154,104,31,0.24)] transition-all duration-500 ${
              pressed
                ? 'scale-95 rotate-[-4deg]'
                : 'scale-100 rotate-0 animate-[sealBreath_4.2s_ease-in-out_infinite]'
            }`}
          />

          <div className="absolute inset-[10px] rounded-full border border-white/45" />
          <div className="absolute inset-[20px] rounded-full border border-[#7d4f16]/20 bg-[#fff8e7]/18" />

          <div
            className={`absolute inset-0 transition-all duration-500 ${
              pressed ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {Array.from({ length: 18 }).map((_, index) => (
              <span
                key={index}
                className="absolute left-1/2 top-1/2 h-7 w-1 origin-bottom rounded-full bg-[#f2c86d]/70"
                style={{
                  transform: `rotate(${index * 20}deg) translateY(-70px)`,
                }}
              />
            ))}
          </div>

          <div className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-[#fff7dd]/90 shadow-inner">
            <svg
              viewBox="0 0 100 100"
              className="h-12 w-12"
              aria-hidden="true"
            >
              <g fill="#b9852b">
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
              <circle cx="50" cy="50" r="13" fill="#8a5819" />
              <circle cx="45" cy="44" r="4" fill="rgba(255,255,255,0.42)" />
            </svg>
          </div>

          <div
            className={`absolute rounded-xl border-[3px] border-[#8a5819]/30 px-4 py-2 transition-all duration-500 ${
              pressed
                ? 'scale-100 opacity-100 rotate-[-10deg]'
                : 'scale-[1.8] opacity-0 rotate-[-18deg]'
            }`}
          >
            <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-[#8a5819]/55">
              Prepared
            </span>
            <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-[#8a5819]/55">
              With Care
            </span>
          </div>
        </div>

        <p className="mt-3 text-xs tracking-[0.24em] text-neutral-500">
          YOUR ORDER
        </p>
        <p className="mt-2 font-serif text-lg text-neutral-950">
          丁寧に整えています
        </p>
      </div>

      <style jsx>{`
        @keyframes sealBreath {
          0% {
            transform: translateY(0) scale(1) rotate(0deg);
          }
          50% {
            transform: translateY(-3px) scale(1.02) rotate(1deg);
          }
          100% {
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }
      `}</style>
    </div>
  )
}

function OrderIdCopyBox({
  orderId,
  compact = false,
}: {
  orderId: string
  compact?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function copyOrderId() {
    try {
      await navigator.clipboard.writeText(orderId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={copyOrderId}
      className={`group flex w-full items-center justify-between gap-3 rounded-2xl border border-[#eadfce] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#d6b278] hover:shadow-md ${
        compact ? 'px-4 py-3' : 'px-5 py-4'
      }`}
      aria-label="注文番号をコピーする"
    >
      <span className="min-w-0">
        {!compact ? (
          <span className="block text-xs tracking-[0.2em] text-neutral-500">
            ORDER ID
          </span>
        ) : null}
        <span className="mt-1 block break-all text-sm font-semibold text-neutral-900">
          {orderId}
        </span>
      </span>

      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#eadfce] bg-[#fffaf2] text-neutral-600 transition group-hover:scale-105 group-hover:text-neutral-950">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </span>
    </button>
  )
}

function PostPurchaseFlow() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      icon: ClipboardCheck,
      title: '注文確認',
      time: '決済直後',
      text: 'ご注文内容とお支払い状況を確認します。確認メールも送信されます。',
    },
    {
      icon: PackageCheck,
      title: '梱包',
      time: '1〜2営業日',
      text: '食品の状態を確認し、品質を保てるよう丁寧に梱包します。',
    },
    {
      icon: Truck,
      title: '発送',
      time: '3〜5営業日以内',
      text: '発送準備が整い次第、追跡ページで状況をご確認いただけます。',
    },
    {
      icon: Home,
      title: '到着',
      time: '目安 5〜7日',
      text: '地域・天候・配送状況により前後する場合があります。',
    },
  ]

  const ActiveIcon = steps[activeStep].icon

  return (
    <section className="rounded-[28px] border border-[#eadfce] bg-[linear-gradient(135deg,#fff8ea_0%,#fffdf8_58%,#f4ead9_100%)] p-5 shadow-[0_18px_50px_rgba(58,42,22,0.07)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#b9852b]" />
            <p className="text-xs tracking-[0.24em] text-neutral-500">
              NEXT STEPS
            </p>
          </div>

          <h2 className="mt-3 font-serif text-2xl tracking-tight text-neutral-950">
            ご注文後の流れ
          </h2>

          <p className="mt-3 text-sm leading-7 text-neutral-600">
            お支払い後に何が起きるかを、購入後すぐに確認できます。
          </p>
        </div>

        <div className="rounded-2xl border border-[#eadfce] bg-white/78 px-4 py-3 text-sm text-neutral-700 shadow-sm">
          配送完了までの目安：{' '}
          <span className="font-semibold text-neutral-950">5〜7日</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = activeStep === index

          return (
            <button
              key={step.title}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`group flex min-h-[132px] flex-col items-center justify-center rounded-2xl border p-4 text-center shadow-sm transition-all duration-300 ${
                isActive
                  ? 'border-[#d6b278] bg-white shadow-[0_18px_45px_rgba(185,133,43,0.16)]'
                  : 'border-[#eadfce] bg-white/70 hover:-translate-y-1 hover:border-[#d6b278] hover:bg-white hover:shadow-[0_14px_34px_rgba(58,42,22,0.08)]'
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 ${
                  isActive
                    ? 'border-[#d6b278] bg-[#fff1d2]'
                    : 'border-[#eadfce] bg-[#fffaf2] group-hover:scale-105'
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-300 ${
                    isActive
                      ? 'scale-110 text-[#9a681f]'
                      : 'text-neutral-600 group-hover:rotate-6'
                  }`}
                />
              </span>

              <p className="mt-3 text-sm font-semibold text-neutral-950">
                {step.title}
              </p>

              <p className="mt-1 text-xs text-neutral-500">{step.time}</p>
            </button>
          )
        })}
      </div>

      <div className="mt-5 rounded-3xl border border-[#eadfce] bg-white/82 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#e6d7c1] bg-[#fff7e8] shadow-sm">
            <ActiveIcon className="h-5 w-5 animate-[successIconFloat_2.4s_ease-in-out_infinite] text-[#9a681f]" />
          </div>

          <div>
            <p className="text-sm font-semibold text-neutral-950">
              {steps[activeStep].title}
            </p>
            <p className="mt-2 text-sm leading-7 text-neutral-600">
              {steps[activeStep].text}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs leading-6 text-neutral-500">
        ※ 配送地域・天候・交通状況により、お届け時期は前後する場合があります。
      </p>

      <style jsx>{`
        @keyframes successIconFloat {
          0% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-3px) scale(1.04);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </section>
  )
}

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')?.trim() ?? ''

  const { clearCart } = useCart()

  const [order, setOrder] = useState<PaidOrder | null>(null)
  const [trackingUrl, setTrackingUrl] = useState('')
  const [status, setStatus] = useState<LoadStatus>('loading')

  const hasClearedCartRef = useRef(false)

  useEffect(() => {
    let isCancelled = false

    async function loadOrder() {
      if (!sessionId) {
        setStatus('invalid')
        return
      }

      const maxAttempts = 8
      const delayMs = 1000

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const response = await fetch(
            `/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`,
            {
              method: 'GET',
              cache: 'no-store',
            }
          )

          if (response.ok) {
            const data = (await response.json()) as {
              order: PaidOrder
              trackingUrl?: string
            }

            if (isCancelled) return

            setOrder(data.order)
            setTrackingUrl(data.trackingUrl ?? '')
            setStatus('ready')

            if (!hasClearedCartRef.current) {
              clearCart()
              hasClearedCartRef.current = true
            }

            return
          }

          if (response.status !== 404) {
            if (!isCancelled) {
              setStatus('error')
            }
            return
          }
        } catch {
          if (attempt === maxAttempts && !isCancelled) {
            setStatus('error')
            return
          }
        }

        if (attempt < maxAttempts) {
          await sleep(delayMs)
        }
      }

      if (!isCancelled) {
        setStatus('not_found')
      }
    }

    void loadOrder()

    return () => {
      isCancelled = true
    }
  }, [sessionId, clearCart])

  const receiptUrl = useMemo(() => {
    const token = extractTokenFromTrackingUrl(trackingUrl)

    if (!token) {
      return ''
    }

    return `/orders/receipt?token=${encodeURIComponent(token)}&download=1`
  }, [trackingUrl])

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-[#fffaf2] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-[#eadfce] bg-white p-10 shadow-sm">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 h-14 w-14 animate-pulse rounded-full bg-neutral-200" />
            <h1 className="font-serif text-3xl tracking-tight text-neutral-950">
              注文情報を確認しています...
            </h1>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              決済完了後の情報を反映しています。数秒お待ちください。
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (
    status === 'invalid' ||
    status === 'error' ||
    status === 'not_found' ||
    !order
  ) {
    return (
      <main className="min-h-screen bg-[#fffaf2] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-[#eadfce] bg-white p-8 shadow-sm">
          <h1 className="font-serif text-3xl tracking-tight text-neutral-950">
            注文情報を取得できませんでした
          </h1>
          <p className="mt-4 text-sm leading-7 text-neutral-600">
            決済直後の場合、反映に少し時間がかかることがあります。追跡ページから注文情報を確認できます。
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/orders/track"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-neutral-950 px-6 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:opacity-90"
            >
              <Search className="h-4 w-4" />
              注文を検索する
            </Link>

            <Link
              href="/shop"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-900 transition hover:-translate-y-0.5 hover:bg-neutral-50"
            >
              <ShoppingBag className="h-4 w-4" />
              ショップへ戻る
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4">
            <p className="text-sm font-medium text-neutral-900">
              メールが届かない場合
            </p>
            <p className="mt-2 text-xs leading-6 text-neutral-500">
              迷惑メールフォルダをご確認ください。しばらく経っても確認できない場合は、お問い合わせください。
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fffaf2] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-[#eadfce] bg-white shadow-sm">
        <div className="bg-[linear-gradient(135deg,#fff8ea_0%,#fffdf8_55%,#f8f3ea_100%)] px-6 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                PAYMENT CONFIRMED
              </p>

              <h1 className="font-serif text-3xl tracking-tight text-neutral-950 sm:text-4xl">
                ご注文ありがとうございました
              </h1>

              <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
                お支払いを確認しました。ご注文内容はメールでもお送りします。
                発送準備が整い次第、追跡ページで状況をご確認いただけます。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <OrderIdCopyBox orderId={order.id} />

              <div className="rounded-2xl border border-[#eadfce] bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-xs tracking-[0.2em] text-neutral-500">
                  ORDER DATE
                </div>
                <div className="mt-2 text-sm font-semibold text-neutral-900">
                  {formatDate(order.createdAt)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {trackingUrl ? (
              <Link
                href={trackingUrl}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-neutral-950 px-6 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:opacity-90"
              >
                <Truck className="h-4 w-4" />
                注文を追跡する
              </Link>
            ) : null}

            {receiptUrl ? (
              <Link
                href={receiptUrl}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-900 transition hover:-translate-y-0.5 hover:bg-neutral-50"
              >
                <FileDown className="h-4 w-4" />
                PDFを保存する
              </Link>
            ) : null}

            <Link
              href="/shop"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-900 transition hover:-translate-y-0.5 hover:bg-neutral-50"
            >
              <ShoppingBag className="h-4 w-4" />
              買い物を続ける
            </Link>
          </div>
        </div>

        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.2fr_0.9fr] lg:px-10">
          <section className="space-y-6">
            <PostPurchaseFlow />

            <div className="rounded-2xl border border-[#eadfce] p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <h2 className="font-serif text-2xl tracking-tight text-neutral-950">
                注文情報
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-[90px_1fr] sm:items-center">
                  <span className="text-neutral-500">注文番号</span>
                  <OrderIdCopyBox orderId={order.id} compact />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">合計金額</span>
                  <span className="font-medium text-neutral-900">
                    ¥{order.total.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">お支払い状況</span>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    決済完了
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#eadfce] p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <h2 className="font-serif text-2xl tracking-tight text-neutral-950">
                お届け先
              </h2>

              <div className="mt-4 space-y-1 text-sm text-neutral-700">
                <p className="font-medium text-neutral-900">
                  {order.customer.fullName}
                </p>
                <p>〒{order.customer.postalCode}</p>
                <p>
                  {order.customer.prefecture}
                  {order.customer.city}
                </p>
                <p>{order.customer.addressLine1}</p>
                {order.customer.addressLine2 ? (
                  <p>{order.customer.addressLine2}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <h2 className="font-serif text-xl tracking-tight text-neutral-950">
                メールが届かない場合
              </h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                注文確認メールが見つからない場合は、迷惑メールフォルダをご確認ください。
                しばらく経っても確認できない場合は、注文追跡ページまたはお問い合わせからご連絡ください。
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {trackingUrl ? (
                  <Link
                    href={trackingUrl}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d8c5aa] bg-white px-4 text-sm text-neutral-800 transition hover:-translate-y-0.5 hover:border-neutral-900"
                  >
                    <Search className="h-4 w-4" />
                    追跡ページを開く
                  </Link>
                ) : null}

                <Link
                  href="/contact"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d8c5aa] bg-white px-4 text-sm text-neutral-800 transition hover:-translate-y-0.5 hover:border-neutral-900"
                >
                  <Mail className="h-4 w-4" />
                  問い合わせ
                </Link>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-[#eadfce] p-5">
            <h2 className="font-serif text-2xl tracking-tight text-neutral-950">
              購入商品
            </h2>

            <div className="mt-4 space-y-4">
              {order.items.map((item) => (
                <div
                  key={`${order.id}-${item.id}-${item.slug}`}
                  className="flex gap-4 rounded-2xl bg-[#fffaf2] p-3 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-neutral-200">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover transition duration-500 hover:scale-105"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-neutral-900">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      ¥{item.price.toLocaleString()} × {item.quantity}
                    </p>
                  </div>

                  <div className="text-sm font-semibold text-neutral-900">
                    ¥{(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {order.items.length <= 3 ? <SonyachnaSealMoment /> : null}
          </aside>
        </div>
      </div>
    </main>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-neutral-500">Loading order details...</p>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  )
}