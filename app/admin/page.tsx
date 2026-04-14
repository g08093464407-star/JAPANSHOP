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
  customerPostalCode: string
  customerPrefecture: string
  customerCity: string
  customerAddressLine1: string
  customerAddressLine2: string
  totalAmount: number
  items: OrderItem[]
  status: "paid" | "processing" | "shipped" | "delivered"
  createdAt: string
}

type PaginationInfo = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
}

type ApiFilters = {
  q: string
  status: "" | "paid" | "processing" | "shipped" | "delivered"
}

const statusOptions: AdminOrder["status"][] = [
  "paid",
  "processing",
  "shipped",
  "delivered",
]

const PAGE_SIZE = 20

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

function OrderItemImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-neutral-100 text-xs text-neutral-400">
        No image
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-14 w-14 rounded-lg object-cover"
      onError={() => setFailed(true)}
    />
  )
}

export default function AdminPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [draftStatuses, setDraftStatuses] = useState<
    Record<string, AdminOrder["status"]>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  })

  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState<ApiFilters["status"]>("")
  const [activeFilters, setActiveFilters] = useState<ApiFilters>({
    q: "",
    status: "",
  })

  async function loadOrders(targetPage: number, filters: ApiFilters) {
    try {
      setLoading(true)
      setError("")
      setExpandedId(null)

      const params = new URLSearchParams()
      params.set("page", String(targetPage))
      params.set("pageSize", String(PAGE_SIZE))

      if (filters.q.trim()) {
        params.set("q", filters.q.trim())
      }

      if (filters.status) {
        params.set("status", filters.status)
      }

      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
        cache: "no-store",
      })

      const data = (await response.json()) as {
        orders?: AdminOrder[]
        pagination?: PaginationInfo
        filters?: ApiFilters
        error?: string
      }

      if (!response.ok || !data.orders || !data.pagination || !data.filters) {
        setError(data.error ?? "注文一覧の取得に失敗しました。")
        setLoading(false)
        return
      }

      setOrders(data.orders)
      setPagination(data.pagination)
      setPage(data.pagination.page)
      setActiveFilters(data.filters)
      setSearchInput(data.filters.q)
      setStatusFilter(data.filters.status)

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
    void loadOrders(1, { q: "", status: "" })
  }, [])

  const pageRevenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + order.totalAmount, 0)
  }, [orders])

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

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

      setDraftStatuses((prev) => ({
        ...prev,
        [orderId]: data.order!.status,
      }))
    } catch (error) {
      console.error("Failed to update order status:", error)
      alert("ステータス更新中に通信エラーが発生しました。")
    } finally {
      setSavingId(null)
    }
  }

  async function handleApplyFilters() {
    const nextFilters: ApiFilters = {
      q: searchInput.trim(),
      status: statusFilter,
    }

    await loadOrders(1, nextFilters)
  }

  async function handleResetFilters() {
    const nextFilters: ApiFilters = {
      q: "",
      status: "",
    }

    setSearchInput("")
    setStatusFilter("")
    await loadOrders(1, nextFilters)
  }

  async function goToPrevPage() {
    if (!pagination.hasPrevPage || loading) return
    await loadOrders(page - 1, activeFilters)
  }

  async function goToNextPage() {
    if (!pagination.hasNextPage || loading) return
    await loadOrders(page + 1, activeFilters)
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
            受注状況を確認し、検索・絞り込み・ステータス更新ができます。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs tracking-[0.2em] text-neutral-500">TOTAL ORDERS</p>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              {pagination.totalItems}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs tracking-[0.2em] text-neutral-500">THIS PAGE</p>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              {orders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs tracking-[0.2em] text-neutral-500">PAGE REVENUE</p>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              {formatYen(pageRevenue)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_auto_auto]">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="注文者名またはメールで検索"
            className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApiFilters["status"])}
            className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
          >
            <option value="">すべてのステータス</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void handleApplyFilters()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            検索
          </button>

          <button
            type="button"
            onClick={() => void handleResetFilters()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            リセット
          </button>
        </div>

        {(activeFilters.q || activeFilters.status) && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
            {activeFilters.q ? (
              <span className="rounded-full bg-neutral-100 px-3 py-1">
                検索: {activeFilters.q}
              </span>
            ) : null}

            {activeFilters.status ? (
              <span className="rounded-full bg-neutral-100 px-3 py-1">
                ステータス: {activeFilters.status}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-neutral-600">
          <span className="font-medium text-neutral-900">{pagination.page}</span>
          <span> / {pagination.totalPages} ページ</span>
          <span className="mx-2 text-neutral-300">|</span>
          <span>合計 {pagination.totalItems} 件</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void goToPrevPage()}
            disabled={!pagination.hasPrevPage || loading}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>

          <button
            type="button"
            onClick={() => void goToNextPage()}
            disabled={!pagination.hasNextPage || loading}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
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
          <p className="text-sm text-neutral-600">該当する注文はありません。</p>
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
                  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
                  const isExpanded = expandedId === order.id

                  return (
                    <FragmentRow
                      key={order.id}
                      order={order}
                      itemCount={itemCount}
                      isExpanded={isExpanded}
                      savingId={savingId}
                      draftStatus={draftStatuses[order.id] ?? order.status}
                      onToggleExpand={toggleExpand}
                      onDraftStatusChange={(status) =>
                        setDraftStatuses((prev) => ({
                          ...prev,
                          [order.id]: status,
                        }))
                      }
                      onSave={() => void handleSave(order.id)}
                    />
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

function FragmentRow({
  order,
  itemCount,
  isExpanded,
  savingId,
  draftStatus,
  onToggleExpand,
  onDraftStatusChange,
  onSave,
}: {
  order: AdminOrder
  itemCount: number
  isExpanded: boolean
  savingId: string | null
  draftStatus: AdminOrder["status"]
  onToggleExpand: (id: string) => void
  onDraftStatusChange: (status: AdminOrder["status"]) => void
  onSave: () => void
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-t border-neutral-200 transition hover:bg-neutral-50"
        onClick={() => onToggleExpand(order.id)}
      >
        <td className="px-4 py-4 align-top text-neutral-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{formatDate(order.createdAt)}</div>
              <div className="mt-1 break-all text-xs text-neutral-500">
                {order.id}
              </div>
            </div>

            <div className="pt-1 text-xs text-neutral-400">
              {isExpanded ? "▲" : "▼"}
            </div>
          </div>
        </td>

        <td className="px-4 py-4 align-top text-neutral-800">
          {order.customerName}
        </td>

        <td className="px-4 py-4 align-top break-all text-neutral-800">
          {order.customerEmail}
        </td>

        <td className="px-4 py-4 align-top font-medium text-neutral-900">
          {formatYen(order.totalAmount)}
        </td>

        <td className="px-4 py-4 align-top text-neutral-800">{itemCount}点</td>

        <td className="px-4 py-4 align-top">
          <select
            value={draftStatus}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              onDraftStatusChange(e.target.value as AdminOrder["status"])
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
            onClick={(e) => {
              e.stopPropagation()
              onSave()
            }}
            disabled={savingId === order.id}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingId === order.id ? "保存中..." : "保存"}
          </button>
        </td>
      </tr>

      {isExpanded ? (
        <tr className="bg-neutral-50">
          <td colSpan={7} className="px-4 py-6">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-neutral-700">
                  商品詳細
                </h3>

                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={`${order.id}-${item.id}`}
                      className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"
                    >
                      <OrderItemImage src={item.image} alt={item.name} />

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-neutral-900">
                          {item.name}
                        </div>
                        <div className="mt-1 text-xs text-neutral-500">
                          {item.quantity} × {formatYen(item.price)}
                        </div>
                        <div className="mt-1 break-all text-xs text-neutral-400">
                          {item.slug}
                        </div>
                      </div>

                      <div className="text-sm font-semibold text-neutral-900">
                        {formatYen(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-neutral-700">
                  注文情報
                </h3>

                <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-800">
                  <div>
                    <div className="text-xs text-neutral-500">注文者</div>
                    <div className="mt-1">{order.customerName}</div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-500">メール</div>
                    <div className="mt-1 break-all">{order.customerEmail}</div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-500">配送先住所</div>
                    <div className="mt-1">
                      <div>〒{order.customerPostalCode}</div>
                      <div>
                        {order.customerPrefecture}
                        {order.customerCity}
                      </div>
                      <div>{order.customerAddressLine1}</div>
                      {order.customerAddressLine2 ? (
                        <div>{order.customerAddressLine2}</div>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-500">Stripe Session</div>
                    <div className="mt-1 break-all text-xs text-neutral-600">
                      {order.stripeSessionId}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-500">現在のステータス</div>
                    <div className="mt-1 font-medium text-neutral-900">
                      {draftStatus}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}