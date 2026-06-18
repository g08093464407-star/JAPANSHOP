"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ComponentType, ReactNode } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MessageCircle,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react"

import { resolveAdminProduct } from "@/lib/product/resolve-admin-product"

type PaginationInfo = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
}

type CommentFilters = {
  q: string
  productId: string
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

type AdminCatalogProductOption = {
  id: string
  legacyId: string | null
  slug: string
  name: string
  image: string | null
  category: string | null
}

type AdminProductOptionsResponse = {
  products?: AdminCatalogProductOption[]
  error?: string
}

type ProductCommentSummaryItem = {
  productId: string
  commentCount: number
  averageRating: number | null
  lowRatingCount: number
  lastCommentAt: string
}

type ProductCommentAttentionItem = {
  productId: string
  lowRatingCount: number
  commentCount: number
  averageRating: number | null
  lastLowRatingAt: string
}

type ProductCommentSummary = {
  productsWithComments: number
  topProducts: ProductCommentSummaryItem[]
  attentionProducts: ProductCommentAttentionItem[]
  attentionProductsCount: number
  attentionLowRatingTotal: number
}

type ProductCommentSummaryResponse = {
  summary?: ProductCommentSummary
  error?: string
}

const PAGE_SIZE = 20

function parseCommentsPage(value: string | null) {
  if (!value) return 1

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function parseTrustIssue(value: string | null) {
  return value === "lowRatings" ? value : null
}

function buildCommentsUrl(targetPage: number, filters: CommentFilters) {
  const params = new URLSearchParams()

  if (targetPage > 1) {
    params.set("page", String(targetPage))
  }

  if (filters.q.trim()) {
    params.set("q", filters.q.trim())
  }

  if (filters.productId) {
    params.set("productId", filters.productId)
  }

  const query = params.toString()
  return query ? `/admin/comments?${query}` : "/admin/comments"
}

function formatDate(value: string) {
  const date = new Date(value)

  return new Intl.DateTimeFormat("uk-UA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function createDraftFromComment(comment: AdminProductComment): CommentDraft {
  return {
    rating: comment.rating,
    comment: comment.comment,
    authorName: comment.authorName,
  }
}

function getProductName(
  productId: string,
  productOptions: AdminCatalogProductOption[]
) {
  return resolveAdminProduct(productId, productOptions)?.name ?? productId
}

function getProductImage(
  productId: string,
  productOptions: AdminCatalogProductOption[]
) {
  return resolveAdminProduct(productId, productOptions)?.image ?? ""
}

function getProductNumberLabel(
  productId: string,
  productOptions: AdminCatalogProductOption[]
) {
  const product = resolveAdminProduct(productId, productOptions)

  if (!product) return "Товар не знайдено в каталозі"

  return `№ товару: ${product.legacyId || "не задано"}`
}

function getRatingTone(rating: number) {
  if (rating >= 5) return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (rating >= 4) return "border-[#ead3a6] bg-[#fff7e4] text-[#8a5d18]"
  if (rating >= 3) return "border-sky-200 bg-sky-50 text-sky-700"
  return "border-red-200 bg-red-50 text-red-700"
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  onClick,
  variant = "default",
}: {
  label: string
  value: string
  description: string
  icon: ComponentType<{ className?: string }>
  onClick?: () => void
  variant?: "default" | "attention"
}) {
  const isAttention = variant === "attention"
  const toneClass = isAttention
    ? "border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,241,242,0.88)_58%,rgba(254,205,211,0.42))] shadow-[0_16px_40px_rgba(225,29,72,0.08)]"
    : "border-[#eadfce] bg-white/76 shadow-[0_14px_34px_rgba(58,42,22,0.045)]"
  const iconToneClass = isAttention
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : "border-[#eadfce] bg-[#fffaf2] text-[#9a6a20]"
  const className = `rounded-[24px] border p-4 text-left transition ${toneClass} ${
    onClick
      ? "cursor-pointer hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_42px_rgba(58,42,22,0.075)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
      : ""
  }`
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-neutral-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-950">
            {value}
          </p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${iconToneClass}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-neutral-500">{description}</p>
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    )
  }

  return (
    <div className={className}>
      {content}
    </div>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[#e1d4c0] bg-white/62 p-8 text-sm leading-6 text-neutral-500">
      {children}
    </div>
  )
}

function AdminCommentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlPage = parseCommentsPage(searchParams.get("page"))
  const urlFilters: CommentFilters = {
    q: (searchParams.get("q") ?? "").trim(),
    productId: (searchParams.get("productId") ?? "").trim(),
  }
  const urlTrustIssue = parseTrustIssue(searchParams.get("issue"))
  const [comments, setComments] = useState<AdminProductComment[]>([])
  const [drafts, setDrafts] = useState<Record<string, CommentDraft>>({})
  const [productOptions, setProductOptions] = useState<AdminCatalogProductOption[]>([])
  const [commentSummary, setCommentSummary] =
    useState<ProductCommentSummary | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
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
  const [productFilter, setProductFilter] = useState("")
  const [activeFilters, setActiveFilters] = useState<CommentFilters>({
    q: "",
    productId: "",
  })

  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedCommentId, setSavedCommentId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [summaryModalOpen, setSummaryModalOpen] = useState(false)
  const [attentionModalOpen, setAttentionModalOpen] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState("")
  const commentsRequestSeqRef = useRef(0)

  const closeAttentionModal = useCallback(() => {
    if (!searchParams.has("issue")) {
      setAttentionModalOpen(false)
      return
    }

    setAttentionModalOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("issue")
    const query = params.toString()

    router.push(query ? `/admin/comments?${query}` : "/admin/comments")
  }, [router, searchParams])

  async function loadComments(targetPage: number, filters: CommentFilters) {
    const requestId = commentsRequestSeqRef.current + 1
    commentsRequestSeqRef.current = requestId

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

      if (commentsRequestSeqRef.current !== requestId) return

      if (!response.ok || !data.comments || !data.pagination || !data.filters) {
        setError(data.error ?? "Не вдалося завантажити коментарі.")
        return
      }

      setComments(data.comments)
      setPagination(data.pagination)
      setPage(data.pagination.page)
      setActiveFilters(data.filters)
      setSearchInput(data.filters.q)
      setProductFilter(data.filters.productId)

      const nextDrafts: Record<string, CommentDraft> = {}

      for (const comment of data.comments) {
        nextDrafts[comment.id] = createDraftFromComment(comment)
      }

      setDrafts(nextDrafts)
    } catch (loadError) {
      console.error("Failed to load admin comments:", loadError)
      if (commentsRequestSeqRef.current !== requestId) return
      setError("Під час завантаження коментарів сталася помилка звʼязку.")
    } finally {
      if (commentsRequestSeqRef.current === requestId) {
        setLoading(false)
      }
    }
  }

  async function loadProductOptions() {
    try {
      const response = await fetch("/api/admin/products/options", {
        cache: "no-store",
      })
      const data = (await response.json()) as AdminProductOptionsResponse

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
          image: product.image,
          category: product.category,
        }))
      )
    } catch (loadError) {
      console.error("Failed to load catalog products for comments:", loadError)
      setProductOptions([])
    }
  }

  async function loadCommentSummary() {
    try {
      setSummaryLoading(true)
      setSummaryError("")

      const response = await fetch("/api/admin/product-comments/summary", {
        cache: "no-store",
      })
      const data = (await response.json()) as ProductCommentSummaryResponse

      if (!response.ok || !data.summary) {
        setSummaryError(data.error ?? "Не вдалося завантажити зведення коментарів.")
        return
      }

      setCommentSummary(data.summary)
    } catch (loadError) {
      console.error("Failed to load product comments summary:", loadError)
      setSummaryError("Під час завантаження зведення сталася помилка звʼязку.")
    } finally {
      setSummaryLoading(false)
    }
  }

  useEffect(() => {
    setSearchInput(urlFilters.q)
    setProductFilter(urlFilters.productId)
  }, [urlFilters.q, urlFilters.productId])

  useEffect(() => {
    setAttentionModalOpen(urlTrustIssue === "lowRatings")
  }, [urlTrustIssue])

  useEffect(() => {
    if (!attentionModalOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAttentionModal()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [attentionModalOpen, closeAttentionModal])

  useEffect(() => {
    void loadComments(urlPage, urlFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPage, urlFilters.q, urlFilters.productId])

  useEffect(() => {
    void loadProductOptions()
    void loadCommentSummary()
  }, [])

  const stats = useMemo(() => {
    const average =
      comments.length > 0
        ? comments.reduce((sum, comment) => sum + comment.rating, 0) / comments.length
        : 0

    const lowRatingCount = comments.filter((comment) => comment.rating <= 3).length
    const uniqueProductCount = new Set(comments.map((comment) => comment.productId)).size

    return {
      average: average > 0 ? average.toFixed(1) : "—",
      lowRatingCount,
      uniqueProductCount,
    }
  }, [comments])

  function updateDraft(commentId: string, patch: Partial<CommentDraft>) {
    setDrafts((current) => {
      const draft = current[commentId]

      if (!draft) return current

      return {
        ...current,
        [commentId]: {
          ...draft,
          ...patch,
        },
      }
    })
  }

  function handleApplyFilters() {
    const nextFilters: CommentFilters = {
      q: searchInput.trim(),
      productId: productFilter,
    }

    router.push(buildCommentsUrl(1, nextFilters))
  }

  function handleResetFilters() {
    const nextFilters: CommentFilters = {
      q: "",
      productId: "",
    }

    setSearchInput("")
    setProductFilter("")
    router.push(buildCommentsUrl(1, nextFilters))
  }

  async function handleSave(commentId: string) {
    const draft = drafts[commentId]

    if (!draft) return

    if (!draft.comment.trim()) {
      alert("Введи текст коментаря.")
      return
    }

    if (draft.rating < 1 || draft.rating > 5) {
      alert("Оцінка має бути від 1 до 5.")
      return
    }

    try {
      setSavingId(commentId)

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
        alert(data.error ?? "Не вдалося зберегти коментар.")
        return
      }

      setComments((current) =>
        current.map((comment) =>
          comment.id === commentId ? data.comment! : comment
        )
      )

      setDrafts((current) => ({
        ...current,
        [commentId]: createDraftFromComment(data.comment!),
      }))
      const savedId = data.comment.id

      setSavedCommentId(savedId)
      window.setTimeout(() => {
        setSavedCommentId((current) => (current === savedId ? null : current))
      }, 1800)
      await loadCommentSummary()
    } catch (saveError) {
      console.error("Failed to save comment:", saveError)
      alert("Під час збереження коментаря сталася помилка звʼязку.")
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(commentId: string) {
    const ok = window.confirm("Видалити цей коментар? Дію не можна скасувати.")

    if (!ok) return

    try {
      setDeletingId(commentId)

      const response = await fetch(`/api/admin/product-comments/${commentId}`, {
        method: "DELETE",
      })

      const data = (await response.json()) as { ok?: boolean; error?: string }

      if (!response.ok || !data.ok) {
        alert(data.error ?? "Не вдалося видалити коментар.")
        return
      }

      await loadComments(page, activeFilters)
      await loadCommentSummary()
    } catch (deleteError) {
      console.error("Failed to delete comment:", deleteError)
      alert("Під час видалення коментаря сталася помилка звʼязку.")
    } finally {
      setDeletingId(null)
    }
  }

  async function goToPrevPage() {
    if (!pagination.hasPrevPage || loading) return
    router.push(buildCommentsUrl(page - 1, activeFilters))
  }

  async function goToNextPage() {
    if (!pagination.hasNextPage || loading) return
    router.push(buildCommentsUrl(page + 1, activeFilters))
  }

  function openProductFromSummary(productId: string) {
    const product = resolveAdminProduct(productId, productOptions)

    if (!product) return

    setSummaryModalOpen(false)
    setAttentionModalOpen(false)
    router.push(`/admin/products?focus=${encodeURIComponent(product.id)}`)
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-[#eadfce] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,249,238,0.78)_58%,rgba(240,216,174,0.42))] p-6 shadow-[0_24px_70px_rgba(58,42,22,0.07)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
              Керування довірою
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-neutral-950 sm:text-5xl">
              Коментарі
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
              Окрема робоча зона для модерації довіри: пошук, фільтр за товаром,
              редагування автора, тексту й оцінки. Старий центр “Операції” поки
              лишається fallback-екраном.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadComments(page, activeFilters)}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d8c6aa] bg-white/78 px-5 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Оновити
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Усього"
            value={String(pagination.totalItems)}
            description="Загальна кількість коментарів за поточними фільтрами."
            icon={MessageCircle}
          />
          <StatCard
            label="Товарів з відгуками"
            value={String(commentSummary?.productsWithComments ?? 0)}
            description="Натисніть, щоб побачити найактивніші товари."
            icon={Pencil}
            onClick={() => setSummaryModalOpen(true)}
          />
          <StatCard
            label="Середня оцінка"
            value={stats.average}
            description="Середнє значення тільки в поточній вибірці сторінки."
            icon={Star}
          />
          <StatCard
            label="Потребують уваги"
            value={String(commentSummary?.attentionProductsCount ?? 0)}
            description="Товари з оцінками 3 або нижче. Натисніть, щоб переглянути."
            icon={ShieldCheck}
            onClick={() => setAttentionModalOpen(true)}
            variant={
              (commentSummary?.attentionProductsCount ?? 0) > 0
                ? "attention"
                : "default"
            }
          />
        </div>
      </section>

      <section className="rounded-[30px] border border-[#eadfce] bg-white/76 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
              Фільтри
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-normal text-neutral-950">
              Пошук і відбір
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
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
              <span> / {pagination.totalPages} стор.</span>
              <span className="mx-2 text-neutral-300">|</span>
              <span>{pagination.totalItems} записів</span>
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
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[1.2fr_1fr_auto_auto]">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-neutral-700">Пошук</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Автор, текст або productId"
                className="h-11 w-full rounded-2xl border border-[#d8c6aa] bg-white px-10 text-sm text-neutral-900 outline-none transition focus:border-neutral-950"
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-neutral-700">Товар</span>
            <select
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value)}
              className="h-11 rounded-2xl border border-[#d8c6aa] bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-950"
            >
              <option value="">Усі товари</option>
              {productOptions.map((product) => (
                <option key={product.slug} value={product.slug}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => void handleApplyFilters()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center self-end rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Застосувати
          </button>

          <button
            type="button"
            onClick={() => void handleResetFilters()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center self-end rounded-2xl border border-[#d8c6aa] bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:bg-[#fffaf2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Скинути
          </button>
        </div>

        {(activeFilters.q || activeFilters.productId) ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-600">
            {activeFilters.q ? (
              <span className="rounded-full bg-[#fff7e4] px-3 py-1">
                Пошук: {activeFilters.q}
              </span>
            ) : null}
            {activeFilters.productId ? (
              <span className="rounded-full bg-[#fff7e4] px-3 py-1">
                Товар: {getProductName(activeFilters.productId, productOptions)}
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      {loading ? (
        <EmptyState>Завантажую коментарі...</EmptyState>
      ) : error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      ) : comments.length === 0 ? (
        <EmptyState>Коментарів за поточними фільтрами немає.</EmptyState>
      ) : (
        <section className="grid gap-4">
          {comments.map((comment) => {
            const draft = drafts[comment.id] ?? createDraftFromComment(comment)

            return (
              <article
                key={comment.id}
                className="overflow-hidden rounded-[30px] border border-[#eadfce] bg-white/82 shadow-[0_18px_44px_rgba(58,42,22,0.055)]"
              >
                <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)_260px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getRatingTone(comment.rating)}`}>
                        {comment.rating} / 5
                      </span>
                      <span className="rounded-full border border-[#eadfce] bg-[#fffaf2] px-2.5 py-1 text-xs text-neutral-600">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>

                    <h2 className="mt-4 truncate text-lg font-semibold text-neutral-950">
                      {getProductName(comment.productId, productOptions)}
                    </h2>
                    <p className="mt-2 break-all text-xs leading-5 text-neutral-400">
                      {comment.productId}
                    </p>
                    <p className="mt-4 break-all rounded-2xl border border-[#eadfce] bg-[#fffaf2] px-3 py-2 text-xs leading-5 text-neutral-500">
                      Хеш голосувача: {comment.voterHash}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-neutral-700">Автор</span>
                      <input
                        type="text"
                        value={draft.authorName}
                        onChange={(event) =>
                          updateDraft(comment.id, { authorName: event.target.value })
                        }
                        className="h-11 rounded-2xl border border-[#d8c6aa] bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-950"
                      />
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-neutral-700">Коментар</span>
                      <textarea
                        value={draft.comment}
                        rows={4}
                        onChange={(event) =>
                          updateDraft(comment.id, { comment: event.target.value })
                        }
                        className="resize-none rounded-2xl border border-[#d8c6aa] bg-white px-4 py-3 text-sm leading-6 text-neutral-900 outline-none transition focus:border-neutral-950"
                      />
                    </label>
                  </div>

                  <div className="grid content-between gap-4">
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-neutral-700">Оцінка</span>
                      <select
                        value={draft.rating}
                        onChange={(event) =>
                          updateDraft(comment.id, { rating: Number(event.target.value) })
                        }
                        className="h-11 rounded-2xl border border-[#d8c6aa] bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-950"
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating} / 5
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSave(comment.id)}
                        disabled={savingId === comment.id}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === comment.id ? (
                          <>
                            <Pencil className="h-4 w-4" />
                            Збереження...
                          </>
                        ) : savedCommentId === comment.id ? (
                          <>
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white opacity-100 transition duration-200 ease-out">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                            Збережено
                          </>
                        ) : (
                          <>
                            <Pencil className="h-4 w-4" />
                            Зберегти
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === comment.id ? "Видалення..." : "Видалити"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}

      {summaryModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/35 px-4 py-6">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-[32px] border border-[#eadfce] bg-[#fffdf8] shadow-[0_28px_80px_rgba(24,24,27,0.24)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#eadfce] px-6 py-5">
              <div>
                <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
                  Коментарі
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-neutral-950">
                  Найбільш коментовані товари
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  До 10 товарів з найбільшою кількістю коментарів
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
              {summaryLoading && !commentSummary ? (
                <EmptyState>Завантажую зведення коментарів...</EmptyState>
              ) : summaryError ? (
                <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                  {summaryError}
                </div>
              ) : !commentSummary || commentSummary.topProducts.length === 0 ? (
                <EmptyState>Даних про коментарі ще немає.</EmptyState>
              ) : (
                <div className="grid gap-3">
                  {commentSummary.topProducts.map((item, index) => {
                    const resolvedProduct = resolveAdminProduct(
                      item.productId,
                      productOptions
                    )
                    const productName = getProductName(item.productId, productOptions)
                    const productImage = getProductImage(item.productId, productOptions)
                    const productNumberLabel = getProductNumberLabel(
                      item.productId,
                      productOptions
                    )
                    const rankLabel =
                      index === 0
                        ? "🥇"
                        : index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : index + 1

                    return (
                      <button
                        key={item.productId}
                        type="button"
                        onClick={() => openProductFromSummary(item.productId)}
                        disabled={!resolvedProduct}
                        className="grid gap-4 rounded-[24px] border border-[#eadfce] bg-white/78 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_42px_rgba(58,42,22,0.075)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-white/78 disabled:hover:shadow-none md:grid-cols-[minmax(0,1fr)_auto]"
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
                                {rankLabel}
                              </span>
                              <p className="truncate text-base font-semibold text-neutral-950">
                                {productName}
                              </p>
                            </div>
                            <p className="mt-2 text-xs text-neutral-500">
                              {productNumberLabel}
                            </p>
                            <p className="mt-2 text-xs text-neutral-500">
                              Останній коментар: {formatDate(item.lastCommentAt)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs text-neutral-500 md:w-[300px]">
                          <span className="rounded-2xl bg-[#fffaf2] px-3 py-2">
                            <b className="block text-base text-neutral-950">
                              {item.commentCount}
                            </b>
                            ком.
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/35 px-4 py-6"
          onClick={closeAttentionModal}
        >
          <div
            className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-[32px] border border-rose-200 bg-[#fffdf8] shadow-[0_28px_80px_rgba(24,24,27,0.24)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-rose-100 px-6 py-5">
              <div>
                <p className="sonyachna-admin-eyebrow text-[10px] text-rose-500">
                  Сигнал довіри
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-neutral-950">
                  Коментарі з низькою оцінкою
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  До 10 товарів з коментарями з оцінкою 3 або нижче
                </p>
              </div>

              <button
                type="button"
                onClick={closeAttentionModal}
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-rose-50"
              >
                Закрити
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto px-6 py-5">
              {summaryLoading && !commentSummary ? (
                <EmptyState>Завантажую зведення коментарів...</EmptyState>
              ) : summaryError ? (
                <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                  {summaryError}
                </div>
              ) : !commentSummary || commentSummary.attentionProducts.length === 0 ? (
                <EmptyState>Товарів з коментарями з низькою оцінкою немає.</EmptyState>
              ) : (
                <div className="grid gap-3">
                  {commentSummary.attentionProducts.map((item) => {
                    const resolvedProduct = resolveAdminProduct(
                      item.productId,
                      productOptions
                    )
                    const productName = getProductName(item.productId, productOptions)
                    const productImage = getProductImage(item.productId, productOptions)
                    const productNumberLabel = getProductNumberLabel(
                      item.productId,
                      productOptions
                    )

                    return (
                      <button
                        key={item.productId}
                        type="button"
                        onClick={() => openProductFromSummary(item.productId)}
                        disabled={!resolvedProduct}
                        className="grid gap-4 rounded-[24px] border border-rose-100 bg-white/82 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_42px_rgba(225,29,72,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-white/82 disabled:hover:shadow-none md:grid-cols-[minmax(0,1fr)_auto]"
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
                            <p className="mt-2 text-xs text-neutral-500">
                              {productNumberLabel}
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
                              {item.commentCount}
                            </b>
                            ком.
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

      <section className="flex flex-col gap-3 rounded-[28px] border border-[#eadfce] bg-white/76 px-5 py-4 text-sm text-neutral-600 shadow-[0_18px_44px_rgba(58,42,22,0.045)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-semibold text-neutral-950">{pagination.page}</span>
          <span> / {pagination.totalPages} сторінок</span>
          <span className="mx-2 text-neutral-300">|</span>
          <span>{pagination.totalItems} коментарів</span>
          <span className="mx-2 text-neutral-300">|</span>
          <span>{stats.uniqueProductCount} товарів у вибірці</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void goToPrevPage()}
            disabled={!pagination.hasPrevPage || loading}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#d8c6aa] bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-[#fffaf2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Назад
          </button>
          <button
            type="button"
            onClick={() => void goToNextPage()}
            disabled={!pagination.hasNextPage || loading}
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Далі
          </button>
        </div>
      </section>
    </div>
  )
}

export default function AdminCommentsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-[28px] border border-[#eadfce] bg-white/72 p-8 text-sm text-neutral-500">
          Завантаження коментарів...
        </div>
      }
    >
      <AdminCommentsContent />
    </Suspense>
  )
}
