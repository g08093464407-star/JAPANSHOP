"use client"

import { useEffect, useMemo, useState } from "react"

type OrderItem = {
  id: string
  name: string
  slug: string
  image: string
  price: number
  quantity: number
}

type AdminOrder = {
  id: string
  stripeSessionId: string
  customerName: string
  customerEmail: string
  totalAmount: number
  items: OrderItem[]
  status: "paid" | "processing" | "shipped" | "delivered"
  createdAt: string
}

const statusOptions: AdminOrder["status"][] = [
  "paid",
  "processing",
  "shipped",
  "delivered",
]

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
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default function AdminPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [draftStatuses, setDraftStatuses] = useState<Record<string, AdminOrder["status"]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)

  async function loadOrders() {
    try {
      setLoading(true)
      setError("")

      const response = await fetch("/api/admin/orders", {
        cache: "no-store",
      })

      const data = (await response.json()) as {
        orders?: AdminOrder[]
        error?: string
      }

      if (!response.ok || !data.orders) {
        setError(data.error ?? "注文一覧の取得に失敗しました。")
        setLoading(false)
        return
      }

      setOrders(data.orders)

      const nextDrafts: Record<string, AdminOrder["status"]> = {}

      for (const order of data.orders) {
        nextDrafts[order.id] = order.status
      }

      setDraftStatuses(nextDrafts)
    } catch (error) {
      console.error("Failed to load admin orders:", error)
      setError("注文一覧の取得中に通信エラーが発生しました。")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  const totalOrders = useMemo(() => orders.length, [orders])

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + order.totalAmount, 0)
  }, [orders])

  async function handleSave(orderId: string) {
    const nextStatus = draftStatuses[orderId]

    if (!nextStatus) return

    try {
      setSavingId(orderId)

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      })

      const data = (await response.json()) as {
        order?: AdminOrder
        error?: string
      }

      if (!response.ok || !data.order) {
        alert(data.error ?? "ステータス更新に失敗しました。")
        setSavingId(null)
        return
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: data.order!.status } : order
        )
      )
    } catch (error) {
      console.error("Failed to update order status:", error)
      alert("ステータス更新中に通信エラーが発生しました。")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm tracking-[0.2em] text-neutral-500">ADMIN</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            注文管理
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
            受注状況を確認し、ステータスを更新できます。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs tracking-[0.2em] text-neutral-500">TOTAL ORDERS</p>
            <p className="mt-2 text-lg font-semibold text-neutral-900">{totalOrders}</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs tracking-[0.2em] text-neutral-500">TOTAL REVENUE</p>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              {formatYen(totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-neutral-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-neutral-600">読み込み中...</p>
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 shadow-sm">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-[28px] border border-neutral-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-neutral-600">注文はまだありません。</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-4 text-left font-medium text-neutral-600">注文日時</th>
                  <th className="px-4 py-4 text-left font-medium text-neutral-600">注文者</th>
                  <th className="px-4 py-4 text-left font-medium text-neutral-600">メール</th>
                  <th className="px-4 py-4 text-left font-medium text-neutral-600">合計</th>
                  <th className="px-4 py-4 text-left font-medium text-neutral-600">商品数</th>
                  <th className="px-4 py-4 text-left font-medium text-neutral-600">ステータス</th>
                  <th className="px-4 py-4 text-left font-medium text-neutral-600">操作</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => {
                  const itemCount = order.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  )

                  return (
                    <tr key={order.id} className="border-t border-neutral-200">
                      <td className="px-4 py-4 align-top text-neutral-800">
                        <div className="font-medium">{formatDate(order.createdAt)}</div>
                        <div className="mt-1 text-xs text-neutral-500 break-all">
                          {order.id}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top text-neutral-800">
                        {order.customerName}
                      </td>

                      <td className="px-4 py-4 align-top text-neutral-800 break-all">
                        {order.customerEmail}
                      </td>

                      <td className="px-4 py-4 align-top font-medium text-neutral-900">
                        {formatYen(order.totalAmount)}
                      </td>

                      <td className="px-4 py-4 align-top text-neutral-800">
                        {itemCount}点
                      </td>

                      <td className="px-4 py-4 align-top">
                        <select
                          value={draftStatuses[order.id] ?? order.status}
                          onChange={(e) =>
                            setDraftStatuses((prev) => ({
                              ...prev,
                              [order.id]: e.target.value as AdminOrder["status"],
                            }))
                          }
                          className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <button
                          type="button"
                          onClick={() => void handleSave(order.id)}
                          disabled={savingId === order.id}
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId === order.id ? "保存中..." : "保存"}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}