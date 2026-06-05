"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
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

type ProductVoteListSummaryItem = {
  productId: string
  average: number
  total: number
  distribution: VoteDistribution
}

type VoteSummary = {
  average: number
  total: number
  distribution: VoteDistribution
  productSummaries: ProductVoteListSummaryItem[]
}

type VoteFilters = {
  q: string
  category: string
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
  category: string
  image: string
}

type VotesResponse = {
  votes?: AdminProductVote[]
  pagination?: PaginationInfo
  filters?: VoteFilters
  summary?: VoteSummary
  error?: string
}

type PublicCatalogProductOption = Omit<
  AdminCatalogProductOption,
  "category" | "image"
> & {
  category?: string | null
  image?: string | null
}

type PublicCatalogProductsResponse = {
  products?: PublicCatalogProductOption[]
  error?: string
}

type ProductVoteSummaryItem = {
  productId: string
  voteCount: number
  averageRating: number | null
  lowRatingCount: number
  lastVoteAt: string
}

type ProductVoteAttentionItem = {
  productId: string
  voteCount: number
  averageRating: number | null
  lowRatingCount: number
  lastLowRatingAt: string
}

type ProductVoteSummary = {
  productsWithVotes: number
  mostVotedProducts: ProductVoteSummaryItem[]
  attentionProducts: ProductVoteAttentionItem[]
  attentionProductsCount: number
  lowRatingTotal: number
}

type ProductVoteSummaryResponse = {
  summary?: ProductVoteSummary
  error?: string
}

type RatingTrustState = "strong" | "stable" | "watch" | "attention"

