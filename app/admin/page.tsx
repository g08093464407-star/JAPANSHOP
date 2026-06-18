"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowUpRight,
  Boxes,
  HeartHandshake,
  MessageCircle,
  Package,
  RefreshCw,
  ShoppingBag,
  Star,
  TriangleAlert,
} from "lucide-react"

type OrderStatus = "paid" | "processing" | "shipped" | "delivered"

type AdminOrder = {
  id: string
  publicOrderNumber: string | null
  customerName: string
  customerEmail: string
  totalAmount: number
  status: OrderStatus
  createdAt: string
}

type AdminComment = {
  id: string
  productId: string
  rating: number
  comment: string
  authorName: string
  createdAt: string
}

type VoteSummary = {
  average: number
  total: number
}

type VoteTrustSummary = {
  attentionProductsCount: number
  lowRatingTotal: number
}

type CommentTrustSummary = {
  attentionProductsCount: number
  attentionLowRatingTotal: number
}

type ProductSummary = {
  total: number
  drafts: number
  needsData: number
  onSale: number
  limitedStock: number
  outOfStock: number
}

type OrderAttentionSummary = {
  paid: number
  processing: number
}

type CharityStats = {
  confirmedTotal: number
  confirmedOrders: number
  averageDonation: number
  firstTarget: number
  progress: number
  donationRate: number
}

type DashboardPeriod = "24h" | "7d" | "30d" | "all"
type DashboardAttentionItem = {
  id: string
  severity: "critical" | "warning" | "ok" | "info"
  domain: "orders" | "products" | "stock" | "trust" | "charity"
  title: string
  description?: string
  count?: number
  href?: string
  priority: number
}

type DashboardState = {
  orders: AdminOrder[]
  orderTotalItems: number
  orderAttention: OrderAttentionSummary
  recentOrders: AdminOrder[]
  recentOrderTotalItems: number
  productSummary: ProductSummary
  comments: AdminComment[]
  commentTotalItems: number
  voteSummary: VoteSummary
  voteTrustSummary: VoteTrustSummary
  commentTrustSummary: CommentTrustSummary
  charity: CharityStats | null
}

type DashboardSnapshot = {
  period: DashboardPeriod
  savedAt: string
  dashboard: DashboardState
}

const emptyDashboard: DashboardState = {
  orders: [],
  orderTotalItems: 0,
  orderAttention: {
    paid: 0,
    processing: 0,
  },
  recentOrders: [],
  recentOrderTotalItems: 0,
  productSummary: {
    total: 0,
    drafts: 0,
    needsData: 0,
    onSale: 0,
    limitedStock: 0,
    outOfStock: 0,
  },
  comments: [],
  commentTotalItems: 0,
  voteSummary: {
    average: 0,
    total: 0,
  },
  voteTrustSummary: {
    attentionProductsCount: 0,
    lowRatingTotal: 0,
  },
  commentTrustSummary: {
    attentionProductsCount: 0,
    attentionLowRatingTotal: 0,
  },
  charity: null,
}

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "24h", label: "24 години" },
  { value: "7d", label: "Тиждень" },
  { value: "30d", label: "Місяць" },
  { value: "all", label: "Весь період" },
]

function getDashboardCacheKey(period: DashboardPeriod) {
  return `sonyachna:admin-dashboard:v1:${period}`
}

function isDashboardPeriod(value: unknown): value is DashboardPeriod {
  return periodOptions.some((option) => option.value === value)
}

function finiteNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
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
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function normalizeProductSummary(value: unknown): ProductSummary | null {
  if (!value || typeof value !== "object") return null

  const record = value as Record<string, unknown>
  const summary = {
    total: Number(record.total),
    drafts: Number(record.drafts),
    needsData: Number(record.needsData),
    onSale: Number(record.onSale),
    limitedStock: Number(record.limitedStock),
    outOfStock: Number(record.outOfStock),
  }

  return Object.values(summary).every(Number.isFinite) ? summary : null
}

