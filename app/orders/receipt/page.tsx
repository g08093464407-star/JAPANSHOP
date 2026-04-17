'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { trackPurchase } from '@/lib/analytics'

type ReceiptItem = {
  id: string
  slug: string
  name: string
  price: number
  image: string
  quantity: number
}

type ReceiptData = {
  order: {
    id: string
    status: 'paid' | 'processing' | 'shipped' | 'delivered'
    createdAt: string
    totalAmount: number
    customer: {
      fullName: string
      email: string
      postalCode: string
      prefecture: string
      city: string
      addressLine1: string
      addressLine2: string
    }
    items: ReceiptItem[]
  }
  fortune: string
}

type LoadState = 'loading' | 'ready' | 'error'

function formatYen(amount: number) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount)
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

function ReceiptPageContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const shouldDownload = searchParams.get('download') === '1'

  const [data, setData] = useState<ReceiptData | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState('')
  const hasPrintedRef = useRef(false)
  const hasTrackedPurchaseRef = useRef(false)

  useEffect(() => {
    let isCancelled = false

    async function loadReceipt() {
      if (!token) {
        setState('error')
        setError('トークンが見つかりません。')
        return
      }

      try {
        const response = await fetch(
          `/api/orders/receipt?token=${encodeURIComponent(token)}`,
          { cache: 'no-store' }
        )

        const json = (await response.json()) as ReceiptData | { error?: string }

        if (isCancelled) return

        if (!response.ok || !('order' in json)) {
          setState('error')
          setError(
            'error' in json && json.error
              ? json.error
              : '領収情報の取得に失敗しました。'
          )
          return
        }

        setData(json)
        setState('ready')
      } catch {
        if (isCancelled) return
        setState('error')
        setError('通信エラーが発生しました。')
      }
    }

    void loadReceipt()

    return () => {
      isCancelled = true
    }
  }, [token])

  useEffect(() => {
    if (state !== 'ready' || !data || hasTrackedPurchaseRef.current) {
      return
    }

    const storageKey = `sonyachna_ga_purchase_${data.order.id}`

    try {
      if (window.localStorage.getItem(storageKey) === '1') {
        hasTrackedPurchaseRef.current = true
        return
      }

      trackPurchase({
        orderId: data.order.id,
        currency: 'JPY',
        total: data.order.totalAmount,
        items: data.order.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      })

      window.localStorage.setItem(storageKey, '1')
      hasTrackedPurchaseRef.current = true
    } catch {
      trackPurchase({
        orderId: data.order.id,
        currency: 'JPY',
        total: data.order.totalAmount,
        items: data.order.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      })

      hasTrackedPurchaseRef.current = true
    }
  }, [state, data])

  useEffect(() => {
    if (state !== 'ready' || !data || !shouldDownload || hasPrintedRef.current) {
      return
    }

    hasPrintedRef.current = true

    const timer = window.setTimeout(() => {
      window.print()
    }, 450)

    return () => window.clearTimeout(timer)
  }, [state, data, shouldDownload])

  if (state === 'loading') {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-[28px] border border-neutral-200 bg-white p-10 shadow-sm">
          <p className="text-center text-neutral-600">領収情報を読み込み中...</p>
        </div>
      </main>
    )
  }

  if (state === 'error' || !data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-[28px] border border-neutral-200 bg-white p-10 shadow-sm">
          <h1 className="text-2xl font-semibold text-neutral-900">
            領収情報を表示できませんでした
          </h1>
          <p className="mt-4 text-neutral-600">{error}</p>
          <div className="mt-6">
            <Link
              href="/shop"
              className="inline-flex h-12 items-center rounded-xl bg-neutral-900 px-6 text-sm font-medium text-white"
            >
              ショップへ戻る
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { order, fortune } = data

  return (
    <main className="bg-[#f5f1e8] px-4 py-6 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-neutral-200 bg-white shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <div className="border-b border-neutral-200 bg-[linear-gradient(135deg,#fff7e8_0%,#fffdf8_55%,#f7f2ea_100%)] px-6 py-6 print:px-6 print:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs tracking-[0.28em] text-[#9a8666]">
                SONYACHNA
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 print:text-[24px]">
                Thank you for your order
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                ご購入ありがとうございます。こちらはご注文内容の保存用ページです。
                必要に応じてPDFとして保存してください。
              </p>
            </div>

            <div className="grid min-w-[250px] gap-2 print:min-w-[220px]">
              <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                <div className="text-[11px] tracking-[0.2em] text-neutral-500">
                  ORDER NO.
                </div>
                <div className="mt-1 break-all text-sm font-semibold text-neutral-900">
                  {order.id}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                <div className="text-[11px] tracking-[0.2em] text-neutral-500">
                  ORDER DATE
                </div>
                <div className="mt-1 text-sm font-semibold text-neutral-900">
                  {formatDate(order.createdAt)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-11 items-center rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white transition hover:opacity-90"
            >
              PDFとして保存する
            </button>

            <Link
              href="/orders/track"
              className="inline-flex h-11 items-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
            >
              注文追跡ページへ
            </Link>
          </div>
        </div>

        <div className="grid gap-5 px-6 py-6 lg:grid-cols-[0.92fr_1.08fr] print:grid-cols-[0.9fr_1.1fr] print:gap-4 print:px-6 print:py-5">
          <section className="space-y-5 print:space-y-4">
            <div className="rounded-2xl border border-neutral-200 p-4">
              <h2 className="text-base font-semibold text-neutral-900">
                ご注文情報
              </h2>

              <div className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">注文番号</span>
                  <span className="max-w-[62%] break-all text-right font-medium text-neutral-900">
                    {order.id}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">メール</span>
                  <span className="max-w-[62%] break-all text-right font-medium text-neutral-900">
                    {order.customer.email}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">合計金額</span>
                  <span className="text-right font-medium text-neutral-900">
                    {formatYen(order.totalAmount)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">現在の状況</span>
                  <span className="text-right font-medium text-neutral-900">
                    {order.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 p-4">
              <h2 className="text-base font-semibold text-neutral-900">
                お届け先
              </h2>

              <div className="mt-3 space-y-1 text-sm leading-6 text-neutral-700">
                <p className="font-medium text-neutral-900">
                  {order.customer.fullName}
                </p>
                <p>〒{order.customer.postalCode}</p>
                <p>
                  {order.customer.prefecture}
                  {order.customer.city}
                </p>
                <p>{order.customer.addressLine1}</p>
                {order.customer.addressLine2 ? <p>{order.customer.addressLine2}</p> : null}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e7ddd0] bg-[#fcf8f1] p-4">
              <div className="text-[11px] tracking-[0.24em] text-[#9a8666]">
                YOUR POSITIVE FORTUNE
              </div>
              <div className="mt-2 text-base font-semibold leading-7 text-neutral-900">
                {fortune}
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                今日の買い物が、これからの毎日に少し良い流れを運びますように。
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-neutral-900">
                ご注文内容
              </h2>
              <div className="text-sm font-semibold text-neutral-900">
                {formatYen(order.totalAmount)}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div
                  key={`${order.id}-${item.id}-${item.slug}`}
                  className="grid grid-cols-[56px_minmax(0,1fr)_auto] gap-3 rounded-2xl bg-neutral-50 p-3"
                >
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-neutral-200">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium text-neutral-900">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {formatYen(item.price)} × {item.quantity}
                    </p>
                    <p className="mt-1 line-clamp-1 break-all text-[11px] text-neutral-400">
                      {item.slug}
                    </p>
                  </div>

                  <div className="whitespace-nowrap text-sm font-semibold text-neutral-900">
                    {formatYen(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">合計</span>
                <span className="font-semibold text-neutral-900">
                  {formatYen(order.totalAmount)}
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs leading-6 text-neutral-500">
              このページは注文内容の保存用です。配送状況の確認は追跡ページをご利用ください。
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default function OrderReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-neutral-500">Loading receipt...</p>
        </div>
      }
    >
      <ReceiptPageContent />
    </Suspense>
  )
}