type RatingTrustProduct = {
  productId: string
  productName: string
  productImage: string
  voteCount: number
  averageRating: number
  lowRatingCount: number
  lastVoteAt: string
  trustState: RatingTrustState
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

function getProductImage(
  productId: string,
  productOptions: AdminCatalogProductOption[]
) {
  return (
    productOptions.find(
      (product) =>
        product.slug === productId ||
        product.legacyId === productId ||
        product.id === productId
    )?.image ?? ""
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

function getRatingTrustState(product: {
  averageRating: number
  voteCount: number
  lowRatingCount: number
}): RatingTrustState {
  if (product.averageRating < 3.5 || product.lowRatingCount >= 2) {
    return "attention"
  }

  if (
    product.averageRating >= 4.5 &&
    product.voteCount >= 5 &&
    product.lowRatingCount === 0
  ) {
    return "strong"
  }

  if (
    product.voteCount < 3 ||
    product.lowRatingCount === 1 ||
    product.averageRating < 4
  ) {
    return "watch"
  }

  return "stable"
}

function getRatingTrustTone(state: RatingTrustState) {
  if (state === "strong") {
    return {
      label: "Сильний",
      card:
        "border-emerald-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(236,253,245,0.72)_58%,rgba(252,211,77,0.18))] shadow-[0_16px_36px_rgba(16,185,129,0.08)]",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      bar: "bg-[linear-gradient(90deg,rgba(16,185,129,0.78),rgba(245,158,11,0.58))]",
      placeholder: "border-emerald-100 bg-emerald-50 text-emerald-300",
    }
  }

  if (state === "stable") {
    return {
      label: "Стабільно",
      card:
        "border-[#eadfce] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,250,242,0.86)_60%,rgba(245,158,11,0.12))]",
      badge: "border-[#ead3a6] bg-[#fff7e4] text-[#8a5d18]",
      bar: "bg-[linear-gradient(90deg,rgba(184,124,38,0.76),rgba(245,158,11,0.48))]",
      placeholder: "border-[#eadfce] bg-[#fffaf2] text-[#b9a98f]",
    }
  }

  if (state === "watch") {
    return {
      label: "Спостерігати",
      card:
        "border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,251,235,0.84)_58%,rgba(251,191,36,0.2))] shadow-[0_16px_36px_rgba(245,158,11,0.08)]",
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      bar: "bg-[linear-gradient(90deg,rgba(245,158,11,0.72),rgba(251,191,36,0.48))]",
      placeholder: "border-amber-100 bg-amber-50 text-amber-300",
    }
  }

  return {
    label: "Потребує уваги",
    card:
      "border-rose-200/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,241,242,0.86)_58%,rgba(254,205,211,0.32))] shadow-[0_16px_40px_rgba(225,29,72,0.08)]",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    bar: "bg-[linear-gradient(90deg,rgba(244,63,94,0.72),rgba(251,113,133,0.42))]",
    placeholder: "border-rose-100 bg-rose-50 text-rose-300",
  }
}

export default function AdminVotesPage() {
  const router = useRouter()
  const [votes, setVotes] = useState<AdminProductVote[]>([])
  const [drafts, setDrafts] = useState<Record<string, VoteDraft>>({})
  const [summary, setSummary] = useState<VoteSummary>(() => createEmptySummary())
  const [voteSummary, setVoteSummary] = useState<ProductVoteSummary | null>(null)
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
  const [categoryFilter, setCategoryFilter] = useState("")
  const [ratingFilter, setRatingFilter] = useState("")
  const [activeFilters, setActiveFilters] = useState<VoteFilters>({
    q: "",
    category: "",
    rating: "",
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState("")
  const [summaryModalOpen, setSummaryModalOpen] = useState(false)
  const [attentionModalOpen, setAttentionModalOpen] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedVoteId, setSavedVoteId] = useState<string | null>(null)
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
          category: product.category ?? "",
          image: product.image ?? "",
        }))
      )
    } catch (loadError) {
      console.error("Failed to load catalog products for vote filters:", loadError)
      setProductOptions([])
    }
  }

  async function loadVoteSummary() {
    try {
      setSummaryLoading(true)
      setSummaryError("")

      const response = await fetch("/api/admin/product-votes/summary", {
        cache: "no-store",
      })
      const data = (await response.json()) as ProductVoteSummaryResponse

      if (!response.ok || !data.summary) {
        setSummaryError(data.error ?? "Не вдалося завантажити зведення оцінок.")
        return
      }

      setVoteSummary(data.summary)
    } catch (loadError) {
      console.error("Failed to load admin vote summary:", loadError)
      setSummaryError("Під час завантаження зведення оцінок сталася помилка звʼязку.")
    } finally {
      setSummaryLoading(false)
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

      if (filters.category) {
        params.set("category", filters.category)
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
      setCategoryFilter(data.filters.category)
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
    void loadVotes(1, { q: "", category: "", rating: "" })
    void loadVoteSummary()
  }, [])

  const distributionMax = useMemo(
    () => getDistributionMax(summary.distribution),
    [summary.distribution]
  )

  const ratingTrustProducts = useMemo<RatingTrustProduct[]>(() => {
    const stateOrder: Record<RatingTrustState, number> = {
      attention: 0,
      watch: 1,
      stable: 2,
      strong: 3,
    }

    return (voteSummary?.mostVotedProducts ?? []).flatMap((product) => {
      if (product.averageRating === null) {
        return []
      }

      const trustState = getRatingTrustState({
        averageRating: product.averageRating,
        voteCount: product.voteCount,
        lowRatingCount: product.lowRatingCount,
      })

      return [
        {
          productId: product.productId,
          productName: getProductName(product.productId, productOptions),
          productImage: getProductImage(product.productId, productOptions),
          voteCount: product.voteCount,
          averageRating: product.averageRating,
          lowRatingCount: product.lowRatingCount,
          lastVoteAt: product.lastVoteAt,
          trustState,
        },
      ]
    }).sort((first, second) => {
      return (
        stateOrder[first.trustState] - stateOrder[second.trustState] ||
        second.lowRatingCount - first.lowRatingCount ||
        first.averageRating - second.averageRating ||
        second.voteCount - first.voteCount
      )
    })
  }, [productOptions, voteSummary?.mostVotedProducts])

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(
        productOptions
          .map((product) => product.category.trim())
          .filter((category) => category.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b))
  }, [productOptions])

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
      category: categoryFilter,
      rating: ratingFilter,
    }

    await loadVotes(1, nextFilters)
  }

  async function handleResetFilters() {
    const nextFilters: VoteFilters = {
      q: "",
      category: "",
      rating: "",
    }

    setSearchInput("")
    setCategoryFilter("")
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

      const savedId = data.vote.id
      setSavedVoteId(savedId)
      window.setTimeout(() => {
        setSavedVoteId((current) => (current === savedId ? null : current))
      }, 1800)

      await loadVotes(pagination.page, activeFilters)
      await loadVoteSummary()
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
      await loadVoteSummary()
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

  function openProductFromSummary(productId: string) {
    router.push(`/admin/products?q=${encodeURIComponent(productId)}`)
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
              Окремий робочий простір для контролю рейтингу: розподіл оцінок, фільтри за категорією, редагування й видалення некоректних голосів.
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
          </div>
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

          {(activeFilters.q || activeFilters.category || activeFilters.rating) ? (
            <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
              {activeFilters.q ? (
                <span className="rounded-full bg-[#f4ead9] px-3 py-1">
                  Пошук: {activeFilters.q}
                </span>
              ) : null}
              {activeFilters.category ? (
                <span className="rounded-full bg-[#f4ead9] px-3 py-1">
                  Категорія: {activeFilters.category}
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
              placeholder="Product ID або хеш голосувача"
              className="h-11 w-full rounded-xl border border-[#e1d2bd] bg-white px-10 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-11 rounded-xl border border-[#e1d2bd] bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
          >
            <option value="">Усі категорії</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

          <button
            type="button"
            onClick={() => setSummaryModalOpen(true)}
            className="rounded-[24px] border border-[#eadfce] bg-white/72 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_42px_rgba(58,42,22,0.075)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          >
            <p className="text-xs text-neutral-500">Товарів з оцінками</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-950">
              {voteSummary?.productsWithVotes ?? 0}
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Натисніть, щоб побачити найактивніші товари.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setAttentionModalOpen(true)}
            className={`rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 ${
              (voteSummary?.attentionProductsCount ?? 0) > 0
                ? "border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,241,242,0.88)_58%,rgba(254,205,211,0.42))] shadow-[0_16px_40px_rgba(225,29,72,0.08)] hover:shadow-[0_18px_42px_rgba(225,29,72,0.1)]"
                : "border-[#eadfce] bg-white/72 hover:shadow-[0_18px_42px_rgba(58,42,22,0.075)]"
            }`}
          >
            <p className="text-xs text-neutral-500">Потребують уваги</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-950">
              {voteSummary?.attentionProductsCount ?? 0}
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Товари з оцінками 3 або нижче. Натисніть, щоб переглянути.
            </p>
          </button>
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
                Аналітика рейтингу
              </p>
              <h2 className="mt-2 text-xl font-semibold text-neutral-950">
                Карта довіри товарів
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
                Алгоритм поєднує середню оцінку, кількість голосів і низькі оцінки, щоб показати силу або ризик кожного товару.
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-[#b9852b]" />
          </div>

          {ratingTrustProducts.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-[#eadfce] p-6 text-sm text-neutral-500">
              Даних для карти довіри ще немає.
            </p>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {ratingTrustProducts.map((product) => {
                const tone = getRatingTrustTone(product.trustState)
                const ratingWidth = Math.round((product.averageRating / 5) * 100)

                return (
                  <button
                    key={product.productId}
                    type="button"
                    onClick={() => openProductFromSummary(product.productId)}
                    className={`rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 ${tone.card}`}
                  >
                    <div className="flex min-w-0 gap-3">
                      <div
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border ${tone.placeholder}`}
                      >
                        {product.productImage ? (
                          <img
                            src={product.productImage}
                            alt={product.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-medium uppercase tracking-[0.12em]">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-950">
                              {product.productName}
                            </p>
                            <p className="mt-1 break-all font-mono text-xs text-neutral-400">
                              {product.productId}
                            </p>
                          </div>
                          <span
                            className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}
                          >
                            {tone.label}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-neutral-500">
                          <span className="rounded-2xl bg-white/62 px-3 py-2">
                            <b className="block text-base text-neutral-950">
                              {product.averageRating.toFixed(1)}
                            </b>
                            / 5
                          </span>
                          <span className="rounded-2xl bg-white/62 px-3 py-2">
                            <b className="block text-base text-neutral-950">
                              {product.voteCount}
                            </b>
                            оцінок
                          </span>
                          <span className="rounded-2xl bg-white/62 px-3 py-2">
                            <b className="block text-base text-neutral-950">
                              {product.lowRatingCount}
                            </b>
                            низьких
                          </span>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/72 ring-1 ring-black/5">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${tone.bar}`}
                            style={{ width: `${ratingWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[30px] border border-[#eadfce] bg-white/76 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
            <button
              type="button"
              onClick={() => void goToPrevPage()}
              disabled={!pagination.hasPrevPage || loading}
              aria-label="Попередня сторінка"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d8c6aa] bg-white text-neutral-800 transition hover:bg-[#fffaf2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <span className="font-semibold text-neutral-950">{pagination.page}</span>
              <span> / {pagination.totalPages} сторінка</span>
              <span className="mx-2 text-neutral-300">|</span>
              <span>усього {pagination.totalItems}</span>
            </div>
            <button
              type="button"
              onClick={() => void goToNextPage()}
              disabled={!pagination.hasNextPage || loading}
              aria-label="Наступна сторінка"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d8c6aa] bg-white text-neutral-800 transition hover:bg-[#fffaf2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
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
                        <p className="text-xs text-neutral-500">Хеш голосувача</p>
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
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === vote.id ? (
                          "Збереження..."
                        ) : savedVoteId === vote.id ? (
                          <>
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                              <Check className="h-3 w-3 text-white" />
                            </span>
                            Збережено
                          </>
                        ) : (
                          "Зберегти"
                        )}
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

      {summaryModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/35 px-4 py-6">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-[32px] border border-[#eadfce] bg-[#fffdf8] shadow-[0_28px_80px_rgba(24,24,27,0.24)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#eadfce] px-6 py-5">
              <div>
                <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
                  Оцінки
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-neutral-950">
                  Найбільш оцінювані товари
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  До 10 товарів з найбільшою кількістю оцінок
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSummaryModalOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#d8c6aa] bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-[#fffaf2]"
              >
                Закрити
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto px-6 py-5">
              {summaryLoading && !voteSummary ? (
                <div className="rounded-[28px] border border-dashed border-[#e1d4c0] bg-white/62 p-8 text-sm leading-6 text-neutral-500">
                  Завантажую зведення оцінок...
                </div>
              ) : summaryError ? (
                <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                  {summaryError}
                </div>
              ) : !voteSummary || voteSummary.mostVotedProducts.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-[#e1d4c0] bg-white/62 p-8 text-sm leading-6 text-neutral-500">
                  Даних про оцінки ще немає.
                </div>
              ) : (
                <div className="grid gap-3">
                  {voteSummary.mostVotedProducts.map((item, index) => {
                    const productName = getProductName(item.productId, productOptions)
                    const productImage = getProductImage(item.productId, productOptions)

                    return (
                      <button
                        key={item.productId}
                        type="button"
                        onClick={() => openProductFromSummary(item.productId)}
                        className="grid gap-4 rounded-[24px] border border-[#eadfce] bg-white/78 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_42px_rgba(58,42,22,0.075)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 md:grid-cols-[minmax(0,1fr)_auto]"
                      >
                        <div className="flex min-w-0 gap-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#eadfce] bg-[#fffaf2]">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={productName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-medium uppercase tracking-[0.12em] text-[#b9a98f]">
                                No image
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-xl bg-neutral-950 px-2 text-xs font-semibold text-white">
                                {index + 1}
                              </span>
                              <p className="truncate text-base font-semibold text-neutral-950">
                                {productName}
                              </p>
                            </div>
                            <p className="mt-2 break-all font-mono text-xs text-neutral-400">
                              {item.productId}
                            </p>
                            <p className="mt-2 text-xs text-neutral-500">
                              Остання оцінка: {formatDate(item.lastVoteAt)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs text-neutral-500 md:w-[300px]">
                          <span className="rounded-2xl bg-[#fffaf2] px-3 py-2">
                            <b className="block text-base text-neutral-950">
                              {item.voteCount}
                            </b>
                            оцінок
                          </span>
                          <span className="rounded-2xl bg-[#fffaf2] px-3 py-2">
                            <b className="block text-base text-neutral-950">
                              {item.averageRating === null
                                ? "—"
                                : item.averageRating.toFixed(1)}
                            </b>
                            avg
                          </span>
                          <span className="rounded-2xl bg-red-50 px-3 py-2 text-red-700">
                            <b className="block text-base text-red-800">
                              {item.lowRatingCount}
                            </b>
                            ≤ 3
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {attentionModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/35 px-4 py-6">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-[32px] border border-rose-200 bg-[#fffdf8] shadow-[0_28px_80px_rgba(24,24,27,0.24)]">
            <div className="flex items-start justify-between gap-4 border-b border-rose-100 px-6 py-5">
              <div>
                <p className="sonyachna-admin-eyebrow text-[10px] text-rose-500">
                  Сигнал довіри
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-neutral-950">
                  Товари з низькими оцінками
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  До 10 товарів з оцінками 3 або нижче
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAttentionModalOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-rose-50"
              >
                Закрити
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto px-6 py-5">
              {summaryLoading && !voteSummary ? (
                <div className="rounded-[28px] border border-dashed border-[#e1d4c0] bg-white/62 p-8 text-sm leading-6 text-neutral-500">
                  Завантажую зведення оцінок...
                </div>
              ) : summaryError ? (
                <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                  {summaryError}
                </div>
              ) : !voteSummary || voteSummary.attentionProducts.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-[#e1d4c0] bg-white/62 p-8 text-sm leading-6 text-neutral-500">
                  Товарів з низькими оцінками немає.
                </div>
              ) : (
                <div className="grid gap-3">
                  {voteSummary.attentionProducts.map((item) => {
                    const productName = getProductName(item.productId, productOptions)
                    const productImage = getProductImage(item.productId, productOptions)

                    return (
                      <button
                        key={item.productId}
                        type="button"
                        onClick={() => openProductFromSummary(item.productId)}
                        className="grid gap-4 rounded-[24px] border border-rose-100 bg-white/82 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_42px_rgba(225,29,72,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 md:grid-cols-[minmax(0,1fr)_auto]"
                      >
                        <div className="flex min-w-0 gap-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-rose-100 bg-rose-50">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={productName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-medium uppercase tracking-[0.12em] text-rose-300">
                                No image
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-7 shrink-0 items-center justify-center rounded-xl bg-rose-50 px-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                                ≤ 3
                              </span>
                              <p className="truncate text-base font-semibold text-neutral-950">
                                {productName}
                              </p>
                            </div>
                            <p className="mt-2 break-all font-mono text-xs text-neutral-400">
                              {item.productId}
                            </p>
                            <p className="mt-2 text-xs text-neutral-500">
                              Остання низька оцінка: {formatDate(item.lastLowRatingAt)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs text-neutral-500 md:w-[300px]">
                          <span className="rounded-2xl bg-red-50 px-3 py-2 text-red-700">
                            <b className="block text-base text-red-800">
                              {item.lowRatingCount}
                            </b>
                            низьких
                          </span>
                          <span className="rounded-2xl bg-[#fffaf2] px-3 py-2">
                            <b className="block text-base text-neutral-950">
                              {item.averageRating === null
                                ? "—"
                                : item.averageRating.toFixed(1)}
                            </b>
                            avg
                          </span>
                          <span className="rounded-2xl bg-[#fffaf2] px-3 py-2">
                            <b className="block text-base text-neutral-950">
                              {item.voteCount}
                            </b>
                            оцінок
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
