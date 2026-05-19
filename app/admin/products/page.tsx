"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type ProductStatus = "draft" | "active" | "hidden" | "out-of-stock" | "archived"
type StockStatus = "in-stock" | "limited" | "out-of-stock"

type PaginationInfo = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

type AdminProductImage = {
  id: string
  productId: string
  url: string
  alt: string | null
  role: string
  sortOrder: number
  createdAt: string
}

type AdminProductShippingProfile = {
  id: string
  productId: string
  shippingOriginPrefecture: string
  sizeClass: number
  volumeUnits: number
  weightGrams: number | null
  packageType: string
  temperatureType: string
  createdAt: string
  updatedAt: string
}

type AdminProduct = {
  id: string
  legacyId: string
  slug: string
  name: string
  price: number
  shortDescription: string | null
  description: string
  origin: string | null
  ingredients: string | null
  allergens: string | null
  shelfLife: string | null
  storage: string | null
  category: string | null
  tag: string | null
  stockStatus: StockStatus
  stockQuantity: number | null
  status: ProductStatus
  isActive: boolean
  isArchived: boolean
  seoTitle: string | null
  seoDescription: string | null
  canonicalSlug: string | null
  createdAt: string
  updatedAt: string
  images: AdminProductImage[]
  mainImage: AdminProductImage | null
  shippingProfile: AdminProductShippingProfile | null
}

type AdminProductsResponse = {
  products?: AdminProduct[]
  pagination?: PaginationInfo
  error?: string
}

type ProductQuickDraft = {
  status: ProductStatus
  stockStatus: StockStatus
  stockQuantity: string
}

const PAGE_SIZE = 20

const productStatusOptions: ProductStatus[] = [
  "draft",
  "active",
  "hidden",
  "out-of-stock",
  "archived",
]

