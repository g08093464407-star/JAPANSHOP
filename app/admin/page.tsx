"use client"

import { useEffect, useMemo, useState } from "react"
import { products } from "@/data/products"

type OrderItem = {
  id: string
  name: string
  slug: string
  image: string
  price: number
  quantity: number
}

type OrderStatus = "paid" | "processing" | "shipped" | "delivered"

type AdminOrder = {
  id: string
  publicOrderNumber: string | null
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
  status: OrderStatus
  shippingCarrier: string | null
  trackingNumber: string | null
  shippingNote: string | null
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
  status: "" | OrderStatus
}

type CommentFilters = {
  q: string
  productId: string
}

type OrderDraft = {
  status: OrderStatus
  shippingCarrier: string
  trackingNumber: string
  shippingNote: string
}

type AdminProductComment = {
  id: string
  productId: string
  rating: number
  comment: string
  authorName: string
  voterHash: string
  createdAt: string
  updatedAt: string
}

type CommentDraft = {
  rating: number
  comment: string
  authorName: string
}

const statusOptions: OrderStatus[] = [
  "paid",
  "processing",
  "shipped",
  "delivered",
]

const PAGE_SIZE = 20
const COMMENTS_PAGE_SIZE = 20

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

function getProductName(productId: string) {
  return products.find((product) => product.slug === productId)?.name ?? productId
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

function createDraftFromOrder(order: AdminOrder): OrderDraft {
  return {
    status: order.status,
    shippingCarrier: order.shippingCarrier ?? "",
    trackingNumber: order.trackingNumber ?? "",
    shippingNote: order.shippingNote ?? "",
  }
}

function createDraftFromComment(comment: AdminProductComment): CommentDraft {
  return {
    rating: comment.rating,
    comment: comment.comment,
    authorName: comment.authorName,
  }
}

export default function AdminPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, OrderDraft>>({})
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

  const [comments, setComments] = useState<AdminProductComment[]>([])
  const [commentDrafts, setCommentDrafts] = useState<Record<string, CommentDraft>>({})
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState("")
  const [commentPage, setCommentPage] = useState(1)
  const [commentPagination, setCommentPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: COMMENTS_PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  })
  const [commentSearchInput, setCommentSearchInput] = useState("")
  const [commentProductFilter, setCommentProductFilter] = useState("")
  const [activeCommentFilters, setActiveCommentFilters] = useState<CommentFilters>({
    q: "",
    productId: "",
  })
  const [savingCommentId, setSavingCommentId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

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

      const nextDrafts: Record<string, OrderDraft> = {}

      for (const order of data.orders) {
        nextDrafts[order.id] = createDraftFromOrder(order)
      }

      setDrafts(nextDrafts)
    } catch (error) {
      console.error("Failed to load admin orders:", error)
      setError("注文一覧の取得中に通信エラーが発生しました。")
    } finally {
      setLoading(false)
    }
  }

  async function loadComments(targetPage: number, filters: CommentFilters) {
    try {
      setCommentsLoading(true)
      setCommentsError("")

      const params = new URLSearchParams()
      params.set("page", String(targetPage))
      params.set("pageSize", String(COMMENTS_PAGE_SIZE))

      if (filters.q.trim()) {
        params.set("q", filters.q.trim())
      }

      if (filters.productId) {
        params.set("productId", filters.productId)
      }

      const response = await fetch(
        `/api/admin/product-comments?${params.toString()}`,
        { cache: "no-store" }
      )

      const data = (await response.json()) as {
        comments?: AdminProductComment[]
        pagination?: PaginationInfo
        filters?: CommentFilters
        error?: string
      }

      if (!response.ok || !data.comments || !data.pagination || !data.filters) {
        setCommentsError(data.error ?? "コメント一覧の取得に失敗しました。")
        return
      }

      setComments(data.comments)
      setCommentPagination(data.pagination)
      setCommentPage(data.pagination.page)
      setActiveCommentFilters(data.filters)
      setCommentSearchInput(data.filters.q)
      setCommentProductFilter(data.filters.productId)

      const nextDrafts: Record<string, CommentDraft> = {}

      for (const comment of data.comments) {
        nextDrafts[comment.id] = createDraftFromComment(comment)
      }

      setCommentDrafts(nextDrafts)
    } catch (error) {
      console.error("Failed to load product comments:", error)
      setCommentsError("コメント一覧の取得中に通信エラーが発生しました。")
    } finally {
      setCommentsLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders(1, { q: "", status: "" })
    void loadComments(1, { q: "", productId: "" })
  }, [])

  const pageRevenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + order.totalAmount, 0)
  }, [orders])

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function updateDraft(orderId: string, patch: Partial<OrderDraft>) {
    setDrafts((prev) => {
      const current = prev[orderId]

      if (!current) {
        return prev
      }

      return {
        ...prev,
        [orderId]: {
          ...current,
          ...patch,
        },
      }
    })
  }

  function updateCommentDraft(commentId: string, patch: Partial<CommentDraft>) {
    setCommentDrafts((prev) => {
      const current = prev[commentId]

      if (!current) {
        return prev
      }

      return {
        ...prev,
        [commentId]: {
          ...current,
          ...patch,
        },
      }
    })
  }

  async function handleSave(orderId: string) {
    const draft = drafts[orderId]

    if (!draft) return

    if (
      draft.status === "shipped" &&
      (!draft.shippingCarrier.trim() || !draft.trackingNumber.trim())
    ) {
      alert("発送済みにする場合、配送業者と追跡番号は必須です。")
      return
    }

    try {
      setSavingId(orderId)

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: draft.status,
          shippingCarrier: draft.shippingCarrier,
          trackingNumber: draft.trackingNumber,
          shippingNote: draft.shippingNote,
        }),
      })

      const data = (await response.json()) as {
        order?: AdminOrder
        error?: string
      }

      if (!response.ok || !data.order) {
        alert(data.error ?? "注文更新に失敗しました。")
        setSavingId(null)
        return
      }

      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? data.order! : order))
      )

      setDrafts((prev) => ({
        ...prev,
        [orderId]: createDraftFromOrder(data.order!),
      }))

      alert("保存しました。")
    } catch (error) {
      console.error("Failed to update order:", error)
      alert("注文更新中に通信エラーが発生しました。")
    } finally {
      setSavingId(null)
    }
  }

  async function handleSaveComment(commentId: string) {
    const draft = commentDrafts[commentId]

    if (!draft) return

    if (!draft.comment.trim()) {
      alert("コメント本文を入力してください。")
      return
    }

    if (draft.rating < 1 || draft.rating > 5) {
      alert("評価は1〜5で入力してください。")
      return
    }

    try {
      setSavingCommentId(commentId)

      const response = await fetch(`/api/admin/product-comments/${commentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: draft.rating,
          comment: draft.comment,
          authorName: draft.authorName || "匿名",
        }),
      })

      const data = (await response.json()) as {
        comment?: AdminProductComment
        error?: string
      }

      if (!response.ok || !data.comment) {
        alert(data.error ?? "コメント更新に失敗しました。")
        return
      }

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId ? data.comment! : comment
        )
      )

      setCommentDrafts((prev) => ({
        ...prev,
        [commentId]: createDraftFromComment(data.comment!),
      }))

      alert("コメントを保存しました。")
    } catch (error) {
      console.error("Failed to update product comment:", error)
      alert("コメント更新中に通信エラーが発生しました。")
    } finally {
      setSavingCommentId(null)
    }
  }

  async function handleDeleteComment(commentId: string) {
    const ok = window.confirm("このコメントを削除しますか？")

    if (!ok) return

    try {
      setDeletingCommentId(commentId)

      const response = await fetch(`/api/admin/product-comments/${commentId}`, {
        method: "DELETE",
      })

      const data = (await response.json()) as { ok?: boolean; error?: string }

      if (!response.ok || !data.ok) {
        alert(data.error ?? "コメント削除に失敗しました。")
        return
      }

      setComments((prev) => prev.filter((comment) => comment.id !== commentId))
      await loadComments(commentPage, activeCommentFilters)
    } catch (error) {
      console.error("Failed to delete product comment:", error)
      alert("コメント削除中に通信エラーが発生しました。")
    } finally {
      setDeletingCommentId(null)
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

  async function handleApplyCommentFilters() {
    const nextFilters: CommentFilters = {
      q: commentSearchInput.trim(),
      productId: commentProductFilter,
    }

    await loadComments(1, nextFilters)
  }

  async function handleResetCommentFilters() {
    const nextFilters: CommentFilters = {
      q: "",
      productId: "",
    }

    setCommentSearchInput("")
    setCommentProductFilter("")
    await loadComments(1, nextFilters)
  }

  async function goToPrevPage() {
    if (!pagination.hasPrevPage || loading) return
    await loadOrders(page - 1, activeFilters)
  }

  async function goToNextPage() {
    if (!pagination.hasNextPage || loading) return
    await loadOrders(page + 1, activeFilters)
  }

  async function goToPrevCommentPage() {
    if (!commentPagination.hasPrevPage || commentsLoading) return
    await loadComments(commentPage - 1, activeCommentFilters)
  }

  async function goToNextCommentPage() {
    if (!commentPagination.hasNextPage || commentsLoading) return
    await loadComments(commentPage + 1, activeCommentFilters)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm tracking-[0.2em] text-neutral-500">ADMIN</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              注文管理
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
              受注状況を確認し、検索・絞り込み・発送情報を含む更新ができます。
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
                    const draft = drafts[order.id] ?? createDraftFromOrder(order)

                    return (
                      <FragmentRow
                        key={order.id}
                        order={order}
                        itemCount={itemCount}
                        isExpanded={isExpanded}
                        savingId={savingId}
                        draft={draft}
                        onToggleExpand={toggleExpand}
                        onDraftStatusChange={(status) => updateDraft(order.id, { status })}
                        onDraftShippingCarrierChange={(shippingCarrier) =>
                          updateDraft(order.id, { shippingCarrier })
                        }
                        onDraftTrackingNumberChange={(trackingNumber) =>
                          updateDraft(order.id, { trackingNumber })
                        }
                        onDraftShippingNoteChange={(shippingNote) =>
                          updateDraft(order.id, { shippingNote })
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
      </section>

      <section className="mt-14 border-t border-neutral-200 pt-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm tracking-[0.2em] text-neutral-500">COMMENTS</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              コメント管理
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
              商品ページに投稿されたコメントを確認し、編集・削除できます。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs tracking-[0.2em] text-neutral-500">TOTAL COMMENTS</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">
                {commentPagination.totalItems}
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs tracking-[0.2em] text-neutral-500">THIS PAGE</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">
                {comments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_0.9fr_auto_auto]">
            <input
              type="text"
              value={commentSearchInput}
              onChange={(e) => setCommentSearchInput(e.target.value)}
              placeholder="名前・コメント・商品IDで検索"
              className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
            />

            <select
              value={commentProductFilter}
              onChange={(e) => setCommentProductFilter(e.target.value)}
              className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
            >
              <option value="">すべての商品</option>
              {products.map((product) => (
                <option key={product.slug} value={product.slug}>
                  {product.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void handleApplyCommentFilters()}
              disabled={commentsLoading}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              検索
            </button>

            <button
              type="button"
              onClick={() => void handleResetCommentFilters()}
              disabled={commentsLoading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              リセット
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-neutral-600">
            <span className="font-medium text-neutral-900">{commentPagination.page}</span>
            <span> / {commentPagination.totalPages} ページ</span>
            <span className="mx-2 text-neutral-300">|</span>
            <span>合計 {commentPagination.totalItems} 件</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void goToPrevCommentPage()}
              disabled={!commentPagination.hasPrevPage || commentsLoading}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>

            <button
              type="button"
              onClick={() => void goToNextCommentPage()}
              disabled={!commentPagination.hasNextPage || commentsLoading}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {commentsLoading ? (
          <div className="rounded-[28px] border border-neutral-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-neutral-600">コメント読み込み中...</p>
          </div>
        ) : commentsError ? (
          <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 shadow-sm">
            <p className="text-sm text-red-700">{commentsError}</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-[28px] border border-neutral-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-neutral-600">該当するコメントはありません。</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {comments.map((comment) => {
              const draft = commentDrafts[comment.id] ?? createDraftFromComment(comment)

              return (
                <div
                  key={comment.id}
                  className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-xs tracking-[0.2em] text-neutral-500">
                        {getProductName(comment.productId)}
                      </div>
                      <div className="mt-2 text-sm text-neutral-500">
                        {formatDate(comment.createdAt)} / updated {formatDate(comment.updatedAt)}
                      </div>
                    </div>

                    <div className="break-all rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500">
                      {comment.productId}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[0.5fr_0.5fr_1.6fr_auto_auto] lg:items-start">
                    <div>
                      <label className="mb-1 block text-xs text-neutral-500">名前</label>
                      <input
                        value={draft.authorName}
                        onChange={(e) => updateCommentDraft(comment.id, { authorName: e.target.value })}
                        className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-neutral-500">評価</label>
                      <select
                        value={draft.rating}
                        onChange={(e) =>
                          updateCommentDraft(comment.id, {
                            rating: Number(e.target.value),
                          })
                        }
                        className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating} ★
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-neutral-500">コメント</label>
                      <textarea
                        value={draft.comment}
                        onChange={(e) =>
                          updateCommentDraft(comment.id, {
                            comment: e.target.value.slice(0, 220),
                          })
                        }
                        rows={3}
                        className="w-full resize-none rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                      />
                      <div className="mt-1 text-right text-[11px] text-neutral-400">
                        {draft.comment.length} / 220
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleSaveComment(comment.id)}
                      disabled={savingCommentId === comment.id}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingCommentId === comment.id ? "保存中..." : "保存"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDeleteComment(comment.id)}
                      disabled={deletingCommentId === comment.id}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingCommentId === comment.id ? "削除中..." : "削除"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

function FragmentRow({
  order,
  itemCount,
  isExpanded,
  savingId,
  draft,
  onToggleExpand,
  onDraftStatusChange,
  onDraftShippingCarrierChange,
  onDraftTrackingNumberChange,
  onDraftShippingNoteChange,
  onSave,
}: {
  order: AdminOrder
  itemCount: number
  isExpanded: boolean
  savingId: string | null
  draft: OrderDraft
  onToggleExpand: (id: string) => void
  onDraftStatusChange: (status: OrderStatus) => void
  onDraftShippingCarrierChange: (value: string) => void
  onDraftTrackingNumberChange: (value: string) => void
  onDraftShippingNoteChange: (value: string) => void
  onSave: () => void
}) {
  const shippingRequired =
    draft.status === "shipped" &&
    (!draft.shippingCarrier.trim() || !draft.trackingNumber.trim())

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
                {order.publicOrderNumber ?? order.id}
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
            value={draft.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onDraftStatusChange(e.target.value as OrderStatus)}
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

                <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-800">
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
                      {draft.status}
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="mb-3 text-sm font-semibold text-neutral-800">
                      発送情報
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs text-neutral-500">
                          配送業者
                        </label>
                        <input
                          type="text"
                          value={draft.shippingCarrier}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            onDraftShippingCarrierChange(e.target.value)
                          }
                          placeholder="例: Yamato / Sagawa / Japan Post"
                          className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs text-neutral-500">
                          追跡番号
                        </label>
                        <input
                          type="text"
                          value={draft.trackingNumber}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            onDraftTrackingNumberChange(e.target.value)
                          }
                          placeholder="追跡番号を入力"
                          className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs text-neutral-500">
                          備考
                        </label>
                        <textarea
                          value={draft.shippingNote}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            onDraftShippingNoteChange(e.target.value)
                          }
                          placeholder="任意の配送メモ"
                          rows={4}
                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                        />
                      </div>

                      {shippingRequired ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          ステータスを shipped にする場合、配送業者と追跡番号が必要です。
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {(order.shippingCarrier || order.trackingNumber || order.shippingNote) ? (
                    <div className="rounded-xl border border-neutral-200 bg-white p-4">
                      <div className="mb-2 text-xs text-neutral-500">保存済み発送情報</div>

                      <div className="space-y-1 text-sm text-neutral-800">
                        <div>
                          <span className="text-neutral-500">配送業者:</span>{" "}
                          {order.shippingCarrier || "—"}
                        </div>
                        <div>
                          <span className="text-neutral-500">追跡番号:</span>{" "}
                          {order.trackingNumber || "—"}
                        </div>
                        <div className="whitespace-pre-wrap break-words">
                          <span className="text-neutral-500">備考:</span>{" "}
                          {order.shippingNote || "—"}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}
