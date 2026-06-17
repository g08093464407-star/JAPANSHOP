"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react"
import {
  Boxes,
  ChevronRight,
  HeartHandshake,
  LayoutDashboard,
  MessageCircle,
  Package,
  PackagePlus,
  Sparkles,
  Star,
} from "lucide-react"

type AdminNavItem = {
  label: string
  href: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  soon?: boolean
}

const navItems: AdminNavItem[] = [
  {
    label: "Панель",
    href: "/admin",
    description: "Стан магазину сьогодні",
    icon: LayoutDashboard,
  },
  {
    label: "Товари",
    href: "/admin/products",
    description: "Каталог, готовність, склад",
    icon: Package,
  },
  {
    label: "Новий товар",
    href: "/admin/products/new",
    description: "Створити позицію",
    icon: PackagePlus,
  },
  {
    label: "Замовлення",
    href: "/admin/orders",
    description: "Пакування й статуси",
    icon: Boxes,
  },
  {
    label: "Коментарі",
    href: "/admin/comments",
    description: "Довіра й модерація",
    icon: MessageCircle,
  },
  {
    label: "Оцінки",
    href: "/admin/votes",
    description: "Рейтинги товарів",
    icon: Star,
  },
  {
    label: "Благодійність",
    href: "/admin/charity",
    description: "Внески й прогрес",
    icon: HeartHandshake,
  },
]

const ADMIN_ROUTE_HISTORY_KEY = "sonyachna:admin-route-history"
const ADMIN_ROUTE_HISTORY_LIMIT = 10