const stockStatusOptions: StockStatus[] = [
  "in-stock",
  "limited",
  "out-of-stock",
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

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getStatusLabel(status: ProductStatus) {
  const labels: Record<ProductStatus, string> = {
    draft: "下書き",
    active: "公開中",
    hidden: "非表示",
    "out-of-stock": "在庫切れ",
    archived: "アーカイブ",
  }

  return labels[status]
}

function getStockLabel(status: StockStatus) {
  const labels: Record<StockStatus, string> = {
    "in-stock": "在庫あり",
    limited: "残りわずか",
    "out-of-stock": "在庫切れ",
  }

  return labels[status]
}

function getStatusClass(status: ProductStatus) {
  if (status === "active") return "bg-emerald-50 text-emerald-700 ring-emerald-200"
  if (status === "draft") return "bg-amber-50 text-amber-700 ring-amber-200"
  if (status === "hidden") return "bg-neutral-100 text-neutral-700 ring-neutral-200"
  if (status === "out-of-stock") return "bg-red-50 text-red-700 ring-red-200"
  return "bg-neutral-950 text-white ring-neutral-950"
}

function getStockClass(status: StockStatus) {
  if (status === "in-stock") return "bg-emerald-50 text-emerald-700 ring-emerald-200"
  if (status === "limited") return "bg-amber-50 text-amber-700 ring-amber-200"
  return "bg-red-50 text-red-700 ring-red-200"
}

function createDraft(product: AdminProduct): ProductQuickDraft {
  return {
    status: product.status,
    stockStatus: product.stockStatus,
    stockQuantity:
      typeof product.stockQuantity === "number"
        ? String(product.stockQuantity)
        : "",
  }
}

function ProductImage({
  image,
  name,
}: {
  image: AdminProductImage | null
  name: string
}) {
  const [failed, setFailed] = useState(false)

  if (!image?.url || failed) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#f4ead9] text-[10px] text-neutral-400">
        No image
      </div>
    )
  }

  return (
    <img
      src={image.url}
      alt={image.alt ?? name}
      className="h-16 w-16 shrink-0 rounded-2xl object-cover"
      onError={() => setFailed(true)}
    />
  )
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  })
  const [drafts, setDrafts] = useState<Record<string, ProductQuickDraft>>({})

  const [searchInput, setSearchInput] = useState("")
  const [activeSearch, setActiveSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [stockFilter, setStockFilter] = useState("")
  const [includeArchived, setIncludeArchived] = useState(false)

  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function loadProducts(targetPage: number) {
    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams()
      params.set("page", String(targetPage))
      params.set("pageSize", String(PAGE_SIZE))

      if (activeSearch.trim()) {
        params.set("q", activeSearch.trim())
      }

      if (statusFilter) {
        params.set("status", statusFilter)
      }

      if (stockFilter) {
        params.set("stockStatus", stockFilter)
      }

      if (includeArchived) {
        params.set("includeArchived", "true")
      }

      const response = await fetch(`/api/admin/products?${params.toString()}`, {
        cache: "no-store",
      })
      const data = (await response.json()) as AdminProductsResponse

      if (!response.ok || !data.products || !data.pagination) {
        setError(data.error ?? "商品一覧の取得に失敗しました。")
        return
      }

      setProducts(data.products)
      setPagination(data.pagination)

      const nextDrafts: Record<string, ProductQuickDraft> = {}

      for (const product of data.products) {
        nextDrafts[product.id] = createDraft(product)
      }

      setDrafts(nextDrafts)
    } catch (loadError) {
      console.error("Failed to load admin products:", loadError)
      setError("商品一覧の取得中に通信エラーが発生しました。")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearch, statusFilter, stockFilter, includeArchived])

  const pageStats = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        acc.totalValue += product.price
        if (product.status === "active") acc.active += 1
        if (product.stockStatus === "out-of-stock") acc.outOfStock += 1
        if (product.isArchived) acc.archived += 1
        return acc
      },
      {
        active: 0,
        outOfStock: 0,
        archived: 0,
        totalValue: 0,
      }
    )
  }, [products])

  function updateDraft(productId: string, patch: Partial<ProductQuickDraft>) {
    setDrafts((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        ...patch,
      },
    }))
  }

  async function handleSaveQuick(product: AdminProduct) {
    const draft = drafts[product.id]

    if (!draft) return

    const parsedStockQuantity =
      draft.stockQuantity.trim() === ""
        ? null
        : Number.parseInt(draft.stockQuantity.trim(), 10)

    if (
      parsedStockQuantity !== null &&
      (!Number.isFinite(parsedStockQuantity) || parsedStockQuantity < 0)
    ) {
      alert("在庫数は0以上の整数で入力してください。")
      return
    }

    try {
      setSavingId(product.id)

      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: draft.status,
          stockStatus: draft.stockStatus,
          stockQuantity: parsedStockQuantity,
        }),
      })

      const data = (await response.json()) as {
        product?: AdminProduct
        error?: string
      }

      if (!response.ok || !data.product) {
        alert(data.error ?? "商品の更新に失敗しました。")
        return
      }

      await loadProducts(pagination.page)
    } catch (saveError) {
      console.error("Failed to save product:", saveError)
      alert("商品の更新中に通信エラーが発生しました。")
    } finally {
      setSavingId(null)
    }
  }

  async function handleArchive(product: AdminProduct) {
    const confirmed = window.confirm(
      `「${product.name}」をアーカイブしますか？\n商品は削除されず、管理画面から復旧できる状態で残ります。`
    )

    if (!confirmed) return

    try {
      setSavingId(product.id)

      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      })

      const data = (await response.json()) as {
        product?: AdminProduct
        error?: string
      }

      if (!response.ok || !data.product) {
        alert(data.error ?? "商品のアーカイブに失敗しました。")
        return
      }

      await loadProducts(pagination.page)
    } catch (archiveError) {
      console.error("Failed to archive product:", archiveError)
      alert("商品のアーカイブ中に通信エラーが発生しました。")
    } finally {
      setSavingId(null)
    }
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActiveSearch(searchInput)
  }

  function handleResetFilters() {
    setSearchInput("")
    setActiveSearch("")
    setStatusFilter("")
    setStockFilter("")
    setIncludeArchived(false)
  }

  const hasPrevPage = pagination.page > 1
  const hasNextPage = pagination.page < pagination.totalPages

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="sticky top-3 z-30 mb-8 rounded-2xl border border-neutral-200 bg-white/92 p-3 shadow-sm backdrop-blur">
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-6">
          <Link
            href="/admin"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            管理トップ
          </Link>
          <a
            href="#products"
            className="rounded-xl bg-neutral-900 px-4 py-3 text-center font-medium text-white transition hover:opacity-90"
          >
            商品
          </a>
          <a
            href="#filters"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            検索
          </a>
          <a
            href="#catalog"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            一覧
          </a>
          <a
            href="#operations"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            運用メモ
          </a>
          <Link
            href="/shop"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            店舗を見る
          </Link>
        </div>
      </nav>

      <section id="products" className="scroll-mt-28">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm tracking-[0.2em] text-neutral-500">ADMIN / PRODUCTS</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              商品管理
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
              Neonの商品カタログを確認し、公開状態・在庫状態・在庫数をすばやく更新できます。
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/products/new"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:opacity-90"
            >
              新規商品登録
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.18em] text-neutral-500">TOTAL</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {pagination.totalItems}
            </p>
            <p className="mt-1 text-xs text-neutral-500">条件一致の商品数</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.18em] text-neutral-500">ACTIVE PAGE</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {pageStats.active}
            </p>
            <p className="mt-1 text-xs text-neutral-500">このページの公開中商品</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.18em] text-neutral-500">OUT OF STOCK</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {pageStats.outOfStock}
            </p>
            <p className="mt-1 text-xs text-neutral-500">このページの在庫切れ</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.18em] text-neutral-500">PAGE VALUE</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatYen(pageStats.totalValue)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">単価合計の簡易目安</p>
          </div>
        </div>
      </section>

      <section
        id="filters"
        className="mb-8 scroll-mt-28 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-neutral-900">検索・絞り込み</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            商品名、slug、legacy id、カテゴリーで検索できます。
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="商品名 / slug / category"
            className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm outline-none transition focus:border-neutral-900"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm outline-none transition focus:border-neutral-900"
          >
            <option value="">全ステータス</option>
            {productStatusOptions.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm outline-none transition focus:border-neutral-900"
          >
            <option value="">全在庫状態</option>
            {stockStatusOptions.map((status) => (
              <option key={status} value={status}>
                {getStockLabel(status)}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="h-11 rounded-xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:opacity-90"
            >
              検索
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-11 rounded-xl border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              リセット
            </button>
          </div>
        </form>

        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-300"
          />
          アーカイブ済みも表示
        </label>
      </section>

      <section
        id="catalog"
        className="scroll-mt-28 overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">商品一覧</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {loading ? "読み込み中..." : `${pagination.totalItems}件中 ${products.length}件を表示`}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => loadProducts(pagination.page - 1)}
              disabled={!hasPrevPage || loading}
              className="rounded-xl border border-neutral-200 px-4 py-2 font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              前へ
            </button>
            <span className="min-w-20 text-center text-neutral-500">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => loadProducts(pagination.page + 1)}
              disabled={!hasNextPage || loading}
              className="rounded-xl border border-neutral-200 px-4 py-2 font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              次へ
            </button>
          </div>
        </div>

        {error ? (
          <div className="border-b border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="divide-y divide-neutral-100">
          {products.length === 0 && !loading ? (
            <div className="p-10 text-center text-sm text-neutral-500">
              条件に一致する商品がありません。
            </div>
          ) : null}

          {products.map((product) => {
            const draft = drafts[product.id] ?? createDraft(product)
            const isSaving = savingId === product.id

            return (
              <article key={product.id} className="p-5">
                <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
                  <div className="flex gap-4">
                    <ProductImage image={product.mainImage} name={product.name} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${getStatusClass(product.status)}`}>
                          {getStatusLabel(product.status)}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${getStockClass(product.stockStatus)}`}>
                          {getStockLabel(product.stockStatus)}
                        </span>
                        {product.category ? (
                          <span className="rounded-full bg-[#fffaf2] px-2.5 py-1 text-xs text-neutral-600 ring-1 ring-[#eadfce]">
                            {product.category}
                          </span>
                        ) : null}
                        {product.tag ? (
                          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                            {product.tag}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-neutral-950">
                        {product.name}
                      </h3>

                      <div className="mt-2 grid gap-1 text-sm text-neutral-500 md:grid-cols-2">
                        <p>
                          <span className="text-neutral-400">slug:</span>{" "}
                          <span className="font-mono text-xs">{product.slug}</span>
                        </p>
                        <p>
                          <span className="text-neutral-400">legacy:</span>{" "}
                          <span className="font-mono text-xs">{product.legacyId}</span>
                        </p>
                        <p>
                          <span className="text-neutral-400">price:</span>{" "}
                          <span className="font-semibold text-neutral-900">
                            {formatYen(product.price)}
                          </span>
                        </p>
                        <p>
                          <span className="text-neutral-400">updated:</span>{" "}
                          {formatDate(product.updatedAt)}
                        </p>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-neutral-500 md:grid-cols-3">
                        <div className="rounded-xl bg-neutral-50 p-3">
                          <p className="text-neutral-400">配送元</p>
                          <p className="mt-1 font-medium text-neutral-800">
                            {product.shippingProfile?.shippingOriginPrefecture ?? "未設定"}
                          </p>
                        </div>
                        <div className="rounded-xl bg-neutral-50 p-3">
                          <p className="text-neutral-400">梱包</p>
                          <p className="mt-1 font-medium text-neutral-800">
                            {product.shippingProfile
                              ? `${product.shippingProfile.sizeClass}サイズ / ${product.shippingProfile.volumeUnits} units`
                              : "未設定"}
                          </p>
                        </div>
                        <div className="rounded-xl bg-neutral-50 p-3">
                          <p className="text-neutral-400">画像</p>
                          <p className="mt-1 font-medium text-neutral-800">
                            {product.images.length} files
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/product/${product.slug}`}
                          target="_blank"
                          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50"
                        >
                          商品ページを見る
                        </Link>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(product.slug)}
                          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50"
                        >
                          slugコピー
                        </button>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50"
                        >
                          詳細編集
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-[#fffaf2] p-4">
                    <p className="text-xs font-medium tracking-[0.18em] text-neutral-500">
                      QUICK UPDATE
                    </p>

                    <div className="mt-4 grid gap-3">
                      <label className="grid gap-1 text-xs text-neutral-500">
                        公開状態
                        <select
                          value={draft.status}
                          onChange={(event) =>
                            updateDraft(product.id, {
                              status: event.target.value as ProductStatus,
                            })
                          }
                          className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                        >
                          {productStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {getStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-1 text-xs text-neutral-500">
                        在庫状態
                        <select
                          value={draft.stockStatus}
                          onChange={(event) =>
                            updateDraft(product.id, {
                              stockStatus: event.target.value as StockStatus,
                            })
                          }
                          className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                        >
                          {stockStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {getStockLabel(status)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-1 text-xs text-neutral-500">
                        在庫数
                        <input
                          value={draft.stockQuantity}
                          onChange={(event) =>
                            updateDraft(product.id, {
                              stockQuantity: event.target.value.replace(/\D/g, ""),
                            })
                          }
                          placeholder="未設定"
                          inputMode="numeric"
                          className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSaveQuick(product)}
                          disabled={isSaving}
                          className="h-10 rounded-xl bg-neutral-950 px-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSaving ? "保存中..." : "保存"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleArchive(product)}
                          disabled={isSaving || product.isArchived}
                          className="h-10 rounded-xl border border-red-200 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          アーカイブ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section
        id="operations"
        className="mt-8 scroll-mt-28 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-semibold text-neutral-900">運用メモ</h2>
        <div className="mt-4 grid gap-4 text-sm leading-7 text-neutral-600 md:grid-cols-3">
          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="font-medium text-neutral-900">削除ではなくアーカイブ</p>
            <p className="mt-2">
              注文履歴との整合性を守るため、通常商品は物理削除せずアーカイブします。
            </p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="font-medium text-neutral-900">配送情報は必須</p>
            <p className="mt-2">
              Smart Boxと送料計算のため、配送元・サイズ・volume unitsを商品ごとに管理します。
            </p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="font-medium text-neutral-900">詳細編集は次段階</p>
            <p className="mt-2">
              次のステップで商品作成・画像・SEO・FAQ・配送情報を編集するフォームを追加します。
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