function normalizeVoteTrustSummary(value: unknown): VoteTrustSummary {
  if (!value || typeof value !== "object") {
    return { attentionProductsCount: 0, lowRatingTotal: 0 }
  }

  const record = value as Record<string, unknown>
  const attentionProductsCount = Number(record.attentionProductsCount)
  const lowRatingTotal = Number(record.lowRatingTotal)

  return {
    attentionProductsCount: Number.isFinite(attentionProductsCount)
      ? attentionProductsCount
      : 0,
    lowRatingTotal: Number.isFinite(lowRatingTotal) ? lowRatingTotal : 0,
  }
}

function normalizeCommentTrustSummary(value: unknown): CommentTrustSummary {
  if (!value || typeof value !== "object") {
    return { attentionProductsCount: 0, attentionLowRatingTotal: 0 }
  }

  const record = value as Record<string, unknown>
  const attentionProductsCount = Number(record.attentionProductsCount)
  const attentionLowRatingTotal = Number(record.attentionLowRatingTotal)

  return {
    attentionProductsCount: Number.isFinite(attentionProductsCount)
      ? attentionProductsCount
      : 0,
    attentionLowRatingTotal: Number.isFinite(attentionLowRatingTotal)
      ? attentionLowRatingTotal
      : 0,
  }
}

function normalizeVoteSummary(value: unknown): VoteSummary {
  if (!value || typeof value !== "object") {
    return { average: 0, total: 0 }
  }

  const record = value as Record<string, unknown>

  return {
    average: finiteNumber(record.average),
    total: finiteNumber(record.total),
  }
}

function getPaginationTotalItems(value: unknown) {
  if (!value || typeof value !== "object") return 0

  const record = value as Record<string, unknown>
  const pagination = record.pagination

  if (!pagination || typeof pagination !== "object") return 0

  return finiteNumber((pagination as Record<string, unknown>).totalItems)
}

function normalizeOrderAttention(value: unknown): OrderAttentionSummary {
  if (!value || typeof value !== "object") {
    return { paid: 0, processing: 0 }
  }

  const record = value as Record<string, unknown>

  return {
    paid: finiteNumber(record.paid),
    processing: finiteNumber(record.processing),
  }
}

function normalizeCharityStats(value: unknown): CharityStats | null {
  if (!value || typeof value !== "object") return null

  const record = value as Record<string, unknown>
  const stats = {
    confirmedTotal: finiteNumber(record.confirmedTotal),
    confirmedOrders: finiteNumber(record.confirmedOrders),
    averageDonation: finiteNumber(record.averageDonation),
    firstTarget: finiteNumber(record.firstTarget),
    progress: finiteNumber(record.progress),
    donationRate: finiteNumber(record.donationRate),
  }

  return Object.values(stats).every(Number.isFinite) ? stats : null
}

function normalizeDashboardState(value: unknown): DashboardState | null {
  if (!value || typeof value !== "object") return null

  const record = value as Record<string, unknown>
  const productSummary = normalizeProductSummary(record.productSummary)

  if (
    !productSummary ||
    !Array.isArray(record.orders) ||
    !Array.isArray(record.comments)
  ) {
    return null
  }

  return {
    orders: record.orders as AdminOrder[],
    orderTotalItems: finiteNumber(record.orderTotalItems),
    orderAttention: normalizeOrderAttention(record.orderAttention),
    recentOrders: Array.isArray(record.recentOrders)
      ? (record.recentOrders as AdminOrder[])
      : [],
    recentOrderTotalItems: finiteNumber(record.recentOrderTotalItems),
    productSummary,
    comments: record.comments as AdminComment[],
    commentTotalItems: finiteNumber(record.commentTotalItems),
    voteSummary: normalizeVoteSummary(record.voteSummary),
    voteTrustSummary: normalizeVoteTrustSummary(record.voteTrustSummary),
    commentTrustSummary: normalizeCommentTrustSummary(record.commentTrustSummary),
    charity: normalizeCharityStats(record.charity),
  }
}

function readDashboardSnapshot(period: DashboardPeriod): DashboardState | null {
  if (typeof window === "undefined") return null

  try {
    const rawSnapshot = window.sessionStorage.getItem(getDashboardCacheKey(period))

    if (!rawSnapshot) return null

    const snapshot = JSON.parse(rawSnapshot) as Partial<DashboardSnapshot>

    if (!isDashboardPeriod(snapshot.period) || snapshot.period !== period) {
      return null
    }

    return normalizeDashboardState(snapshot.dashboard)
  } catch {
    return null
  }
}

