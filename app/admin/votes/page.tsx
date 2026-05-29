"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  BarChart3,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react"

type PaginationInfo = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
}

type AdminProductVote = {
  id: string
  productId: string
  rating: number
  voterHash: string
  createdAt: string
}

type VoteDistribution = Record<1 | 2 | 3 | 4 | 5, number>

type ProductVoteSummary = {
  productId: string
  average: number
  total: number
  distribution: VoteDistribution
}

type VoteSummary = {
  average: number
  total: number
  distribution: VoteDistribution
  productSummaries: ProductVoteSummary[]
}

type VoteFilters = {
  q: string
  productId: string
  rating: string
}

type VoteDraft = {
  rating: number
}

type AdminCatalogProductOption = {
  id: string
  legacyId: string
  slug: string
  name: string
}

type VotesResponse = {
  votes?: AdminProductVote[]
  pagination?: PaginationInfo
  filters?: VoteFilters
  summary?: VoteSummary
  error?: string
}

type PublicCatalogProductsResponse = {
  products?: AdminCatalogProductOption[]
  error?: string
}

const PAGE_SIZE = 20

function createEmptyDistribution(): VoteDistribution {
  return {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }
}

function createEmptySummary(): VoteSummary {
  return {
    average: 0,
    total: 0,
    distribution: createEmptyDistribution(),
    productSummaries: [],
  }
}

