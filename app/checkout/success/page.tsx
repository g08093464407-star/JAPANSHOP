'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

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

  if (status === 'invalid' || status === 'error' || status === 'not_found' || !order) {
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
              className="inline-flex h-12 items-center rounded-xl bg-neutral-950 px-6 text-sm font-medium text-white"
            >
              注文を検索する
            </Link>

            <Link
              href="/shop"
              className="inline-flex h-12 items-center rounded-xl border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-900"
            >
              ショップへ戻る
            </Link>
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
              <p className="mb-3 inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
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
              <div className="rounded-2xl border border-[#eadfce] bg-white px-5 py-4">
                <div className="text-xs tracking-[0.2em] text-neutral-500">
                  ORDER ID
                </div>
                <div className="mt-2 break-all text-sm font-semibold text-neutral-900">
                  {order.id}
                </div>
              </div>

              <div className="rounded-2xl border border-[#eadfce] bg-white px-5 py-4">
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
                className="inline-flex h-12 items-center rounded-xl bg-neutral-950 px-6 text-sm font-medium text-white transition hover:opacity-90"
              >
                注文を追跡する
              </Link>
            ) : null}

            {receiptUrl ? (
              <Link
                href={receiptUrl}
                className="inline-flex h-12 items-center rounded-xl border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
              >
                PDFを保存する
              </Link>
            ) : null}

            <Link
              href="/shop"
              className="inline-flex h-12 items-center rounded-xl border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
            >
              買い物を続ける
            </Link>
          </div>
        </div>

        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.2fr_0.9fr] lg:px-10">
          <section className="space-y-6">
            <div className="rounded-2xl border border-[#eadfce] p-5">
              <h2 className="font-serif text-2xl tracking-tight text-neutral-950">
                注文情報
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">注文番号</span>
                  <span className="break-all text-right font-medium text-neutral-900">
                    {order.id}
                  </span>
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

            <div className="rounded-2xl border border-[#eadfce] p-5">
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

            <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-5">
              <h2 className="font-serif text-xl tracking-tight text-neutral-950">
                次にできること
              </h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                注文追跡ページでは、配送準備や発送状況を確認できます。PDFは控えとして保存できます。
              </p>
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
                  className="flex gap-4 rounded-2xl bg-[#fffaf2] p-3"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-neutral-200">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
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