function writeDashboardSnapshot(
  period: DashboardPeriod,
  dashboard: DashboardState
) {
  if (typeof window === "undefined") return

  try {
    const snapshot: DashboardSnapshot = {
      period,
      savedAt: new Date().toISOString(),
      dashboard,
    }

    window.sessionStorage.setItem(
      getDashboardCacheKey(period),
      JSON.stringify(snapshot)
    )
  } catch {
    // Session cache is optional; dashboard rendering must not depend on it.
  }
}

async function fetchOptionalJson(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      return {}
    }

    return response.json()
  } catch {
    return {}
  }
}

async function fetchOptionalJsonResult(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      return { ok: false as const, data: null }
    }

    return { ok: true as const, data: await response.json() }
  } catch {
    return { ok: false as const, data: null }
  }
}

function metricTone(value: "dark" | "gold" | "green" | "blue" | "red") {
  const tones = {
    dark: "bg-neutral-950 text-white border-neutral-950",
    gold: "bg-[#fff7e4] text-[#8a5d18] border-[#ead3a6]",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    red: "bg-red-50 text-red-700 border-red-200",
  }

  return tones[value]
}

function attentionTone(severity: DashboardAttentionItem["severity"]) {
  const tones = {
    critical: "border-red-100 bg-red-50 text-red-700 hover:bg-red-100",
    warning: "border-amber-100 bg-amber-50 text-amber-800 hover:bg-amber-100",
    ok: "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    info: "border-[#eadfce] bg-[#fffaf2] text-neutral-600 hover:bg-white",
  }

  return tones[severity]
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: "dark" | "gold" | "green" | "blue" | "red"
}) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${metricTone(tone)}`}>
      {children}
    </span>
  )
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[linear-gradient(90deg,rgba(234,223,206,0.42),rgba(255,255,255,0.74),rgba(234,223,206,0.42))] ${className}`}
    />
  )
}