function createDraftFromVote(vote: AdminProductVote): VoteDraft {
  return {
    rating: vote.rating,
  }
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

function getProductName(
  productId: string,
  productOptions: AdminCatalogProductOption[]
) {
  return (
    productOptions.find(
      (product) =>
        product.slug === productId ||
        product.legacyId === productId ||
        product.id === productId
    )?.name ?? productId
  )
}

function getDistributionCount(distribution: VoteDistribution, rating: number) {
  return distribution[rating as 1 | 2 | 3 | 4 | 5] ?? 0
}

function getDistributionMax(distribution: VoteDistribution) {
  return Math.max(
    1,
    getDistributionCount(distribution, 1),
    getDistributionCount(distribution, 2),
    getDistributionCount(distribution, 3),
    getDistributionCount(distribution, 4),
    getDistributionCount(distribution, 5)
  )
}

function ratingTone(rating: number) {
  if (rating >= 5) return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (rating >= 4) return "bg-[#fff7e4] text-[#8a5d18] border-[#ead3a6]"
  if (rating >= 3) return "bg-sky-50 text-sky-700 border-sky-200"
  return "bg-red-50 text-red-700 border-red-200"
}

export default function AdminVotesPage() {
  const [votes, setVotes] = useState<AdminProductVote[]>([])
  const [drafts, setDrafts] = useState<Record<string, VoteDraft>>({})
  const [summary, setSummary] = useState<VoteSummary>(() => createEmptySummary())
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  })

  const [productOptions, setProductOptions] = useState<AdminCatalogProductOption[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [productFilter, setProductFilter] = useState("")
  const [ratingFilter, setRatingFilter] = useState("")
  const [activeFilters, setActiveFilters] = useState<VoteFilters>({
    q: "",
    productId: "",
    rating: "",
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadProductOptions() {
    try {
      const response = await fetch("/api/catalog/products", { cache: "no-store" })
      const data = (await response.json()) as PublicCatalogProductsResponse

      if (!response.ok || !Array.isArray(data.products)) {
        setProductOptions([])
        return
      }

      setProductOptions(
        data.products.map((product) => ({
          id: product.id,
          legacyId: product.legacyId,
          slug: product.slug,
          name: product.name,
        }))
      )
    } catch (loadError) {
      console.error("Failed to load catalog products for vote filters:", loadError)
      setProductOptions([])
    }
  }

  async function loadVotes(targetPage: number, filters: VoteFilters) {
    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams()
      params.set("page", String(targetPage))
      params.set("pageSize", String(PAGE_SIZE))

      if (filters.q.trim()) {
        params.set("q", filters.q.trim())
      }

      if (filters.productId) {
        params.set("productId", filters.productId)
      }

      if (filters.rating) {
        params.set("rating", filters.rating)
      }

      const response = await fetch(`/api/admin/product-votes?${params.toString()}`, {
        cache: "no-store",
      })
      const data = (await response.json()) as VotesResponse

      if (
        !response.ok ||
        !data.votes ||
        !data.pagination ||
        !data.filters ||
        !data.summary
      ) {
        setError(data.error ?? "Не вдалося завантажити оцінки.")
        return
      }

      setVotes(data.votes)
      setPagination(data.pagination)
      setActiveFilters(data.filters)
      setSearchInput(data.filters.q)
      setProductFilter(data.filters.productId)
      setRatingFilter(data.filters.rating)
      setSummary(data.summary)

      const nextDrafts: Record<string, VoteDraft> = {}

      for (const vote of data.votes) {
        nextDrafts[vote.id] = createDraftFromVote(vote)
      }

      setDrafts(nextDrafts)
    } catch (loadError) {
      console.error("Failed to load admin product votes:", loadError)
      setError("Під час завантаження оцінок сталася помилка звʼязку.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProductOptions()
    void loadVotes(1, { q: "", productId: "", rating: "" })
  }, [])

  const distributionMax = useMemo(
    () => getDistributionMax(summary.distribution),
    [summary.distribution]
  )

  const topProductSummaries = useMemo(() => {
    return summary.productSummaries.slice(0, 6)
  }, [summary.productSummaries])

  function updateDraft(voteId: string, patch: Partial<VoteDraft>) {
    setDrafts((current) => {
      const draft = current[voteId]

      if (!draft) {
        return current
      }

      return {
        ...current,
        [voteId]: {
          ...draft,
          ...patch,
        },
      }
    })
  }

  async function handleApplyFilters() {
    const nextFilters: VoteFilters = {
      q: searchInput.trim(),
      productId: productFilter,
      rating: ratingFilter,
    }

    await loadVotes(1, nextFilters)
  }

  async function handleResetFilters() {
    const nextFilters: VoteFilters = {
      q: "",
      productId: "",
      rating: "",
    }

    setSearchInput("")
    setProductFilter("")
    setRatingFilter("")
    await loadVotes(1, nextFilters)
  }

  async function handleSaveVote(voteId: string) {
    const draft = drafts[voteId]

    if (!draft) return

    if (draft.rating < 1 || draft.rating > 5) {
      alert("Оцінка має бути від 1 до 5.")
      return
    }

    try {
      setSavingId(voteId)

      const response = await fetch(`/api/admin/product-votes/${voteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: draft.rating,
        }),
      })

      const data = (await response.json()) as {
        vote?: AdminProductVote
        error?: string
      }

      if (!response.ok || !data.vote) {
        alert(data.error ?? "Не вдалося зберегти оцінку.")
        return
      }

      await loadVotes(pagination.page, activeFilters)
    } catch (saveError) {
      console.error("Failed to update vote:", saveError)
      alert("Під час збереження оцінки сталася помилка звʼязку.")
    } finally {
      setSavingId(null)
    }
  }

  async function handleDeleteVote(voteId: string) {
    const ok = window.confirm("Видалити цю оцінку?")

    if (!ok) return

    try {
      setDeletingId(voteId)

      const response = await fetch(`/api/admin/product-votes/${voteId}`, {
        method: "DELETE",
      })

      const data = (await response.json()) as {
        ok?: boolean
        error?: string
      }

      if (!response.ok || !data.ok) {
        alert(data.error ?? "Не вдалося видалити оцінку.")
        return
      }

      const nextPage =
        votes.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page

      await loadVotes(nextPage, activeFilters)
    } catch (deleteError) {
      console.error("Failed to delete vote:", deleteError)
      alert("Під час видалення оцінки сталася помилка звʼязку.")
    } finally {
      setDeletingId(null)
    }
  }

  async function goToPrevPage() {
    if (!pagination.hasPrevPage || loading) return
    await loadVotes(pagination.page - 1, activeFilters)
  }

  async function goToNextPage() {
    if (!pagination.hasNextPage || loading) return
    await loadVotes(pagination.page + 1, activeFilters)
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-[#eadfce] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,249,238,0.82)_56%,rgba(240,216,174,0.48))] p-6 shadow-[0_24px_70px_rgba(58,42,22,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
              Оцінки
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-neutral-950 sm:text-5xl">
              Оцінки товарів
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
              Окремий робочий простір для контролю рейтингу: розподіл оцінок, фільтри за товаром, редагування й видалення некоректних голосів.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadVotes(pagination.page, activeFilters)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d8c6aa] bg-white/78 px-5 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-60"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Оновити
            </button>

            <Link
              href="/admin/operations#votes"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d8c6aa] bg-white/70 px-5 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:bg-white"
            >
              Старий блок
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-[#eadfce] bg-white/72 p-4">
            <p className="text-xs text-neutral-500">Усього оцінок</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-950">
              {summary.total}
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Загальна кількість голосів з урахуванням активних фільтрів.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#eadfce] bg-white/72 p-4">
            <p className="text-xs text-neutral-500">Середня оцінка</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-950">
              {summary.average > 0 ? summary.average.toFixed(1) : "—"}
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Середнє арифметичне по поточній вибірці.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#eadfce] bg-white/72 p-4">
            <p className="text-xs text-neutral-500">На сторінці</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-950">
              {votes.length}
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Кількість записів, завантажених у поточній таблиці.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#eadfce] bg-white/72 p-4">
            <p className="text-xs text-neutral-500">Фільтр</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-950">
              {activeFilters.rating || "all"}
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Активний rating-фільтр або повна вибірка.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[30px] border border-[#eadfce] bg-white/76 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
                Розподіл
              </p>
              <h2 className="mt-2 text-xl font-semibold text-neutral-950">
                Розподіл оцінок
              </h2>
            </div>
            <BarChart3 className="h-5 w-5 text-[#b9852b]" />
          </div>

          <div className="mt-5 space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = getDistributionCount(summary.distribution, rating)
              const width = Math.round((count / distributionMax) * 100)

              return (
                <div
                  key={rating}
                  className="grid grid-cols-[44px_1fr_58px] items-center gap-3 text-sm"
                >
                  <div className="font-semibold text-neutral-800">{rating} ★</div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#f4ead9]">
                    <div
                      className="h-full rounded-full bg-neutral-950 transition-all duration-700"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="text-right text-neutral-500">{count}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-[30px] border border-[#eadfce] bg-white/76 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
                Зведення за товарами
              </p>
              <h2 className="mt-2 text-xl font-semibold text-neutral-950">
                Товари з найбільшою кількістю оцінок
              </h2>
            </div>
            <ShieldCheck className="h-5 w-5 text-[#b9852b]" />
          </div>

          {topProductSummaries.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-[#eadfce] p-6 text-sm text-neutral-500">
              Даних для summary ще немає.
            </p>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {topProductSummaries.map((product) => (
                <div
                  key={product.productId}
                  className="rounded-2xl border border-[#eee3d2] bg-[#fffaf2]/80 p-4"
                >
                  <p className="truncate text-sm font-semibold text-neutral-950">
                    {getProductName(product.productId, productOptions)}
                  </p>
                  <p className="mt-1 break-all text-xs text-neutral-400">
                    {product.productId}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-neutral-500">
                    <span>{product.total} голосів</span>
                    <span className="font-semibold text-neutral-950">
                      {product.average.toFixed(1)} / 5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[30px] border border-[#eadfce] bg-white/76 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
              Фільтри
            </p>
            <h2 className="mt-2 text-xl font-semibold text-neutral-950">
              Пошук і фільтри
            </h2>
          </div>

          {(activeFilters.q || activeFilters.productId || activeFilters.rating) ? (
            <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
              {activeFilters.q ? (
                <span className="rounded-full bg-[#f4ead9] px-3 py-1">
                  Пошук: {activeFilters.q}
                </span>
              ) : null}
              {activeFilters.productId ? (
                <span className="rounded-full bg-[#f4ead9] px-3 py-1">
                  Товар: {getProductName(activeFilters.productId, productOptions)}
                </span>
              ) : null}
              {activeFilters.rating ? (
                <span className="rounded-full bg-[#f4ead9] px-3 py-1">
                  Оцінка: {activeFilters.rating}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[1.2fr_1fr_0.7fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Product ID або voter hash"
              className="h-11 w-full rounded-xl border border-[#e1d2bd] bg-white px-10 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
            />
          </div>

          <select
            value={productFilter}
            onChange={(event) => setProductFilter(event.target.value)}
            className="h-11 rounded-xl border border-[#e1d2bd] bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
          >
            <option value="">Усі товари</option>
            {productOptions.map((product) => (
              <option key={product.slug} value={product.slug}>
                {product.name}
              </option>
            ))}
          </select>

          <select
            value={ratingFilter}
            onChange={(event) => setRatingFilter(event.target.value)}
            className="h-11 rounded-xl border border-[#e1d2bd] bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
          >
            <option value="">Усі оцінки</option>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} ★
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void handleApplyFilters()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            Застосувати
          </button>

          <button
            type="button"
            onClick={() => void handleResetFilters()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d8c6aa] bg-white px-5 text-sm font-semibold text-neutral-900 transition hover:bg-[#fffaf2] disabled:opacity-50"
          >
            Скинути
          </button>
        </div>
      </section>

      <section className="rounded-[30px] border border-[#eadfce] bg-white/76 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-neutral-600">
            <span className="font-semibold text-neutral-950">{pagination.page}</span>
            <span> / {pagination.totalPages} сторінка</span>
            <span className="mx-2 text-neutral-300">|</span>
            <span>усього {pagination.totalItems}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void goToPrevPage()}
              disabled={!pagination.hasPrevPage || loading}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d8c6aa] bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-[#fffaf2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Назад
            </button>

            <button
              type="button"
              onClick={() => void goToNextPage()}
              disabled={!pagination.hasNextPage || loading}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Далі
            </button>
          </div>
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="rounded-[24px] border border-dashed border-[#eadfce] p-8 text-sm text-neutral-500">
              Завантаження оцінок...
            </div>
          ) : error ? (
            <div className="rounded-[24px] border border-red-200 bg-red-50 p-8 text-sm text-red-700">
              {error}
            </div>
          ) : votes.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#eadfce] p-8 text-sm text-neutral-500">
              За цими фільтрами оцінок немає.
            </div>
          ) : (
            <div className="grid gap-3">
              {votes.map((vote) => {
                const draft = drafts[vote.id] ?? createDraftFromVote(vote)
                const productName = getProductName(vote.productId, productOptions)

                return (
                  <article
                    key={vote.id}
                    className="rounded-[24px] border border-[#eee3d2] bg-[#fffaf2]/70 p-4 transition hover:bg-white hover:shadow-sm"
                  >
                    <div className="grid gap-4 xl:grid-cols-[1.2fr_1.2fr_0.42fr_auto_auto] xl:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${ratingTone(vote.rating)}`}
                          >
                            {vote.rating} ★
                          </span>
                          <span className="text-xs text-neutral-500">
                            {formatDate(vote.createdAt)}
                          </span>
                        </div>
                        <h3 className="mt-2 truncate text-sm font-semibold text-neutral-950">
                          {productName}
                        </h3>
                        <p className="mt-1 break-all text-xs text-neutral-400">
                          {vote.productId}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-neutral-500">Voter hash</p>
                        <p className="mt-1 break-all rounded-xl border border-[#eadfce] bg-white/80 px-3 py-2 text-xs text-neutral-600">
                          {vote.voterHash}
                        </p>
                      </div>

                      <label className="grid gap-1 text-xs text-neutral-500">
                        Оцінка
                        <select
                          value={draft.rating}
                          onChange={(event) =>
                            updateDraft(vote.id, { rating: Number(event.target.value) })
                          }
                          className="h-10 rounded-xl border border-[#e1d2bd] bg-white px-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-neutral-900"
                        >
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <option key={rating} value={rating}>
                              {rating} ★
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={() => void handleSaveVote(vote.id)}
                        disabled={savingId === vote.id}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === vote.id ? "Збереження..." : "Зберегти"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDeleteVote(vote.id)}
                        disabled={deletingId === vote.id}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === vote.id ? "Видалення..." : "Видалити"}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
