"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Copy,
  Download,
  Inbox,
  Mail,
  MapPin,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  Search,
  Send,
  Truck,
} from "lucide-react"
import type { OrderItem, OrderShippingSnapshot } from "@/types/order"

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
  itemsSubtotal: number
  shippingAmount: number
  items: OrderItem[]
  shippingSnapshot: OrderShippingSnapshot | null
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
  archive: "active" | "archived"
}

type OrderDraft = {
  status: OrderStatus
  shippingCarrier: string
  trackingNumber: string
  shippingNote: string
}

type OrdersResponse = {
  orders?: AdminOrder[]
  pagination?: PaginationInfo
  filters?: ApiFilters
  error?: string
}

const PAGE_SIZE = 20
const statusOptions: OrderStatus[] = ["paid", "processing", "shipped", "delivered"]

const statusLabels: Record<OrderStatus, string> = {
  paid: "Оплачено",
  processing: "В обробці",
  shipped: "Відправлено",
  delivered: "Доставлено",
}

function formatYen(amount: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value: string) {
  const date = new Date(value)

  return new Intl.DateTimeFormat("uk-UA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatCompactDate(value: string) {
  const date = new Date(value)

  return new Intl.DateTimeFormat("uk-UA", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatCm3(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—"
  return `${value.toLocaleString("uk-UA")} см³`
}

function formatKg(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—"
  return `${(value / 1000).toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} кг`
}

function statusTone(status: OrderStatus) {
  if (status === "paid") return "border-rose-200 bg-rose-50 text-rose-800"
  if (status === "processing") return "border-amber-200 bg-amber-50 text-amber-800"
  if (status === "shipped") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  return "border-neutral-200 bg-neutral-50 text-neutral-600"
}

function statusCardGlow(status: OrderStatus) {
  if (status === "paid") return "shadow-[0_0_0_1px_rgba(244,63,94,0.10),0_8px_22px_rgba(244,63,94,0.16)]"
  if (status === "processing") return "shadow-[0_0_0_1px_rgba(245,158,11,0.10),0_8px_22px_rgba(245,158,11,0.15)]"
  if (status === "shipped") return "shadow-[0_0_0_1px_rgba(16,185,129,0.10),0_8px_22px_rgba(16,185,129,0.14)]"
  return "shadow-[0_8px_20px_rgba(64,64,64,0.035)]"
}

function createDraftFromOrder(order: AdminOrder): OrderDraft {
  return {
    status: order.status,
    shippingCarrier: order.shippingCarrier ?? "日本郵便",
    trackingNumber: order.trackingNumber ?? "",
    shippingNote: order.shippingNote ?? "",
  }
}

function itemCount(order: AdminOrder) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0)
}

function getOrderLabel(order: AdminOrder) {
  return order.publicOrderNumber ?? order.id
}

function getOrderVolume(order: AdminOrder) {
  if (typeof order.shippingSnapshot?.totalVolumeCm3 === "number") {
    return order.shippingSnapshot.totalVolumeCm3
  }

  return order.items.reduce((sum, item) => {
    const volume = typeof item.volumeCm3 === "number" ? item.volumeCm3 : 0
    return sum + volume * item.quantity
  }, 0)
}

function getOrderWeight(order: AdminOrder) {
  if (typeof order.shippingSnapshot?.totalWeightGrams === "number") {
    return order.shippingSnapshot.totalWeightGrams
  }

  return order.items.reduce((sum, item) => {
    const weight = typeof item.weightGrams === "number" ? item.weightGrams : 0
    return sum + weight * item.quantity
  }, 0)
}

function getStatusIcon(status: OrderStatus) {
  if (status === "paid") return Inbox
  if (status === "processing") return PackageOpen
  if (status === "shipped") return Truck
  return ClipboardCheck
}

function OrderItemImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f4ead9] text-[10px] text-neutral-400">
        Немає зображення
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-14 w-14 shrink-0 rounded-2xl object-cover"
      onError={() => setFailed(true)}
    />
  )
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <div className="rounded-[24px] border border-[#eadfce] bg-white/72 p-4 shadow-[0_16px_34px_rgba(58,42,22,0.04)]">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-normal text-neutral-950">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-neutral-500">{description}</p>
    </div>
  )
}

function DetailLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#eee3d2] py-3 text-sm last:border-0">
      <span className="text-neutral-500">{label}</span>
      <span className="max-w-[70%] text-right font-medium text-neutral-950">{value}</span>
    </div>
  )
}

function ShippingSnapshotCard({ snapshot }: { snapshot: OrderShippingSnapshot | null }) {
  if (!snapshot) {
    return (
      <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        Для цього замовлення немає знімка доставки. Ймовірно, воно створене до впровадження Smart Box-історії.
      </section>
    )
  }

  const fillPercent =
    typeof snapshot.fillPercent === "number"
      ? Math.max(0, Math.min(100, snapshot.fillPercent))
      : 0

  return (
    <section className="rounded-[28px] border border-[#eadfce] bg-white/78 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="sonyachna-admin-eyebrow text-[#a58d68]">Smart Box</p>
          <h3 className="mt-2 text-xl font-semibold text-neutral-950">
            Коробка й доставка
          </h3>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700">
          <PackageCheck className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#eee3d2] bg-[#fffaf2] p-4">
          <p className="text-xs text-neutral-500">Коробка</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-950">
            {snapshot.boxType ? `${snapshot.boxType} коробка` : snapshot.boxLabel || "—"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            ゆうパック{snapshot.shippingSize || "—"}サイズ
          </p>
        </div>

        <div className="rounded-2xl border border-[#eee3d2] bg-[#fffaf2] p-4">
          <p className="text-xs text-neutral-500">Орієнтовна вага</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-950">
            {formatKg(snapshot.totalWeightGrams)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Тільки товари, без додаткової ваги коробки.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#eee3d2] bg-white p-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-neutral-500">Заповнення коробки</span>
          <span className="font-semibold text-neutral-950">{fillPercent}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#f2eadf]">
          <div
            className="h-full rounded-full bg-neutral-950 transition-all duration-700"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <div className="mt-4 grid gap-2 text-xs text-neutral-600 sm:grid-cols-3">
          <span>Товарів: {formatCm3(snapshot.totalVolumeCm3)}</span>
          <span>Місткість: {formatCm3(snapshot.boxUsableVolumeCm3)}</span>
          <span>Залишок: {formatCm3(snapshot.remainingVolumeCm3)}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-1 text-sm">
        <DetailLine label="Звідки" value={snapshot.originPrefecture || "—"} />
        <DetailLine label="Куди" value={snapshot.destinationPrefecture || "—"} />
        <DetailLine label="Перевізник" value={`${snapshot.carrier || "—"} / ${snapshot.service || "—"}`} />
      </div>
    </section>
  )
}

function OrderListItem({
  order,
  selected,
  selectedForBulk,
  onSelect,
  onToggleSelection,
}: {
  order: AdminOrder
  selected: boolean
  selectedForBulk: boolean
  onSelect: (id: string) => void
  onToggleSelection: (id: string) => void
}) {
  const Icon = getStatusIcon(order.status)
  const snapshot = order.shippingSnapshot

  return (
    <article
      className={`w-full rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_42px_rgba(58,42,22,0.075)] ${
        selected
          ? "border-neutral-950 bg-white shadow-[0_18px_42px_rgba(58,42,22,0.09)]"
          : `border-[#eadfce] bg-white/70 ${statusCardGlow(order.status)}`
      }`}
    >
      <div className="flex items-start gap-3">
        <label
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[#d8c6aa] bg-white text-neutral-900 transition hover:bg-[#fffaf2]"
          onClick={(event) => event.stopPropagation()}
        >
          <span className="sr-only">Вибрати {getOrderLabel(order)}</span>
          <input
            type="checkbox"
            checked={selectedForBulk}
            onChange={() => onToggleSelection(order.id)}
            className="h-4 w-4 rounded border-[#cbb898] text-neutral-950 accent-neutral-950"
          />
        </label>

        <button
          type="button"
          onClick={() => onSelect(order.id)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-950">
                {getOrderLabel(order)}
              </p>
              <p className="mt-1 truncate text-xs text-neutral-500">
                {order.customerName} · {formatCompactDate(order.createdAt)}
              </p>
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(order.status)}`}>
              <Icon className="h-3.5 w-3.5" />
              {statusLabels[order.status]}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-neutral-500">
            <span>
              <b className="block text-sm text-neutral-950">{formatYen(order.totalAmount)}</b>
              сума
            </span>
            <span>
              <b className="block text-sm text-neutral-950">{itemCount(order)}</b>
              одиниць
            </span>
            <span>
              <b className="block text-sm text-neutral-950">
                {snapshot?.boxType ? `${snapshot.boxType}` : "—"}
              </b>
              коробка
            </span>
          </div>
        </button>
      </div>
    </article>
  )
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, OrderDraft>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkArchiving, setBulkArchiving] = useState(false)
  const [bulkRestoring, setBulkRestoring] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkArchiveError, setBulkArchiveError] = useState("")
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
  const [archiveFilter, setArchiveFilter] = useState<ApiFilters["archive"]>("active")
  const [activeFilters, setActiveFilters] = useState<ApiFilters>({
    q: "",
    status: "",
    archive: "active",
  })

  function isOrderSelected(orderId: string) {
    return selectedOrderIds.includes(orderId)
  }

  function toggleOrderSelection(orderId: string) {
    setSelectedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((selectedOrderId) => selectedOrderId !== orderId)
        : [...current, orderId]
    )
  }

  function clearSelection() {
    setSelectedOrderIds([])
    setBulkArchiveError("")
  }

  function selectCurrentPage() {
    const currentPageOrderIds = orders.map((order) => order.id)

    setSelectedOrderIds((current) => {
      return Array.from(new Set([...current, ...currentPageOrderIds]))
    })
  }

  function refreshOrdersBadge() {
    window.dispatchEvent(new Event("sonyachna:orders-badge-refresh"))
  }

  async function loadOrders(targetPage: number, filters: ApiFilters) {
    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams()
      params.set("page", String(targetPage))
      params.set("pageSize", String(PAGE_SIZE))
      params.set("_ts", String(Date.now()))

      if (filters.q.trim()) {
        params.set("q", filters.q.trim())
      }

      if (filters.status) {
        params.set("status", filters.status)
      }

      params.set("archive", filters.archive)

      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
        cache: "no-store",
      })

      const data = (await response.json()) as OrdersResponse

      if (!response.ok || !data.orders || !data.pagination || !data.filters) {
        setError(data.error ?? "Не вдалося завантажити замовлення.")
        return
      }

      setOrders(data.orders)
      setPagination(data.pagination)
      setPage(data.pagination.page)
      setActiveFilters(data.filters)
      setSearchInput(data.filters.q)
      setStatusFilter(data.filters.status)
      setArchiveFilter(data.filters.archive)
      clearSelection()

      const nextDrafts: Record<string, OrderDraft> = {}

      for (const order of data.orders) {
        nextDrafts[order.id] = createDraftFromOrder(order)
      }

      setDrafts(nextDrafts)

      if (data.orders.length === 0) {
        setSelectedId(null)
        return
      }

      setSelectedId((current) => {
        if (current && data.orders?.some((order) => order.id === current)) {
          return current
        }

        return data.orders?.[0]?.id ?? null
      })
    } catch (loadError) {
      console.error("Failed to load admin orders:", loadError)
      setError("Помилка звʼязку під час завантаження замовлень.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders(1, { q: "", status: "", archive: "active" })
  }, [])

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === selectedId) ?? orders[0] ?? null
  }, [orders, selectedId])

  const selectedDraft = selectedOrder
    ? drafts[selectedOrder.id] ?? createDraftFromOrder(selectedOrder)
    : null

  const stats = useMemo(() => {
    const toPack = orders.filter(
      (order) => order.status === "paid" || order.status === "processing"
    ).length
    const pageRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const totalVolume = orders.reduce((sum, order) => sum + getOrderVolume(order), 0)
    const totalWeight = orders.reduce((sum, order) => sum + getOrderWeight(order), 0)

    return {
      toPack,
      pageRevenue,
      totalVolume,
      totalWeight,
    }
  }, [orders])

  function updateDraft(orderId: string, patch: Partial<OrderDraft>) {
    setDrafts((current) => {
      const draft = current[orderId]

      if (!draft) return current

      return {
        ...current,
        [orderId]: {
          ...draft,
          ...patch,
        },
      }
    })
  }

  async function applyFilters() {
    await loadOrders(1, {
      q: searchInput.trim(),
      status: statusFilter,
      archive: archiveFilter,
    })
  }

  async function resetFilters() {
    setSearchInput("")
    setStatusFilter("")
    await loadOrders(1, { q: "", status: "", archive: archiveFilter })
  }

  async function changeArchiveFilter(nextArchive: ApiFilters["archive"]) {
    if (archiveFilter === nextArchive || loading) return

    setArchiveFilter(nextArchive)
    clearSelection()
    setBulkModalOpen(false)
    await loadOrders(1, {
      q: searchInput.trim(),
      status: statusFilter,
      archive: nextArchive,
    })
  }

  async function goToPrevPage() {
    if (!pagination.hasPrevPage || loading) return
    await loadOrders(page - 1, activeFilters)
  }

  async function goToNextPage() {
    if (!pagination.hasNextPage || loading) return
    await loadOrders(page + 1, activeFilters)
  }

  async function refreshOrdersPage() {
    await loadOrders(page, activeFilters)
    refreshOrdersBadge()
  }

  async function saveOrder(order: AdminOrder) {
    const draft = drafts[order.id]

    if (!draft) return

    if (
      draft.status === "shipped" &&
      (!draft.shippingCarrier.trim() || !draft.trackingNumber.trim())
    ) {
      alert("Для статусу “Відправлено” потрібні перевізник і tracking number.")
      return
    }

    try {
      setSavingId(order.id)

      const response = await fetch(`/api/admin/orders/${order.id}`, {
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
        alert(data.error ?? "Не вдалося зберегти замовлення.")
        return
      }

      setOrders((current) =>
        current.map((currentOrder) =>
          currentOrder.id === order.id ? data.order! : currentOrder
        )
      )
      setDrafts((current) => ({
        ...current,
        [order.id]: createDraftFromOrder(data.order!),
      }))
      const savedId = data.order.id

      setSavedOrderId(savedId)
      window.setTimeout(() => {
        setSavedOrderId((current) => (current === savedId ? null : current))
      }, 1800)
      refreshOrdersBadge()
    } catch (saveError) {
      console.error("Failed to save order:", saveError)
      alert("Помилка звʼязку під час збереження замовлення.")
    } finally {
      setSavingId(null)
    }
  }

  async function archiveSelectedOrders() {
    if (selectedOrderIds.length === 0 || bulkArchiving || bulkRestoring || bulkDeleting) return

    const idsToArchive = [...selectedOrderIds]
    const failedIds: string[] = []

    try {
      setBulkArchiving(true)
      setBulkArchiveError("")

      for (const orderId of idsToArchive) {
        try {
          const response = await fetch(`/api/admin/orders/${orderId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ action: "archive" }),
          })

          const data = (await response.json()) as {
            order?: AdminOrder
            error?: string
          }

          if (!response.ok || !data.order) {
            failedIds.push(orderId)
          }
        } catch (archiveError) {
          console.error("Failed to archive order:", archiveError)
          failedIds.push(orderId)
        }
      }

      if (failedIds.length > 0) {
        setBulkArchiveError(
          `Не вдалося архівувати ${failedIds.length} з ${idsToArchive.length} замовлень.`
        )
        await loadOrders(page, activeFilters)
        refreshOrdersBadge()
        setSelectedOrderIds(failedIds)
        return
      }

      clearSelection()
      setBulkModalOpen(false)
      await loadOrders(page, activeFilters)
      refreshOrdersBadge()
    } finally {
      setBulkArchiving(false)
    }
  }

  async function restoreSelectedOrders() {
    if (selectedOrderIds.length === 0 || bulkArchiving || bulkRestoring || bulkDeleting) return

    const idsToRestore = [...selectedOrderIds]
    const failedIds: string[] = []

    try {
      setBulkRestoring(true)
      setBulkArchiveError("")

      for (const orderId of idsToRestore) {
        try {
          const response = await fetch(`/api/admin/orders/${orderId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ action: "restore" }),
          })

          const data = (await response.json()) as {
            order?: AdminOrder
            error?: string
          }

          if (!response.ok || !data.order) {
            failedIds.push(orderId)
          }
        } catch (restoreError) {
          console.error("Failed to restore order:", restoreError)
          failedIds.push(orderId)
        }
      }

      if (failedIds.length > 0) {
        setBulkArchiveError(
          `Не вдалося повернути ${failedIds.length} з ${idsToRestore.length} замовлень.`
        )
        await loadOrders(page, activeFilters)
        refreshOrdersBadge()
        setSelectedOrderIds(failedIds)
        return
      }

      clearSelection()
      setBulkModalOpen(false)
      await loadOrders(page, activeFilters)
      refreshOrdersBadge()
    } finally {
      setBulkRestoring(false)
    }
  }

  async function deleteSelectedOrders() {
    if (
      activeFilters.archive !== "archived" ||
      selectedOrderIds.length === 0 ||
      bulkArchiving ||
      bulkRestoring ||
      bulkDeleting
    ) {
      return
    }

    const ok = window.confirm("Це остаточне видалення. Продовжити?")

    if (!ok) return

    const idsToDelete = [...selectedOrderIds]
    const failedIds: string[] = []

    try {
      setBulkDeleting(true)
      setBulkArchiveError("")

      for (const orderId of idsToDelete) {
        try {
          const response = await fetch(`/api/admin/orders/${orderId}`, {
            method: "DELETE",
          })

          const data = (await response.json()) as { ok?: boolean; error?: string }

          if (!response.ok || !data.ok) {
            failedIds.push(orderId)
          }
        } catch (deleteError) {
          console.error("Failed to bulk delete order:", deleteError)
          failedIds.push(orderId)
        }
      }

      if (failedIds.length > 0) {
        setBulkArchiveError(
          `Не вдалося видалити ${failedIds.length} з ${idsToDelete.length} замовлень.`
        )
        await loadOrders(page, activeFilters)
        refreshOrdersBadge()
        setSelectedOrderIds(failedIds)
        return
      }

      clearSelection()
      setBulkModalOpen(false)
      await loadOrders(page, activeFilters)
      refreshOrdersBadge()
    } finally {
      setBulkDeleting(false)
    }
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard is optional for admin UX; failing silently is acceptable here.
    }
  }

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[34px] border border-[#eadfce] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,249,238,0.78)_54%,rgba(240,216,174,0.52))] p-6 shadow-[0_24px_70px_rgba(58,42,22,0.08)] sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="sonyachna-admin-eyebrow text-[#a58d68]">Замовлення</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-neutral-950 sm:text-5xl">
              Замовлення
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
              Окрема операційна сторінка для пакування, статусів, трекінгу й Smart Box-даних. Тут має бути видно, яку коробку брати і що саме класти всередину.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:items-start xl:items-end">
            <div className="flex flex-wrap gap-2 rounded-full border border-[#eadfce] bg-white/72 p-1">
              <button
                type="button"
                onClick={() => void changeArchiveFilter("active")}
                disabled={loading}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  archiveFilter === "active"
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-600 hover:bg-white hover:text-neutral-950"
                }`}
              >
                <Inbox className="h-4 w-4" />
                Активні
              </button>
              <button
                type="button"
                onClick={() => void changeArchiveFilter("archived")}
                disabled={loading}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  archiveFilter === "archived"
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-600 hover:bg-white hover:text-neutral-950"
                }`}
              >
                <Archive className="h-4 w-4" />
                Архів
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void refreshOrdersPage()}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d8c6aa] bg-white/78 px-5 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Оновити
              </button>

              {archiveFilter === "archived" ? (
                <a
                  href="/api/admin/orders/export"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800"
                >
                  <Download className="h-4 w-4" />
                  Експорт архіву
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Пакування"
            value={String(stats.toPack)}
            description="Оплачені або в обробці замовлення з поточної вибірки."
          />
          <SummaryCard
            label="Виручка у вибірці"
            value={formatYen(stats.pageRevenue)}
            description="Не повна фінансова звітність; тільки поточна сторінка."
          />
          <SummaryCard
            label="Обʼєм у вибірці"
            value={formatCm3(stats.totalVolume)}
            description="Сума товарного обʼєму за поточною сторінкою."
          />
          <SummaryCard
            label="Вага у вибірці"
            value={formatKg(stats.totalWeight)}
            description="Орієнтовна вага товарів без коробок і прокладок."
          />
        </div>
      </section>

      <section className="rounded-[30px] border border-[#eadfce] bg-white/76 p-4 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
        <div className="grid gap-3 xl:grid-cols-[1.2fr_0.7fr_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void applyFilters()
                }
              }}
              placeholder="Імʼя, email, номер замовлення або Stripe session"
              className="h-11 w-full rounded-2xl border border-[#e2d6c4] bg-white px-10 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ApiFilters["status"])}
            className="h-11 rounded-2xl border border-[#e2d6c4] bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
          >
            <option value="">Усі статуси</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void applyFilters()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:opacity-50"
          >
            Шукати
          </button>

          <button
            type="button"
            onClick={() => void resetFilters()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d8c6aa] bg-white px-5 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:bg-[#fffaf2] disabled:opacity-50"
          >
            Скинути
          </button>
        </div>
      </section>

      {error ? (
        <section className="rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[#eadfce] bg-white/72 px-4 py-3 text-sm text-neutral-600">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void goToPrevPage()}
                disabled={!pagination.hasPrevPage || loading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d8c6aa] bg-white text-neutral-900 transition hover:bg-[#fffaf2] disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Попередня сторінка"
                title="Попередня сторінка"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <span>
                <b className="font-semibold text-neutral-950">{pagination.page}</b> / {pagination.totalPages} стор.
                <span className="mx-2 text-neutral-300">|</span>
                {pagination.totalItems} замовлень
              </span>
              <button
                type="button"
                onClick={() => void goToNextPage()}
                disabled={!pagination.hasNextPage || loading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d8c6aa] bg-white text-neutral-900 transition hover:bg-[#fffaf2] disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Наступна сторінка"
                title="Наступна сторінка"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span>{orders.length} у списку</span>
              <button
                type="button"
                onClick={selectCurrentPage}
                disabled={loading || orders.length === 0}
                className="inline-flex h-9 items-center justify-center rounded-full border border-[#d8c6aa] bg-white px-3 text-xs font-semibold text-neutral-900 transition hover:bg-[#fffaf2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Вибрати всі на сторінці
              </button>
            </div>
          </div>

          {selectedOrderIds.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[#eadfce] bg-[#fffaf2] px-4 py-3 text-sm text-neutral-700">
              <span>
                Вибрано:{" "}
                <b className="font-semibold text-neutral-950">{selectedOrderIds.length}</b>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={clearSelection}
                  className="inline-flex h-9 items-center justify-center rounded-full border border-[#d8c6aa] bg-white px-3 text-xs font-semibold text-neutral-900 transition hover:bg-white/80"
                >
                  Скасувати вибір
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkArchiveError("")
                    setBulkModalOpen(true)
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-neutral-950 px-3 text-xs font-semibold text-white transition hover:bg-neutral-800"
                >
                  Дії з вибраними
                </button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3">
            {loading ? (
              <div className="rounded-[28px] border border-[#eadfce] bg-white/72 p-8 text-sm text-neutral-500">
                Завантаження замовлень...
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-[28px] border border-[#eadfce] bg-white/72 p-8 text-sm text-neutral-500">
                Замовлень за цими фільтрами немає.
              </div>
            ) : (
              orders.map((order) => (
                <OrderListItem
                  key={order.id}
                  order={order}
                  selected={selectedOrder?.id === order.id}
                  selectedForBulk={isOrderSelected(order.id)}
                  onSelect={setSelectedId}
                  onToggleSelection={toggleOrderSelection}
                />
              ))
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void goToPrevPage()}
              disabled={!pagination.hasPrevPage || loading}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#d8c6aa] bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-[#fffaf2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </button>
            <button
              type="button"
              onClick={() => void goToNextPage()}
              disabled={!pagination.hasNextPage || loading}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Далі
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {selectedOrder ? (
          <div className="space-y-5">
            <section className="rounded-[30px] border border-[#eadfce] bg-white/78 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="sonyachna-admin-eyebrow text-[#a58d68]">Вибране замовлення</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="break-all text-2xl font-semibold text-neutral-950">
                      {getOrderLabel(selectedOrder)}
                    </h2>
                    <button
                      type="button"
                      onClick={() => void copyText(getOrderLabel(selectedOrder))}
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-[#eadfce] bg-[#fffaf2] px-3 text-xs font-semibold text-neutral-700 transition hover:bg-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Копіювати
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    {formatDate(selectedOrder.createdAt)} · {selectedOrder.stripeSessionId}
                  </p>
                </div>

                <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold ${statusTone(selectedOrder.status)}`}>
                  {statusLabels[selectedOrder.status]}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#eee3d2] bg-[#fffaf2] p-4">
                  <p className="text-xs text-neutral-500">Сума</p>
                  <p className="mt-2 text-xl font-semibold text-neutral-950">
                    {formatYen(selectedOrder.totalAmount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#eee3d2] bg-[#fffaf2] p-4">
                  <p className="text-xs text-neutral-500">Товари</p>
                  <p className="mt-2 text-xl font-semibold text-neutral-950">
                    {itemCount(selectedOrder)} од.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#eee3d2] bg-[#fffaf2] p-4">
                  <p className="text-xs text-neutral-500">Доставка</p>
                  <p className="mt-2 text-xl font-semibold text-neutral-950">
                    {formatYen(selectedOrder.shippingAmount)}
                  </p>
                </div>
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-[28px] border border-[#eadfce] bg-white/78 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#eadfce] bg-[#fffaf2] text-neutral-700">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-neutral-950">Клієнт і адреса</p>
                    <p className="mt-1 text-sm text-neutral-500">Дані для відправки.</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-1">
                  <DetailLine label="Імʼя" value={selectedOrder.customerName} />
                  <DetailLine label="Email" value={selectedOrder.customerEmail} />
                  <DetailLine label="〒" value={selectedOrder.customerPostalCode} />
                  <DetailLine label="Префектура" value={selectedOrder.customerPrefecture} />
                  <DetailLine label="Місто" value={selectedOrder.customerCity} />
                  <DetailLine label="Адреса" value={selectedOrder.customerAddressLine1} />
                  {selectedOrder.customerAddressLine2 ? (
                    <DetailLine label="Будівля" value={selectedOrder.customerAddressLine2} />
                  ) : null}
                </div>

                <a
                  href={`mailto:${selectedOrder.customerEmail}`}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl border border-[#d8c6aa] bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:bg-[#fffaf2]"
                >
                  <Mail className="h-4 w-4" />
                  Написати клієнту
                </a>
              </section>

              <ShippingSnapshotCard snapshot={selectedOrder.shippingSnapshot} />
            </div>

            <section className="rounded-[28px] border border-[#eadfce] bg-white/78 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="sonyachna-admin-eyebrow text-[#a58d68]">Товари</p>
                  <h3 className="mt-2 text-xl font-semibold text-neutral-950">
                    Що пакувати
                  </h3>
                </div>
                <span className="rounded-full border border-[#eadfce] bg-[#fffaf2] px-3 py-1 text-xs font-semibold text-neutral-600">
                  {itemCount(selectedOrder)} одиниць
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {selectedOrder.items.map((item) => (
                  <div
                    key={`${selectedOrder.id}-${item.id}-${item.slug}`}
                    className="grid gap-4 rounded-2xl border border-[#eee3d2] bg-[#fffaf2]/80 p-4 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <OrderItemImage src={item.image} alt={item.name} />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-950">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {formatYen(item.price)} × {item.quantity} · {item.slug}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-500">
                        <span className="rounded-full bg-white px-2.5 py-1">
                          {item.lengthCm ?? "—"}×{item.widthCm ?? "—"}×{item.heightCm ?? "—"} cm
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1">
                          {formatCm3(item.volumeCm3)} / товар
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1">
                          {formatKg(item.weightGrams)} / товар
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-neutral-950">
                        {formatYen(item.price * item.quantity)}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        разом {formatCm3((item.volumeCm3 ?? 0) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {selectedDraft ? (
              <section className="rounded-[28px] border border-[#eadfce] bg-white/78 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#eadfce] bg-[#fffaf2] text-neutral-700">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-neutral-950">Статус і трекінг</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Якщо ставиш “Відправлено”, потрібні перевізник і номер відстеження.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-neutral-700">Статус</span>
                    <select
                      value={selectedDraft.status}
                      onChange={(event) =>
                        updateDraft(selectedOrder.id, {
                          status: event.target.value as OrderStatus,
                        })
                      }
                      className="h-11 rounded-2xl border border-[#e2d6c4] bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-neutral-700">Перевізник</span>
                    <input
                      value={selectedDraft.shippingCarrier}
                      onChange={(event) =>
                        updateDraft(selectedOrder.id, {
                          shippingCarrier: event.target.value,
                        })
                      }
                      placeholder="日本郵便"
                      className="h-11 rounded-2xl border border-[#e2d6c4] bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-neutral-700">Трекінг-номер</span>
                    <input
                      value={selectedDraft.trackingNumber}
                      onChange={(event) =>
                        updateDraft(selectedOrder.id, {
                          trackingNumber: event.target.value,
                        })
                      }
                      placeholder="1234-5678-..."
                      className="h-11 rounded-2xl border border-[#e2d6c4] bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
                    />
                  </label>
                </div>

                <label className="mt-4 grid gap-2 text-sm">
                  <span className="font-medium text-neutral-700">Внутрішня нотатка</span>
                  <textarea
                    value={selectedDraft.shippingNote}
                    onChange={(event) =>
                      updateDraft(selectedOrder.id, {
                        shippingNote: event.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Особливості пакування, контакт із клієнтом, ручна перевірка..."
                    className="rounded-2xl border border-[#e2d6c4] bg-white px-4 py-3 text-sm leading-6 text-neutral-950 outline-none transition focus:border-neutral-950"
                  />
                </label>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void saveOrder(selectedOrder)}
                    disabled={savingId === selectedOrder.id}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:opacity-60"
                  >
                    {savingId === selectedOrder.id ? (
                      <>
                        <Truck className="h-4 w-4" />
                        Збереження...
                      </>
                    ) : savedOrderId === selectedOrder.id ? (
                      <>
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white opacity-100 transition duration-200 ease-out">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        Збережено
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4" />
                        Зберегти
                      </>
                    )}
                  </button>

                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[30px] border border-[#eadfce] bg-white/72 p-8 text-sm text-neutral-500">
            Вибери замовлення зі списку.
          </div>
        )}
      </section>

      {bulkModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/35 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-orders-title"
            className="w-full max-w-lg rounded-[30px] border border-[#eadfce] bg-white p-6 shadow-[0_28px_80px_rgba(58,42,22,0.18)]"
          >
            <div>
              <p className="sonyachna-admin-eyebrow text-[#a58d68]">Дії з вибраними</p>
              <h2
                id="bulk-orders-title"
                className="mt-2 text-2xl font-semibold tracking-normal text-neutral-950"
              >
                Що зробити з вибраними замовленнями?
              </h2>
              <p className="mt-3 text-sm text-neutral-600">
                Вибрано:{" "}
                <b className="font-semibold text-neutral-950">{selectedOrderIds.length}</b>
              </p>
            </div>

            {activeFilters.archive === "active" ? (
              <div className="mt-5 rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4 text-sm leading-6 text-neutral-700">
                Сховати з робочого списку. Дані залишаться у базі.
              </div>
            ) : null}

            {bulkArchiveError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {bulkArchiveError}
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {activeFilters.archive === "active" ? (
                <button
                  type="button"
                  onClick={() => void archiveSelectedOrders()}
                  disabled={bulkArchiving || bulkRestoring || bulkDeleting || selectedOrderIds.length === 0}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bulkArchiving ? "Архівування..." : "Архівувати"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void restoreSelectedOrders()}
                  disabled={bulkArchiving || bulkRestoring || bulkDeleting || selectedOrderIds.length === 0}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bulkRestoring ? "Повернення..." : "Повернути в активні"}
                </button>
              )}
              {activeFilters.archive === "archived" ? (
                <button
                  type="button"
                  onClick={() => void deleteSelectedOrders()}
                  disabled={bulkArchiving || bulkRestoring || bulkDeleting || selectedOrderIds.length === 0}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bulkDeleting ? "Видалення..." : "Видалити остаточно"}
                </button>
              ) : (
                <span className="group relative inline-flex">
                  <button
                    type="button"
                    disabled
                    className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-semibold text-red-700 opacity-55"
                  >
                    Видалити остаточно
                  </button>
                  <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl bg-neutral-950 px-3 py-2 text-xs font-semibold text-white shadow-[0_14px_34px_rgba(23,23,23,0.22)] group-hover:block">
                    Остаточне видалення можливе після архівації.
                  </span>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setBulkArchiveError("")
                  setBulkModalOpen(false)
                }}
                disabled={bulkArchiving || bulkRestoring || bulkDeleting}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d8c6aa] bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-[#fffaf2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Скасувати
              </button>
            </div>

          </div>
        </div>
      ) : null}
    </div>
  )
}