function DashboardCard({
  title,
  eyebrow,
  value,
  description,
  href,
  icon: Icon,
  tone = "dark",
}: {
  title: string
  eyebrow: string
  value: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  tone?: "dark" | "gold" | "green" | "blue" | "red"
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[22px] border border-[#eadfce] bg-white/76 p-3 shadow-[0_12px_28px_rgba(58,42,22,0.052)] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_20px_44px_rgba(58,42,22,0.10)] sm:p-3.5"
    >
      <div className="pointer-events-none absolute -right-14 -top-24 h-32 w-32 rounded-full bg-[#f1d18a]/18 blur-3xl transition group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.08em] text-[#a58d68]">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-normal text-neutral-950">{title}</h2>
        </div>

        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${metricTone(tone)}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <p className="relative mt-2 text-2xl font-semibold tracking-normal text-neutral-950">
        {value}
      </p>

      <p className="relative mt-1.5 text-xs leading-4 text-neutral-500">
        {description}
      </p>

      <div className="relative mt-2.5 inline-flex items-center gap-2 text-sm font-semibold text-neutral-950">
        Відкрити
        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  )
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardState>(emptyDashboard)
  const [hasDashboardData, setHasDashboardData] = useState(false)
  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [period, setPeriod] = useState<DashboardPeriod>("7d")
  const [attentionOverflowOpen, setAttentionOverflowOpen] = useState(false)
  const dashboardRequestSeqRef = useRef(0)

  async function loadDashboard(
    targetPeriod: DashboardPeriod,
    fallbackDashboard: DashboardState | null = null
  ) {
    const requestId = dashboardRequestSeqRef.current + 1
    dashboardRequestSeqRef.current = requestId
    const isLatestRequest = () => dashboardRequestSeqRef.current === requestId
    const fallbackOrderAttention =
      fallbackDashboard?.orderAttention ??
      (hasDashboardData && dashboardPeriod === targetPeriod
        ? dashboard.orderAttention
        : emptyDashboard.orderAttention)
    const fallbackRecentOrders =
      fallbackDashboard?.recentOrders ??
      (hasDashboardData && dashboardPeriod === targetPeriod
        ? dashboard.recentOrders
        : emptyDashboard.recentOrders)
    const fallbackRecentOrderTotalItems =
      fallbackDashboard?.recentOrderTotalItems ??
      (hasDashboardData && dashboardPeriod === targetPeriod
        ? dashboard.recentOrderTotalItems
        : emptyDashboard.recentOrderTotalItems)

    try {
      setLoading(true)
      setError("")
      const recentOrdersResultPromise = fetchOptionalJsonResult(
        "/api/admin/orders?page=1&pageSize=3&period=7d"
      )

      const [
        ordersResponse,
        productsResponse,
        commentsResponse,
        votesResponse,
        charityResponse,
      ] = await Promise.all([
        fetch(`/api/admin/orders?page=1&pageSize=5&period=${targetPeriod}`, {
          cache: "no-store",
        }),
        fetch("/api/admin/products?page=1&pageSize=1", { cache: "no-store" }),
        fetch("/api/admin/product-comments?page=1&pageSize=5", { cache: "no-store" }),
        fetch("/api/admin/product-votes?page=1&pageSize=5", { cache: "no-store" }),
        fetch(`/api/admin/charity?period=${targetPeriod}`, { cache: "no-store" }),
      ])

      const [
        ordersData,
        recentOrdersData,
        productsData,
        commentsData,
        votesData,
        charityData,
        voteTrustData,
        commentTrustData,
        paidOrderAttentionData,
        processingOrderAttentionData,
      ] =
        await Promise.all([
          ordersResponse.json(),
          recentOrdersResultPromise,
          productsResponse.json(),
          commentsResponse.json(),
          votesResponse.json(),
          charityResponse.json(),
          fetchOptionalJson("/api/admin/product-votes/summary"),
          fetchOptionalJson("/api/admin/product-comments/summary"),
          fetchOptionalJsonResult(
            "/api/admin/orders?page=1&pageSize=1&status=paid"
          ),
          fetchOptionalJsonResult(
            "/api/admin/orders?page=1&pageSize=1&status=processing"
          ),
        ])

      const productSummary = normalizeProductSummary(productsData.summary)

      if (!productSummary) {
        throw new Error("Product summary is missing from /api/admin/products.")
      }

      if (!isLatestRequest()) return

      const hasValidRecentOrders =
        recentOrdersData.ok &&
        recentOrdersData.data !== null &&
        typeof recentOrdersData.data === "object" &&
        Array.isArray((recentOrdersData.data as Record<string, unknown>).orders)

      const nextDashboard: DashboardState = {
        orders: Array.isArray(ordersData.orders) ? ordersData.orders : [],
        orderTotalItems: Number(ordersData.pagination?.totalItems ?? 0),
        orderAttention: {
          paid: paidOrderAttentionData.ok
            ? getPaginationTotalItems(paidOrderAttentionData.data)
            : fallbackOrderAttention.paid,
          processing: processingOrderAttentionData.ok
            ? getPaginationTotalItems(processingOrderAttentionData.data)
            : fallbackOrderAttention.processing,
        },
        recentOrders: hasValidRecentOrders
          ? ((recentOrdersData.data as Record<string, unknown>).orders as AdminOrder[])
          : fallbackRecentOrders,
        recentOrderTotalItems: hasValidRecentOrders
          ? getPaginationTotalItems(recentOrdersData.data)
          : fallbackRecentOrderTotalItems,
        productSummary,
        comments: Array.isArray(commentsData.comments) ? commentsData.comments : [],
        commentTotalItems: Number(commentsData.pagination?.totalItems ?? 0),
        voteSummary: {
          average: Number(votesData.summary?.average ?? 0),
          total: Number(votesData.summary?.total ?? 0),
        },
        voteTrustSummary: normalizeVoteTrustSummary(
          voteTrustData.summary ?? voteTrustData
        ),
        commentTrustSummary: normalizeCommentTrustSummary(
          commentTrustData.summary ?? commentTrustData
        ),
        charity: charityData.stats ?? null,
      }

      setDashboard(nextDashboard)
      setHasDashboardData(true)
      setDashboardPeriod(targetPeriod)
      writeDashboardSnapshot(targetPeriod, nextDashboard)
    } catch (loadError) {
      if (!isLatestRequest()) return

      console.error("Failed to load admin dashboard:", loadError)
      setError("Не вдалося завантажити панель. Перевір API або підключення до бази.")
    } finally {
      if (isLatestRequest()) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const cachedDashboard = readDashboardSnapshot(period)

    if (cachedDashboard) {
      setDashboard(cachedDashboard)
      setHasDashboardData(true)
      setDashboardPeriod(period)
    } else {
      setDashboard(emptyDashboard)
      setHasDashboardData(false)
      setDashboardPeriod(null)
    }

    void loadDashboard(period, cachedDashboard)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const hasVisibleDashboardData = hasDashboardData && dashboardPeriod === period

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat("uk-UA", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date())
  }, [])

  const stats = useMemo(() => {
    const ordersToPack = dashboard.orders.filter((order) =>
      order.status === "paid" || order.status === "processing"
    ).length
    const pageRevenue = dashboard.orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const activeProducts = dashboard.productSummary.onSale
    const stockIssues =
      dashboard.productSummary.limitedStock + dashboard.productSummary.outOfStock
    const readinessIssues = dashboard.productSummary.needsData

    return {
      ordersToPack,
      pageRevenue,
      activeProducts,
      stockIssues,
      readinessIssues,
    }
  }, [dashboard])

  const attentionRows = useMemo(() => {
    const items: DashboardAttentionItem[] = [
      {
        id: "paid-orders",
        severity: dashboard.orderAttention.paid > 0 ? "critical" : "ok",
        domain: "orders",
        title:
          dashboard.orderAttention.paid > 0
            ? `${dashboard.orderAttention.paid} оплачених замовлень чекають пакування.`
            : "Оплачених замовлень без пакування немає.",
        href: "/admin/orders?status=paid",
        count: dashboard.orderAttention.paid,
        priority: 10,
      },
      {
        id: "processing-orders",
        severity: dashboard.orderAttention.processing > 0 ? "warning" : "ok",
        domain: "orders",
        title:
          dashboard.orderAttention.processing > 0
            ? `${dashboard.orderAttention.processing} замовлень зараз в обробці.`
            : "Замовлення в обробці не потребують уваги.",
        href: "/admin/orders?status=processing",
        count: dashboard.orderAttention.processing,
        priority: 20,
      },
      {
        id: "out-of-stock",
        severity: dashboard.productSummary.outOfStock > 0 ? "critical" : "ok",
        domain: "stock",
        title:
          dashboard.productSummary.outOfStock > 0
            ? `${dashboard.productSummary.outOfStock} товарів немає на складі.`
            : "Товарів без складу немає.",
        href: "/admin/products?issue=outOfStock",
        count: dashboard.productSummary.outOfStock,
        priority: 30,
      },
      {
        id: "limited-stock",
        severity: dashboard.productSummary.limitedStock > 0 ? "warning" : "ok",
        domain: "stock",
        title:
          dashboard.productSummary.limitedStock > 0
            ? `${dashboard.productSummary.limitedStock} товарів мають малий залишок.`
            : "Товарів з малим залишком немає.",
        href: "/admin/products?issue=limitedStock",
        count: dashboard.productSummary.limitedStock,
        priority: 40,
      },
      {
        id: "needs-data",
        severity: stats.readinessIssues > 0 ? "warning" : "ok",
        domain: "products",
        title:
          stats.readinessIssues > 0
            ? `${stats.readinessIssues} товарів потребують обовʼязкових даних.`
            : "Товарів з браком обовʼязкових даних немає.",
        href: "/admin/products?issue=needsData",
        count: stats.readinessIssues,
        priority: 50,
      },
      {
        id: "low-votes",
        severity: dashboard.voteTrustSummary.lowRatingTotal > 0 ? "warning" : "ok",
        domain: "trust",
        title:
          dashboard.voteTrustSummary.lowRatingTotal > 0
            ? `${dashboard.voteTrustSummary.lowRatingTotal} низьких оцінок у ${dashboard.voteTrustSummary.attentionProductsCount} товарах.`
            : "Низьких оцінок немає.",
        href: "/admin/votes?issue=lowRatings",
        count: dashboard.voteTrustSummary.lowRatingTotal,
        priority: 60,
      },
      {
        id: "low-comments",
        severity:
          dashboard.commentTrustSummary.attentionLowRatingTotal > 0
            ? "warning"
            : "ok",
        domain: "trust",
        title:
          dashboard.commentTrustSummary.attentionLowRatingTotal > 0
            ? `${dashboard.commentTrustSummary.attentionLowRatingTotal} коментарів з низькою оцінкою.`
            : "Коментарів з низькою оцінкою немає.",
        href: "/admin/comments?issue=lowRatings",
        count: dashboard.commentTrustSummary.attentionLowRatingTotal,
        priority: 70,
      },
    ]

    const activeItems = items
      .filter((item) => item.severity !== "ok" && (item.count ?? 0) > 0)
      .sort((first, second) => first.priority - second.priority)
    const visibleActiveItems = activeItems.slice(0, 3)
    const hiddenActiveItems = activeItems.slice(3)
    const visibleItems =
      visibleActiveItems.length > 0
        ? visibleActiveItems
        : [
            {
              id: "no-critical-signals",
              severity: "ok",
              domain: "products",
              title: "Критичних сигналів немає.",
              priority: 100,
            } satisfies DashboardAttentionItem,
          ]

    return {
      visible: visibleItems,
      hidden: hiddenActiveItems,
      hiddenCount: hiddenActiveItems.length,
    }
  }, [
    dashboard.productSummary.limitedStock,
    dashboard.productSummary.outOfStock,
    dashboard.voteTrustSummary.attentionProductsCount,
    dashboard.voteTrustSummary.lowRatingTotal,
    dashboard.commentTrustSummary.attentionLowRatingTotal,
    dashboard.orderAttention.paid,
    dashboard.orderAttention.processing,
    stats.readinessIssues,
  ])

  useEffect(() => {
    if (!attentionOverflowOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAttentionOverflowOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [attentionOverflowOpen])

  return (
    <div className="space-y-4 font-sans [letter-spacing:normal]">
      <section className="overflow-hidden rounded-[26px] border border-[#eadfce] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,249,238,0.78)_54%,rgba(240,216,174,0.52))] p-3.5 shadow-[0_18px_48px_rgba(58,42,22,0.065)] sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[#a58d68]">
              {todayLabel}
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-normal text-neutral-950 sm:text-3xl">
              Що потребує уваги
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-5 tracking-normal text-neutral-600">
              Це новий центр керування: замовлення й благодійність фільтруються за періодом, а товари, коментарі й оцінки поки показують поточний стан.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <div className="flex flex-wrap gap-1.5 rounded-full border border-[#eadfce] bg-white/72 p-1">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={`h-8 rounded-full px-3 text-xs font-semibold transition ${
                    period === option.value
                      ? "bg-neutral-950 text-white"
                      : "text-neutral-600 hover:bg-white hover:text-neutral-950"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                void loadDashboard(
                  period,
                  hasVisibleDashboardData ? dashboard : readDashboardSnapshot(period)
                )
              }
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[#d8c6aa] bg-white/78 px-4 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-60"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Оновити
            </button>

            {hasVisibleDashboardData && loading ? (
              <span className="text-xs font-semibold text-[#a58d68]">
                Оновлюється...
              </span>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {!hasVisibleDashboardData ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[18px] border border-[#eadfce] bg-white/72 p-2.5"
              >
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="mt-2 h-7 w-24" />
                <SkeletonBlock className="mt-2 h-8 w-full" />
              </div>
            ))
          ) : (
            <>
              <div className="rounded-[18px] border border-[#eadfce] bg-white/72 p-2.5">
                <p className="text-xs text-neutral-500">Пакування</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-normal text-neutral-950">{stats.ordersToPack}</p>
                <p className="mt-1.5 text-xs leading-4 text-neutral-500">
                  Оплачені або в обробці замовлення за вибраний період.
                </p>
              </div>

              <div className="rounded-[18px] border border-[#eadfce] bg-white/72 p-2.5">
                <p className="text-xs text-neutral-500">Виручка</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-normal text-neutral-950">
                  {formatYen(stats.pageRevenue)}
                </p>
                <p className="mt-1.5 text-xs leading-4 text-neutral-500">
                  Сума останніх замовлень за вибраний період; не повна фінансова звітність.
                </p>
              </div>

              <div className="rounded-[18px] border border-[#eadfce] bg-white/72 p-2.5">
                <p className="text-xs text-neutral-500">Проблеми товарів</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-normal text-neutral-950">{stats.readinessIssues}</p>
                <p className="mt-1.5 text-xs leading-4 text-neutral-500">
                  Товари, де бракує даних для публікації або Smart Box.
                </p>
              </div>

              <div className="rounded-[18px] border border-[#eadfce] bg-white/72 p-2.5">
                <p className="text-xs text-neutral-500">Благодійність</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-normal text-neutral-950">
                  {dashboard.charity ? formatYen(dashboard.charity.confirmedTotal) : "—"}
                </p>
                <p className="mt-1.5 text-xs leading-4 text-neutral-500">
                  Підтверджені внески за вибраний період.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
        {!hasVisibleDashboardData ? (
          <>
            <div className="rounded-[22px] border border-[#eadfce] bg-white/76 p-3.5 shadow-[0_12px_28px_rgba(58,42,22,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="mt-2 h-6 w-48" />
                </div>
                <SkeletonBlock className="h-5 w-5 rounded-full" />
              </div>
              <div className="mt-3 space-y-2">
                <SkeletonBlock className="h-9 w-full" />
                <SkeletonBlock className="h-9 w-full" />
                <SkeletonBlock className="h-9 w-3/4" />
              </div>
            </div>

            <div className="rounded-[22px] border border-[#eadfce] bg-white/76 p-3.5 shadow-[0_12px_28px_rgba(58,42,22,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SkeletonBlock className="h-3 w-24" />
                  <SkeletonBlock className="mt-2 h-6 w-40" />
                </div>
                <SkeletonBlock className="h-4 w-8" />
              </div>
              <div className="mt-3 space-y-2">
                <SkeletonBlock className="h-11 w-full" />
                <SkeletonBlock className="h-11 w-full" />
                <SkeletonBlock className="h-11 w-full" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-[22px] border border-[#eadfce] bg-white/76 p-3.5 shadow-[0_12px_28px_rgba(58,42,22,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[#a58d68]">
                    Attention
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-normal text-neutral-950">
                    Що не можна ігнорувати
                  </h2>
                </div>
                <TriangleAlert className="h-5 w-5 text-[#b9852b]" />
              </div>

              <div className="mt-3 space-y-2">
                {attentionRows.visible.map((item) =>
                  item.href ? (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`block rounded-2xl border px-3 py-2 text-sm transition ${attentionTone(item.severity)}`}
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <div
                      key={item.id}
                      className={`rounded-2xl border px-3 py-2 text-sm ${attentionTone(item.severity)}`}
                    >
                      {item.title}
                    </div>
                  )
                )}

                {attentionRows.hiddenCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setAttentionOverflowOpen(true)}
                    className="w-full rounded-2xl border border-[#eadfce] bg-white/70 px-3 py-2 text-left text-sm font-semibold text-neutral-600 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
                  >
                    +{attentionRows.hiddenCount} інших сигналів
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-[22px] border border-[#eadfce] bg-white/76 p-3.5 shadow-[0_12px_28px_rgba(58,42,22,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[#a58d68]">
                    Recent Orders
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-normal text-neutral-950">
                    Останні замовлення
                  </h2>
                </div>
                {dashboard.recentOrderTotalItems >= 3 ? (
                  <Link href="/admin/orders" className="text-sm font-semibold text-neutral-950 hover:underline">
                    Показати всі
                  </Link>
                ) : null}
              </div>

              <div className="mt-3 space-y-2">
                {dashboard.recentOrders.length > 0 ? (
                  dashboard.recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href="/admin/orders"
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[#eee3d2] bg-[#fffaf2]/80 px-3 py-2 transition hover:bg-white hover:shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-950">
                          {order.publicOrderNumber ?? order.id}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-neutral-500">
                          {order.customerName} · {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral-950">
                          {formatYen(order.totalAmount)}
                        </p>
                        <StatusPill tone={order.status === "paid" ? "gold" : order.status === "shipped" ? "blue" : "green"}>
                          {order.status}
                        </StatusPill>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-[#eadfce] p-4 text-sm text-neutral-500">
                    Замовлень за останній тиждень немає.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {!hasVisibleDashboardData ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[22px] border border-[#eadfce] bg-white/76 p-3 shadow-[0_12px_28px_rgba(58,42,22,0.052)] sm:p-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="mt-2 h-5 w-28" />
                </div>
                <SkeletonBlock className="h-8 w-8 rounded-xl" />
              </div>
              <SkeletonBlock className="mt-3 h-8 w-20" />
              <SkeletonBlock className="mt-2 h-8 w-full" />
              <SkeletonBlock className="mt-3 h-4 w-20" />
            </div>
          ))
        ) : (
          <>
            <DashboardCard
              title="Замовлення"
              eyebrow="Orders"
              value={String(dashboard.orderTotalItems)}
              description={`${stats.ordersToPack} потребують операційної уваги. Деталі, статуси й пакування доступні на окремій сторінці замовлень.`}
              href="/admin/orders"
              icon={ShoppingBag}
              tone={stats.ordersToPack > 0 ? "gold" : "green"}
            />

            <DashboardCard
              title="Товари"
              eyebrow="Products"
              value={String(dashboard.productSummary.total)}
              description={`${stats.activeProducts} в продажу. ${stats.readinessIssues} потребують обовʼязкових даних.`}
              href="/admin/products"
              icon={Package}
              tone={stats.readinessIssues > 0 ? "red" : "green"}
            />

            <DashboardCard
              title="Складські ризики"
              eyebrow="Products"
              value={String(stats.stockIssues)}
              description="Товари з малим залишком або без складу за глобальним зведенням товарів."
              href="/admin/products"
              icon={Boxes}
              tone={stats.stockIssues > 0 ? "red" : "blue"}
            />

            <DashboardCard
              title="Коментарі"
              eyebrow="Trust"
              value={String(dashboard.commentTotalItems)}
              description={dashboard.comments.length > 0 ? `Останній: ${dashboard.comments[0]?.authorName ?? "невідомий автор"}` : "Коментарів у вибірці немає."}
              href="/admin/comments"
              icon={MessageCircle}
              tone="blue"
            />

            <DashboardCard
              title="Оцінки"
              eyebrow="Votes"
              value={dashboard.voteSummary.average > 0 ? dashboard.voteSummary.average.toFixed(1) : "—"}
              description={`${dashboard.voteSummary.total} оцінок у системі. Це показник довіри, не просто декоративні зірочки.`}
              href="/admin/votes"
              icon={Star}
              tone="gold"
            />

            <DashboardCard
              title="Благодійність"
              eyebrow="Charity"
              value={dashboard.charity ? `${dashboard.charity.progress}%` : "—"}
              description={dashboard.charity ? `${dashboard.charity.confirmedOrders} замовлень, середній внесок ${formatYen(dashboard.charity.averageDonation)}.` : "Дані ще не завантажені."}
              href="/admin/charity"
              icon={HeartHandshake}
              tone="green"
            />
          </>
        )}
      </section>

      {attentionOverflowOpen && attentionRows.hidden.length > 0 ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/35 px-4 py-6"
          onClick={() => setAttentionOverflowOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-[28px] border border-[#eadfce] bg-[#fffdf8] shadow-[0_28px_80px_rgba(24,24,27,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#eadfce] px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a58d68]">
                  Сигнали
                </p>
                <h2 className="mt-1.5 text-xl font-semibold tracking-normal text-neutral-950">
                  Інші сигнали
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setAttentionOverflowOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-2xl border border-[#d8c6aa] bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-[#fffaf2]"
              >
                Закрити
              </button>
            </div>

            <div className="grid gap-2 px-5 py-4">
              {attentionRows.hidden.map((item) =>
                item.href ? (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`block rounded-2xl border px-3 py-2 text-sm transition ${attentionTone(item.severity)}`}
                    onClick={() => setAttentionOverflowOpen(false)}
                  >
                    {item.title}
                  </Link>
                ) : (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-3 py-2 text-sm ${attentionTone(item.severity)}`}
                  >
                    {item.title}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
