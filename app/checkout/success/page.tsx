"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { useCart } from "@/hooks/use-cart"
import type { PaidOrder } from "@/types/order"

type LoadStatus = "loading" | "ready" | "invalid" | "not_found" | "error"

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 1. Створюємо окремий компонент для логіки, де використовується useSearchParams
function SuccessPageContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")?.trim() ?? ""

  const { clearCart } = useCart()

  const [order, setOrder] = useState<PaidOrder | null>(null)
  const [status, setStatus] = useState<LoadStatus>("loading")

  const hasClearedCartRef = useRef(false)

  useEffect(() => {
    let isCancelled = false

    async function loadOrder() {
      if (!sessionId) {
        setStatus("invalid")
        return
      }

      const maxAttempts = 8
      const delayMs = 1000

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const response = await fetch(
            `/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`,
            {
              method: "GET",
              cache: "no-store",
            }
          )

          if (response.ok) {
            const data = (await response.json()) as { order: PaidOrder }

            if (isCancelled) return

            setOrder(data.order)
            setStatus("ready")

            if (!hasClearedCartRef.current) {
              clearCart()
              hasClearedCartRef.current = true
            }
            return
          }

          if (response.status !== 404) {
            if (!isCancelled) setStatus("error")
            return
          }
        } catch (error) {
          if (attempt === maxAttempts && !isCancelled) {
            setStatus("error")
            return
          }
        }

        if (attempt < maxAttempts) await sleep(delayMs)
      }

      if (!isCancelled) setStatus("not_found")
    }

    loadOrder()
    return () => { isCancelled = true }
  }, [sessionId, clearCart])

  // --- Render Logic (UI) ---
  if (status === "loading") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-semibold">注文情報を確認しています...</h1>
        </div>
      </main>
    )
  }

  if (status === "invalid" || status === "error" || !order) {
     return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">エラーが発生しました</h1>
          <p className="mt-4 text-neutral-600">注文情報を取得できませんでした。</p>
          <Link href="/shop" className="mt-6 inline-flex h-12 items-center bg-neutral-900 px-6 text-white rounded-xl">
            ショップへ戻る
          </Link>
        </div>
      </main>
    )
  }

  // --- Success UI ---
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-green-600">Order completed</p>
          <h1 className="text-3xl font-semibold text-neutral-900">ご注文ありがとうございました</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <section className="space-y-6">
            <div className="rounded-xl border border-neutral-200 p-5">
              <h2 className="text-lg font-semibold mb-4">注文情報</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">注文番号</span>
                  <span className="font-medium">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">合計金額</span>
                  <span className="font-medium">¥{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 p-5">
              <h2 className="text-lg font-semibold mb-4">お届け先</h2>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.customer.fullName}</p>
                <p>〒{order.customer.postalCode}</p>
                <p>{order.customer.prefecture}{order.customer.city}{order.customer.addressLine1}</p>
              </div>
            </div>
          </section>

          <aside className="rounded-xl border border-neutral-200 p-5 h-fit">
            <h2 className="text-lg font-semibold mb-4">購入商品</h2>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4 p-2 bg-neutral-50 rounded-lg">
                  <div className="relative h-16 w-16 overflow-hidden rounded-md bg-neutral-200">
                    {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    <p className="text-xs text-neutral-500">¥{item.price.toLocaleString()} x {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="mt-8">
          <Link href="/shop" className="inline-flex h-12 items-center bg-neutral-900 px-8 text-white rounded-xl text-sm font-medium">
            買い物を続ける
          </Link>
        </div>
      </div>
    </main>
  )
}

// 2. Головна сторінка з обгорткою Suspense
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading order details...</p>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
}