function isActiveNav(pathname: string, href: string) {
  const cleanHref = href.split("#")[0]

  if (cleanHref === "/admin") {
    return pathname === "/admin"
  }

  if (cleanHref === "/admin/operations") {
    return pathname === "/admin/operations"
  }

  if (cleanHref === "/admin/products/new") {
    return pathname === "/admin/products/new"
  }

  if (cleanHref === "/admin/products") {
    return (
      pathname === "/admin/products" ||
      (pathname.startsWith("/admin/products/") && pathname !== "/admin/products/new")
    )
  }

  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`)
}

function readAdminRouteHistory() {
  try {
    const rawHistory = window.sessionStorage.getItem(ADMIN_ROUTE_HISTORY_KEY)
    const parsedHistory = rawHistory ? JSON.parse(rawHistory) : []

    if (!Array.isArray(parsedHistory)) {
      return []
    }

    return parsedHistory.filter(
      (route): route is string =>
        typeof route === "string" && route.startsWith("/admin")
    )
  } catch (error) {
    console.error("Failed to read admin route history:", error)
    return []
  }
}

function writeAdminRouteHistory(history: string[]) {
  try {
    window.sessionStorage.setItem(
      ADMIN_ROUTE_HISTORY_KEY,
      JSON.stringify(
        history
          .filter((route) => route.startsWith("/admin"))
          .slice(-ADMIN_ROUTE_HISTORY_LIMIT)
      )
    )
  } catch (error) {
    console.error("Failed to write admin route history:", error)
  }
}

function getAdminRouteBlockKey(routeOrPathname: string) {
  const routePath = routeOrPathname.split("?")[0]

  if (routePath === "/admin") return "/admin"
  if (routePath.startsWith("/admin/orders")) return "/admin/orders"
  if (routePath.startsWith("/admin/products")) return "/admin/products"
  if (routePath.startsWith("/admin/comments")) return "/admin/comments"
  if (routePath.startsWith("/admin/votes")) return "/admin/votes"
  if (routePath.startsWith("/admin/charity")) return "/admin/charity"
  if (routePath.startsWith("/admin/analytics")) return "/admin/analytics"
  if (routePath.startsWith("/admin/settings")) return "/admin/settings"

  return routePath
}

function getAdminBackLabel(route: string) {
  const routePath = route.split("?")[0]

  if (routePath === "/admin") return "← Назад до панелі"
  if (routePath.startsWith("/admin/orders")) return "← Назад до замовлень"
  if (routePath.startsWith("/admin/comments")) return "← Назад до коментарів"
  if (routePath.startsWith("/admin/votes")) return "← Назад до оцінок"
  if (routePath.startsWith("/admin/products")) return "← Назад до товарів"
  if (routePath.startsWith("/admin/charity")) return "← Назад до благодійності"
  if (routePath.startsWith("/admin/analytics")) return "← Назад до аналітики"
  if (routePath.startsWith("/admin/settings")) return "← Назад до налаштувань"

  return "← Назад"
}

function AdminBackButton({ pathname }: { pathname: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchString = searchParams.toString()
  const [previousAdminRoute, setPreviousAdminRoute] = useState<string | null>(null)
  const [currentRoute, setCurrentRoute] = useState(pathname)

  useEffect(() => {
    const nextRoute = `${pathname}${searchString ? `?${searchString}` : ""}`

    setCurrentRoute(nextRoute)

    if (!nextRoute.startsWith("/admin")) {
      setPreviousAdminRoute(null)
      return
    }

    const history = readAdminRouteHistory()
    const lastRoute = history.at(-1)
    const nextRouteBlockKey = getAdminRouteBlockKey(nextRoute)

    if (lastRoute === nextRoute) {
      setPreviousAdminRoute(history.length > 1 ? history.at(-2) ?? null : null)
      return
    }

    const nextHistory =
      lastRoute && getAdminRouteBlockKey(lastRoute) === nextRouteBlockKey
        ? [...history.slice(0, -1), nextRoute]
        : [...history, nextRoute].slice(-ADMIN_ROUTE_HISTORY_LIMIT)

    writeAdminRouteHistory(nextHistory)
    setPreviousAdminRoute(nextHistory.at(-2) ?? null)
  }, [pathname, searchString])

  function handleAdminBack() {
    if (!previousAdminRoute || !previousAdminRoute.startsWith("/admin")) {
      return
    }

    const history = readAdminRouteHistory()
    const historyWithoutCurrent =
      history.at(-1) === currentRoute
        ? history.slice(0, -1)
        : history.filter((route) => route !== currentRoute)

    const nextHistory =
      historyWithoutCurrent.at(-1) === previousAdminRoute
        ? historyWithoutCurrent
        : [...historyWithoutCurrent, previousAdminRoute]

    writeAdminRouteHistory(nextHistory)
    setPreviousAdminRoute(
      nextHistory.length > 1 ? nextHistory.at(-2) ?? null : null
    )
    router.push(previousAdminRoute)
  }

  if (!previousAdminRoute) {
    return null
  }

  return (
    <button
      type="button"
      onClick={handleAdminBack}
      className="inline-flex h-10 items-center rounded-full border border-[#d8c6aa] bg-white/72 px-4 text-sm font-semibold tracking-normal text-neutral-800 transition hover:-translate-y-0.5 hover:bg-white"
    >
      {getAdminBackLabel(previousAdminRoute)}
    </button>
  )
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [paidOrdersCount, setPaidOrdersCount] = useState(0)
  const mountedRef = useRef(false)

  async function loadPaidOrdersCount() {
    try {
      const response = await fetch(
        "/api/admin/orders?status=paid&page=1&pageSize=1&archive=active",
        { cache: "no-store" }
      )
      const data = (await response.json()) as {
        pagination?: { totalItems?: number }
      }

      if (mountedRef.current && response.ok) {
        setPaidOrdersCount(Number(data.pagination?.totalItems ?? 0))
      }
    } catch (error) {
      console.error("Failed to load paid orders badge:", error)
    }
  }

  useEffect(() => {
    mountedRef.current = true

    function handleOrdersBadgeRefresh() {
      void loadPaidOrdersCount()
    }

    void loadPaidOrdersCount()
    window.addEventListener(
      "sonyachna:orders-badge-refresh",
      handleOrdersBadgeRefresh
    )

    return () => {
      mountedRef.current = false
      window.removeEventListener(
        "sonyachna:orders-badge-refresh",
        handleOrdersBadgeRefresh
      )
    }
  }, [])

  return (
    <div className="sonyachna-admin-root h-screen overflow-hidden bg-[#f7f3ec] text-neutral-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-[#f4d58c]/30 blur-3xl" />
        <div className="absolute -right-28 top-24 h-[28rem] w-[28rem] rounded-full bg-white/70 blur-3xl" />
        <div className="absolute bottom-[-20rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-[#ead7b7]/35 blur-3xl" />
      </div>

      <div className="relative mx-auto grid h-screen w-full max-w-[1720px] grid-cols-1 overflow-hidden lg:grid-cols-[292px_minmax(0,1fr)]">
        <aside className="hidden h-screen overflow-y-auto overscroll-contain border-r border-[#e5dac9]/80 bg-white/58 px-5 py-6 backdrop-blur-xl lg:block">
          <div className="min-h-full">
            <Link href="/admin" className="group flex items-center gap-3 rounded-[24px] px-2 py-2">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e7d8bf] bg-[linear-gradient(135deg,#fffaf0,#f0d088)] shadow-[0_14px_34px_rgba(151,103,25,0.16)]">
                <Sparkles className="h-5 w-5 text-[#8f6423]" />
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-white bg-emerald-500" />
              </div>

              <div>
                <p className="sonyachna-admin-eyebrow text-[11px] text-[#a58d68]">
                  Sonyachna
                </p>
                <p className="text-xl font-semibold tracking-normal text-neutral-950">
                  Admin
                </p>
              </div>
            </Link>

            <div className="mt-7 space-y-1.5">
              {navItems.map((item) => {
                const active = isActiveNav(pathname, item.href)
                const Icon = item.icon
                const showOrdersBadge =
                  item.href === "/admin/orders" && paidOrdersCount > 0

                return (
                  <Link
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
                      active
                        ? "bg-neutral-950 text-white shadow-[0_16px_34px_rgba(24,24,27,0.18)]"
                        : "text-neutral-700 hover:bg-white/90 hover:text-neutral-950 hover:shadow-[0_10px_26px_rgba(58,42,22,0.06)]"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                        active
                          ? "border-white/18 bg-white/12"
                          : "border-[#eadfce] bg-[#fffaf2]"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold tracking-normal">{item.label}</span>
                        {item.soon ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-normal ${
                              active ? "bg-white/15 text-white" : "bg-[#f0e4d0] text-[#8a6a39]"
                            }`}
                          >
                            soon
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={`mt-0.5 block truncate text-[11px] ${
                          active ? "text-white/62" : "text-neutral-500"
                        }`}
                      >
                        {item.description}
                      </span>
                    </span>

                    {showOrdersBadge ? (
                      <span
                        className={`inline-flex min-w-6 shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                          active
                            ? "bg-white text-neutral-950"
                            : "bg-neutral-950 text-white"
                        }`}
                      >
                        {paidOrdersCount}
                      </span>
                    ) : null}

                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition ${
                        active ? "text-white/52" : "text-neutral-300 group-hover:text-neutral-500"
                      }`}
                    />
                  </Link>
                )
              })}
            </div>
          </div>
        </aside>

        <div className="flex h-screen min-w-0 flex-col overflow-hidden">
          <header className="sticky top-0 z-40 shrink-0 border-b border-[#e7ddcf]/80 bg-[#f7f3ec]/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
                  Control Center
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-normal text-neutral-950">
                  Операційна панель Sonyachna
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Suspense fallback={null}>
                  <AdminBackButton pathname={pathname} />
                </Suspense>

                <Link
                  href="/shop"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center rounded-full border border-[#d8c6aa] bg-white/72 px-4 text-sm font-semibold tracking-normal text-neutral-800 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Відкрити магазин
                </Link>
              </div>
            </div>

            <nav className="-mx-1 mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.slice(0, 7).map((item) => {
                const active = isActiveNav(pathname, item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={`mobile-${item.label}-${item.href}`}
                    href={item.href}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold tracking-normal ${
                      active
                        ? "bg-neutral-950 text-white"
                        : "border border-[#e6d7c1] bg-white/78 text-neutral-700"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </header>

          <main className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
