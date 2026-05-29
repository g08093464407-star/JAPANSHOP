"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  HeartHandshake,
  ReceiptText,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react"

type CharityMonthlyPoint = {
  month: string
  amount: number
  orders: number
}

type CharityRecentContribution = {
  id: string
  publicOrderNumber: string
  amount: number
  orderTotal: number
  currency: string
  createdAt: string
}

type CharityStats = {
  confirmedTotal: number
  confirmedOrders: number
  averageDonation: number
  firstTarget: number
  progress: number
  donationRate: number
  monthly: CharityMonthlyPoint[]
  recentContributions: CharityRecentContribution[]
}

type CharityResponse = {
  stats?: CharityStats
  error?: string
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

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%"
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-[26px] border border-[#eadfce] bg-white/78 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold tabular-nums tracking-normal text-neutral-950">
            {value}
          </p>
        </div>

        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ead3a6] bg-[#fff7e4] text-[#8a5d18]">
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-neutral-500">{description}</p>
    </div>
  )
}

export default function AdminCharityPage() {
  const [stats, setStats] = useState<CharityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadCharityStats() {
    try {
      setLoading(true)
      setError("")

      const response = await fetch("/api/admin/charity", { cache: "no-store" })
      const data = (await response.json()) as CharityResponse

      if (!response.ok || !data.stats) {
        setError(data.error ?? "Не вдалося завантажити благодійну статистику.")
        return
      }

      setStats(data.stats)
    } catch (loadError) {
      console.error("Failed to load admin charity stats:", loadError)
      setError("Помилка з’єднання під час завантаження благодійної статистики.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCharityStats()
  }, [])

  const monthlyMax = useMemo(() => {
    if (!stats || stats.monthly.length === 0) return 1
    return Math.max(1, ...stats.monthly.map((point) => point.amount))
  }, [stats])

  const safeProgress = stats ? Math.max(0, Math.min(100, stats.progress)) : 0

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[34px] border border-[#eadfce] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,249,238,0.78)_54%,rgba(240,216,174,0.50))] p-6 shadow-[0_24px_70px_rgba(58,42,22,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
              Благодійність
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-neutral-950 sm:text-5xl">
              Благодійність
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
              Окремий операційний екран для внесків Sonyachna: підтверджена сума,
              прогрес до цілі, місячна динаміка та останні замовлення, що сформували внесок.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadCharityStats()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d8c6aa] bg-white/78 px-5 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Оновити
          </button>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      {loading && !stats ? (
        <div className="rounded-[30px] border border-[#eadfce] bg-white/76 p-8 text-sm text-neutral-600 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
          Завантаження благодійної статистики...
        </div>
      ) : stats ? (
        <>
          <section className="grid gap-4 xl:grid-cols-4">
            <StatCard
              label="Підтверджена сума"
              value={formatYen(stats.confirmedTotal)}
              description="Підтверджена сума внесків за оплаченими замовленнями."
              icon={HeartHandshake}
            />

            <StatCard
              label="Замовлення"
              value={String(stats.confirmedOrders)}
              description="Кількість замовлень, які вже сформували благодійний внесок."
              icon={ReceiptText}
            />

            <StatCard
              label="Середній внесок"
              value={formatYen(stats.averageDonation)}
              description="Середній внесок на одне підтверджене замовлення."
              icon={TrendingUp}
            />

            <StatCard
              label="Ставка"
              value={`${stats.donationRate}%`}
              description="Поточна ставка внеску від вартості товарів без доставки."
              icon={Target}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[30px] border border-[#eadfce] bg-white/76 p-6 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
                    Перша ціль
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-normal text-neutral-950">
                    Прогрес до першої цілі
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-semibold tabular-nums tracking-normal text-neutral-950">
                    {formatPercent(safeProgress)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    з {formatYen(stats.firstTarget)}
                  </p>
                </div>
              </div>

              <div className="mt-6 h-4 overflow-hidden rounded-full bg-[#f0e4d0]">
                <div
                  className="h-full rounded-full bg-neutral-950 transition-all duration-700"
                  style={{ width: `${safeProgress}%` }}
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-neutral-500">
                Розрахунок базується на підтверджених замовленнях. Доставка й комісії не мають
                змішуватись із благодійною базою — інакше аналітика буде брехати.
              </p>
            </div>

            <div className="rounded-[30px] border border-[#eadfce] bg-white/76 p-6 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
                    Місяці
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-normal text-neutral-950">
                    Місячна динаміка
                  </h2>
                </div>
                <CalendarDays className="h-5 w-5 text-[#b9852b]" />
              </div>

              {stats.monthly.length === 0 ? (
                <p className="mt-5 rounded-2xl border border-dashed border-[#eadfce] p-6 text-sm text-neutral-500">
                  Місячних даних ще немає.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {stats.monthly.map((point) => (
                    <div
                      key={point.month}
                      className="grid grid-cols-[76px_1fr_104px] items-center gap-3 text-sm"
                    >
                      <div className="text-neutral-600">{point.month}</div>
                      <div className="h-3 overflow-hidden rounded-full bg-[#f0e4d0]">
                        <div
                          className="h-full rounded-full bg-neutral-950"
                          style={{
                            width: `${Math.max(4, Math.round((point.amount / monthlyMax) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums text-neutral-950">
                          {formatYen(point.amount)}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {point.orders} зам.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[30px] border border-[#eadfce] bg-white/76 p-6 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
                  Останні внески
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-normal text-neutral-950">
                  Останні внески
                </h2>
              </div>
            </div>

            {stats.recentContributions.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-dashed border-[#eadfce] p-6 text-sm text-neutral-500">
                Немає останніх внесків.
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#eadfce] text-left text-xs text-neutral-500">
                      <th className="px-4 py-3 font-semibold">Дата</th>
                      <th className="px-4 py-3 font-semibold">Замовлення</th>
                      <th className="px-4 py-3 font-semibold">Внесок</th>
                      <th className="px-4 py-3 font-semibold">Сума замовлення</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentContributions.map((item) => (
                      <tr key={item.id} className="border-b border-[#f0e6d6] last:border-0">
                        <td className="px-4 py-4 text-neutral-600">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-4 py-4 font-semibold text-neutral-950">
                          {item.publicOrderNumber}
                        </td>
                        <td className="px-4 py-4 font-semibold tabular-nums text-neutral-950">
                          {formatYen(item.amount)}
                        </td>
                        <td className="px-4 py-4 tabular-nums text-neutral-600">
                          {formatYen(item.orderTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
