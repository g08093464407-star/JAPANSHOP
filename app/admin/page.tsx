"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
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

type ProductSummary = {
  total: number
  drafts: number
  needsData: number
  onSale: number
  limitedStock: number
  outOfStock: number
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

type DashboardState = {
  orders: AdminOrder[]
  orderTotalItems: number
  productSummary: ProductSummary
  comments: AdminComment[]
  commentTotalItems: number
  voteSummary: VoteSummary
  charity: CharityStats | null
}

const emptyDashboard: DashboardState = {
  orders: [],
  orderTotalItems: 0,
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
  charity: null,
}

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "24h", label: "24 години" },
  { value: "7d", label: "Тиждень" },
  { value: "30d", label: "Місяць" },
  { value: "all", label: "Весь період" },
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
      className="group relative overflow-hidden rounded-[30px] border border-[#eadfce] bg-white/76 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.06)] transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_28px_64px_rgba(58,42,22,0.11)]"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-[#f1d18a]/22 blur-3xl transition group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.08em] text-[#a58d68]">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-normal text-neutral-950">{title}</h2>
        </div>

        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${metricTone(tone)}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <p className="relative mt-5 text-4xl font-semibold tracking-normal text-neutral-950">
        {value}
      </p>

      <p className="relative mt-3 min-h-12 text-sm leading-6 text-neutral-500">
        {description}
      </p>

      <div className="relative mt-5 inline-flex items-center gap-2 text-sm font-semibold text-neutral-950">
        Відкрити
        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  )
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardState>(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [period, setPeriod] = useState<DashboardPeriod>("7d")

  async function loadDashboard() {
    try {
      setLoading(true)
      setError("")

      const [
        ordersResponse,
        productsResponse,
        commentsResponse,
        votesResponse,
        charityResponse,
      ] = await Promise.all([
        fetch(`/api/admin/orders?page=1&pageSize=5&period=${period}`, {
          cache: "no-store",
        }),
        fetch("/api/admin/products?page=1&pageSize=1", { cache: "no-store" }),
        fetch("/api/admin/product-comments?page=1&pageSize=5", { cache: "no-store" }),
        fetch("/api/admin/product-votes?page=1&pageSize=5", { cache: "no-store" }),
        fetch(`/api/admin/charity?period=${period}`, { cache: "no-store" }),
      ])

      const [ordersData, productsData, commentsData, votesData, charityData] =
        await Promise.all([
          ordersResponse.json(),
          productsResponse.json(),
          commentsResponse.json(),
          votesResponse.json(),
          charityResponse.json(),
        ])

      const productSummary = normalizeProductSummary(productsData.summary)

      if (!productSummary) {
        throw new Error("Product summary is missing from /api/admin/products.")
      }

      setDashboard({
        orders: Array.isArray(ordersData.orders) ? ordersData.orders : [],
        orderTotalItems: Number(ordersData.pagination?.totalItems ?? 0),
        productSummary,
        comments: Array.isArray(commentsData.comments) ? commentsData.comments : [],
        commentTotalItems: Number(commentsData.pagination?.totalItems ?? 0),
        voteSummary: {
          average: Number(votesData.summary?.average ?? 0),
          total: Number(votesData.summary?.total ?? 0),
        },
        charity: charityData.stats ?? null,
      })
    } catch (loadError) {
      console.error("Failed to load admin dashboard:", loadError)
      setError("Не вдалося завантажити панель. Перевір API або підключення до бази.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [period])

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

  return (
    <div className="space-y-7 font-sans [letter-spacing:normal]">
      <section className="overflow-hidden rounded-[34px] border border-[#eadfce] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,249,238,0.78)_54%,rgba(240,216,174,0.52))] p-6 shadow-[0_24px_70px_rgba(58,42,22,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[#a58d68]">
              {todayLabel}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-neutral-950 sm:text-5xl">
              Що потребує уваги
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 tracking-normal text-neutral-600">
              Це новий центр керування: замовлення й благодійність фільтруються за періодом, а товари, коментарі й оцінки поки показують поточний стан.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 rounded-full border border-[#eadfce] bg-white/72 p-1">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={`h-9 rounded-full px-4 text-xs font-semibold transition ${
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
              onClick={() => void loadDashboard()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d8c6aa] bg-white/78 px-5 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-60"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Оновити
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-[#eadfce] bg-white/72 p-4">
            <p className="text-xs text-neutral-500">Пакування</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-normal text-neutral-950">{stats.ordersToPack}</p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Оплачені або в обробці замовлення за вибраний період.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#eadfce] bg-white/72 p-4">
            <p className="text-xs text-neutral-500">Виручка</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-normal text-neutral-950">
              {formatYen(stats.pageRevenue)}
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Сума останніх замовлень за вибраний період; не повна фінансова звітність.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#eadfce] bg-white/72 p-4">
            <p className="text-xs text-neutral-500">Проблеми товарів</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-normal text-neutral-950">{stats.readinessIssues}</p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Товари, де бракує даних для публікації або Smart Box.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#eadfce] bg-white/72 p-4">
            <p className="text-xs text-neutral-500">Благодійність</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-normal text-neutral-950">
              {dashboard.charity ? formatYen(dashboard.charity.confirmedTotal) : "—"}
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Підтверджені внески за вибраний період.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
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
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[30px] border border-[#eadfce] bg-white/76 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.08em] text-[#a58d68]">
                Recent Orders
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-normal text-neutral-950">
                Останні замовлення
              </h2>
            </div>
            <Link href="/admin/orders" className="text-sm font-semibold text-neutral-950 hover:underline">
              Всі
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {dashboard.orders.length > 0 ? (
              dashboard.orders.map((order) => (
                <Link
                  key={order.id}
                  href="/admin/orders"
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[#eee3d2] bg-[#fffaf2]/80 px-4 py-3 transition hover:bg-white hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-950">
                      {order.publicOrderNumber ?? order.id}
                    </p>
                    <p className="mt-1 truncate text-xs text-neutral-500">
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
              <p className="rounded-2xl border border-dashed border-[#eadfce] p-6 text-sm text-neutral-500">
                Замовлень у вибірці немає.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-[#eadfce] bg-white/76 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.08em] text-[#a58d68]">
                Attention
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-normal text-neutral-950">
                Що не можна ігнорувати
              </h2>
            </div>
            <TriangleAlert className="h-5 w-5 text-[#b9852b]" />
          </div>

          <div className="mt-5 space-y-3">
            {stats.readinessIssues > 0 ? (
              <Link href="/admin/products" className="block rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 transition hover:bg-red-100">
                {stats.readinessIssues} товарів потребують обовʼязкових даних для публікації.
              </Link>
            ) : (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Товарів з браком обовʼязкових даних немає.
              </div>
            )}

            {stats.stockIssues > 0 ? (
              <Link href="/admin/products" className="block rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition hover:bg-amber-100">
                {stats.stockIssues} товарів мають складський ризик: out-of-stock або малий залишок.
              </Link>
            ) : (
              <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] px-4 py-3 text-sm text-neutral-600">
                Складські ризики не виявлені в зведенні товарів.
              </div>
            )}

          </div>
        </div>
      </section>
    </div>
  )
}
