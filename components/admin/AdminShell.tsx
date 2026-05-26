"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import {
  BarChart3,
  Boxes,
  ChevronRight,
  ClipboardList,
  HeartHandshake,
  LayoutDashboard,
  MessageCircle,
  Package,
  Settings,
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
    label: "Операції",
    href: "/admin/operations",
    description: "Поточний центр керування",
    icon: ClipboardList,
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
    href: "/admin/operations#charity",
    description: "Внески й прогрес",
    icon: HeartHandshake,
  },
  {
    label: "Аналітика",
    href: "/admin#analytics-preview",
    description: "Після стабілізації даних",
    icon: BarChart3,
    soon: true,
  },
  {
    label: "Налаштування",
    href: "/admin#settings-preview",
    description: "Сайт, доставка, мова",
    icon: Settings,
    soon: true,
  },
]

function isActiveNav(pathname: string, href: string) {
  const cleanHref = href.split("#")[0]

  if (cleanHref === "/admin") {
    return pathname === "/admin"
  }

  if (cleanHref === "/admin/operations") {
    return pathname === "/admin/operations"
  }

  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`)
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

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

                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition ${
                        active ? "text-white/52" : "text-neutral-300 group-hover:text-neutral-500"
                      }`}
                    />
                  </Link>
                )
              })}
            </div>

            <div className="mt-7 rounded-[24px] border border-[#eadfce] bg-white/72 p-4 shadow-[0_18px_42px_rgba(58,42,22,0.055)]">
              <p className="text-xs font-semibold text-neutral-950">
                Принцип адмінки
              </p>
              <p className="mt-2 text-xs leading-6 text-neutral-500">
                Перший екран відповідає не “де що лежить”, а “що сьогодні потребує уваги”.
              </p>
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
                <Link
                  href="/admin/products/new"
                  className="inline-flex h-10 items-center rounded-full bg-neutral-950 px-4 text-sm font-semibold tracking-normal text-white transition hover:-translate-y-0.5 hover:bg-neutral-800"
                >
                  Новий товар
                </Link>
                <Link
                  href="/shop"
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
