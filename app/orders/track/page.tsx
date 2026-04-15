"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

type TrackingStatus = "paid" | "processing" | "shipped" | "delivered"

type TrackingOrderItem = {
  id: string
  slug: string
  name: string
  price: number
  image: string
  quantity: number
}

type TrackingOrder = {
  id: string
  status: TrackingStatus
  createdAt: string
  totalAmount: number
  customer: {
    fullName: string
    maskedEmail: string
    postalCode: string
    prefecture: string
    city: string
    addressLine1: string
    addressLine2: string
  }
  items: TrackingOrderItem[]
  shippingCarrier: string | null
  trackingNumber: string | null
  shippingNote: string | null
}

type LoadState =
  | "idle"
  | "loading"
  | "lookup_loading"
  | "ready"
  | "not_found"
  | "invalid"
  | "error"

function formatYen(amount: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value: string) {
  const date = new Date(value)

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function statusLabel(status: TrackingStatus) {
  switch (status) {
    case "paid":
      return "決済完了"
    case "processing":
      return "発送準備中"
    case "shipped":
      return "発送済み"
    case "delivered":
      return "配達完了"
    default:
      return status
  }
}

function statusClasses(status: TrackingStatus) {
  switch (status) {
    case "paid":
      return "border-green-200 bg-green-50 text-green-700"
    case "processing":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "shipped":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "delivered":
      return "border-neutral-300 bg-neutral-100 text-neutral-800"
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-700"
  }
}

function getStepState(current: TrackingStatus, target: TrackingStatus) {
  const order: TrackingStatus[] = ["paid", "processing", "shipped", "delivered"]
  return order.indexOf(current) >= order.indexOf(target)
}

function TrackingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")?.trim() ?? ""

  const [order, setOrder] = useState<TrackingOrder | null>(null)
  const [state, setState] = useState<LoadState>(token ? "loading" : "idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [orderIdInput, setOrderIdInput] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [copied, setCopied] = useState<"" | "order" | "tracking">("")

  useEffect(() => {
    let isCancelled = false

    async function loadByToken() {
      if (!token) {
        setOrder(null)
        setState("idle")
        setErrorMessage("")
        return
      }

      setState("loading")
      setErrorMessage("")

      try {
        const response = await fetch(
          `/api/orders/track?token=${encodeURIComponent(token)}`,
          {
            cache: "no-store",
          }
        )

        const data = (await response.json()) as {
          order?: TrackingOrder
          error?: string
        }

        if (isCancelled) return

        if (!response.ok || !data.order) {
          if (response.status === 404) {
            setState("not_found")
            setErrorMessage("注文が見つかりませんでした。")
            return
          }

          if (response.status === 400 || response.status === 401) {
            setState("invalid")
            setErrorMessage("リンクが無効か期限切れです。")
            return
          }

          setState("error")
          setErrorMessage(data.error ?? "注文情報の取得に失敗しました。")
          return
        }

        setOrder(data.order)
        setOrderIdInput(data.order.id)
        setState("ready")
      } catch (error) {
        if (isCancelled) return
        setState("error")
        setErrorMessage("通信エラーが発生しました。")
      }
    }

    void loadByToken()

    return () => {
      isCancelled = true
    }
  }, [token])

  async function handleLookupSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const orderId = orderIdInput.trim()
    const email = emailInput.trim()

    if (!orderId || !email) {
      setErrorMessage("注文番号とメールアドレスを入力してください。")
      setState("invalid")
      return
    }

    setState("lookup_loading")
    setErrorMessage("")

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          email,
        }),
      })

      const data = (await response.json()) as {
        token?: string
        trackingUrl?: string
        error?: string
      }

      if (!response.ok || !data.token) {
        setState(response.status === 404 ? "not_found" : "error")
        setErrorMessage(
          data.error ?? "注文情報の確認に失敗しました。"
        )
        return
      }

      router.replace(`/orders/track?token=${encodeURIComponent(data.token)}`)
    } catch (error) {
      setState("error")
      setErrorMessage("通信エラーが発生しました。")
    }
  }

  async function handleCopy(value: string, type: "order" | "tracking") {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(type)
      window.setTimeout(() => setCopied(""), 1500)
    } catch (error) {
      setCopied("")
    }
  }

  const pageTitle = useMemo(() => {
    if (order) {
      return "ご注文状況"
    }

    return "注文検索・配送追跡"
  }, [order])

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm">
        <div className="bg-[linear-gradient(135deg,#fff7e8_0%,#fffdf8_55%,#f6f1e8_100%)] px-6 py-8 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700">
                ORDER TRACKING
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                {pageTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
                ご注文番号とメールアドレスで注文を検索できます。メールや購入完了ページの
                専用リンクからアクセスした場合は、そのまま現在の状況を表示します。
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white/90 p-5 shadow-sm backdrop-blur">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4">
                  <div className="text-xs tracking-[0.2em] text-neutral-500">
                    ACCESS
                  </div>
                  <div className="mt-2 text-sm font-semibold text-neutral-900">
                    Secure link / ID + Email
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4">
                  <div className="text-xs tracking-[0.2em] text-neutral-500">
                    STATUS
                  </div>
                  <div className="mt-2 text-sm font-semibold text-neutral-900">
                    Real-time from order DB
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <section>
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">
                  注文を検索する
                </h2>
                <p className="mt-2 text-sm leading-7 text-neutral-600">
                  注文番号と購入時のメールアドレスを入力してください。
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleLookupSubmit}>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">
                    注文番号
                  </label>
                  <input
                    type="text"
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value)}
                    placeholder="例: 2cdf0e96-55d8-4408-8240-4471cf90ba4c"
                    className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={state === "lookup_loading"}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-neutral-900 px-6 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {state === "lookup_loading" ? "確認中..." : "注文を検索する"}
                </button>
              </form>

              {errorMessage ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-xs leading-6 text-neutral-500">
                  メールの専用リンクからアクセスした場合は、検索なしで表示されます。
                </div>
              )}
            </div>

            <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-neutral-900">
                追跡ページで確認できる内容
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-700">
                  現在の注文ステータス
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-700">
                  配送業者・追跡番号
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-700">
                  注文商品と合計金額
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-700">
                  配送メモ
                </div>
              </div>
            </div>
          </section>

          <section>
            {state === "loading" ? (
              <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
                <div className="mb-4 h-6 w-40 animate-pulse rounded bg-neutral-200" />
                <div className="space-y-3">
                  <div className="h-16 animate-pulse rounded-2xl bg-neutral-100" />
                  <div className="h-16 animate-pulse rounded-2xl bg-neutral-100" />
                  <div className="h-16 animate-pulse rounded-2xl bg-neutral-100" />
                </div>
              </div>
            ) : state === "ready" && order ? (
              <div className="space-y-6">
                <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">注文番号</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h2 className="break-all text-2xl font-semibold text-neutral-900">
                          {order.id}
                        </h2>
                        <button
                          type="button"
                          onClick={() => void handleCopy(order.id, "order")}
                          className="inline-flex h-9 items-center rounded-xl border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-900 transition hover:bg-neutral-50"
                        >
                          {copied === "order" ? "コピー済み" : "注文番号をコピー"}
                        </button>
                      </div>

                      <p className="mt-3 text-sm text-neutral-600">
                        {formatDate(order.createdAt)} / {order.customer.maskedEmail}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-medium ${statusClasses(order.status)}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-4">
                    {(["paid", "processing", "shipped", "delivered"] as TrackingStatus[]).map(
                      (step) => {
                        const active = getStepState(order.status, step)

                        return (
                          <div
                            key={step}
                            className={`rounded-2xl border px-4 py-4 text-center text-sm ${
                              active
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 bg-neutral-50 text-neutral-500"
                            }`}
                          >
                            {statusLabel(step)}
                          </div>
                        )
                      }
                    )}
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        配送情報
                      </h3>

                      <div className="mt-4 space-y-3 text-sm text-neutral-700">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-neutral-500">配送業者</span>
                          <span className="text-right font-medium text-neutral-900">
                            {order.shippingCarrier || "発送準備中"}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <span className="text-neutral-500">追跡番号</span>
                          <div className="text-right">
                            <div className="font-medium text-neutral-900">
                              {order.trackingNumber || "未登録"}
                            </div>

                            {order.trackingNumber ? (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleCopy(order.trackingNumber ?? "", "tracking")
                                }
                                className="mt-2 inline-flex h-8 items-center rounded-xl border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-900 transition hover:bg-neutral-50"
                              >
                                {copied === "tracking" ? "コピー済み" : "追跡番号をコピー"}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <span className="text-neutral-500">配送メモ</span>
                          <span className="max-w-[60%] whitespace-pre-wrap break-words text-right font-medium text-neutral-900">
                            {order.shippingNote || "記載なし"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        お届け先
                      </h3>

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
                  </div>

                  <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        注文内容
                      </h3>
                      <div className="text-sm font-semibold text-neutral-900">
                        {formatYen(order.totalAmount)}
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {order.items.map((item) => (
                        <div
                          key={`${order.id}-${item.id}-${item.slug}`}
                          className="flex gap-4 rounded-2xl bg-neutral-50 p-3"
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
                              {formatYen(item.price)} × {item.quantity}
                            </p>
                            <p className="mt-1 break-all text-xs text-neutral-400">
                              {item.slug}
                            </p>
                          </div>

                          <div className="text-sm font-semibold text-neutral-900">
                            {formatYen(item.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm leading-7 text-neutral-600">
                      ステータスや発送情報は、最新の注文データをもとに自動で更新されます。
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-neutral-900">
                  注文情報を表示できます
                </h2>
                <p className="mt-3 text-sm leading-7 text-neutral-600">
                  左側のフォームで検索するか、メール内の専用リンクからアクセスしてください。
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/shop"
                    className="inline-flex h-12 items-center rounded-2xl bg-neutral-900 px-6 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    ショップへ戻る
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default function OrderTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-neutral-500">Loading tracking page...</p>
        </div>
      }
    >
      <TrackingPageContent />
    </Suspense>
  )
}