"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { useCart } from "@/hooks/use-cart"
import type { PaidOrder } from "@/types/order"

type LoadStatus = "loading" | "ready" | "invalid" | "not_found" | "error"

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function CheckoutSuccessPage() {
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

            if (isCancelled) {
              return
            }

            setOrder(data.order)
            setStatus("ready")

            if (!hasClearedCartRef.current) {
              clearCart()
              hasClearedCartRef.current = true
            }

            return
          }

          if (response.status !== 404) {
            console.error("Failed to load order:", await response.text())

            if (!isCancelled) {
              setStatus("error")
            }

            return
          }
        } catch (error) {
          console.error("Order polling failed:", error)

          if (attempt === maxAttempts) {
            if (!isCancelled) {
              setStatus("error")
            }
            return
          }
        }

        if (attempt < maxAttempts) {
          await sleep(delayMs)
        }
      }

      if (!isCancelled) {
        setStatus("not_found")
      }
    }

    loadOrder()

    return () => {
      isCancelled = true
    }
  }, [sessionId, clearCart])

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-neutral-900">
            注文情報を確認しています
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            決済は完了しています。注文データの反映を待っていますので、そのまま少しお待ちください。
          </p>
        </div>
      </main>
    )
  }

  if (status === "invalid") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-neutral-900">
            無効なアクセスです
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            session_id が見つからないため、注文情報を取得できませんでした。
          </p>
          <div className="mt-6">
            <Link
              href="/shop"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white transition hover:opacity-90"
            >
              ショップへ戻る
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (status === "not_found") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-neutral-900">
            注文情報の反映が遅れています
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            決済は完了している可能性がありますが、注文情報の取得に時間がかかっています。少し待ってから再読み込みしてください。
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white transition hover:opacity-90"
            >
              再読み込み
            </button>

            <Link
              href="/shop"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-neutral-300 px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              ショップへ戻る
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (status === "error" || !order) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-neutral-900">
            注文情報の取得に失敗しました
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            時間をおいて再度お試しください。
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white transition hover:opacity-90"
            >
              再読み込み
            </button>

            <Link
              href="/shop"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-neutral-300 px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              ショップへ戻る
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-green-600">
            Order completed
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            ご注文ありがとうございました
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            ご注文は正常に受け付けられました。以下が確定した注文情報です。
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <section>
            <div className="rounded-xl border border-neutral-200 p-5">
              <h2 className="text-lg font-semibold text-neutral-900">注文情報</h2>

              <div className="mt-4 space-y-3 text-sm text-neutral-700">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">注文番号</span>
                  <span className="font-medium text-neutral-900">{order.id}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">注文日時</span>
                  <span className="font-medium text-neutral-900">
                    {new Date(order.createdAt).toLocaleString("ja-JP")}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">合計金額</span>
                  <span className="font-medium text-neutral-900">
                    ¥{order.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-neutral-200 p-5">
              <h2 className="text-lg font-semibold text-neutral-900">お届け先</h2>

              <div className="mt-4 space-y-2 text-sm text-neutral-700">
                <p className="font-medium text-neutral-900">
                  {order.customer.fullName}
                </p>
                <p>{order.customer.email}</p>
                <p>〒{order.customer.postalCode}</p>
                <p>
                  {order.customer.prefecture}
                  {order.customer.city}
                  {order.customer.addressLine1}
                </p>
                {order.customer.addressLine2 ? (
                  <p>{order.customer.addressLine2}</p>
                ) : null}
              </div>
            </div>
          </section>

          <aside>
            <div className="rounded-xl border border-neutral-200 p-5">
              <h2 className="text-lg font-semibold text-neutral-900">購入商品</h2>

              <div className="mt-4 space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex items-start gap-4 rounded-xl border border-neutral-100 p-3"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
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
                      <p className="line-clamp-2 text-sm font-medium text-neutral-900">
                        {item.name}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        数量: {item.quantity}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-neutral-900">
                        ¥{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between text-base font-semibold text-neutral-900">
                  <span>合計</span>
                  <span>¥{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white transition hover:opacity-90"
          >
            買い物を続ける
          </Link>

          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-neutral-300 px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            ホームへ戻る
          </Link>
        </div>
      </div>
    </main>
  )
}