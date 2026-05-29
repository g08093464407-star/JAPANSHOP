"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ExternalLink, List, Package, Search } from "lucide-react"

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
  lengthCm: number | null
  widthCm: number | null
  heightCm: number | null
  volumeCm3: number | null
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
    draft: "Чернетка",
    active: "Опубліковано",
    hidden: "Приховано",
    "out-of-stock": "Немає на складі",
    archived: "Архів",
  }

  return labels[status]
}

function getStockLabel(status: StockStatus) {
  const labels: Record<StockStatus, string> = {
    "in-stock": "Є на складі",
    limited: "Малий залишок",
    "out-of-stock": "Немає на складі",
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

type ProductReadinessCheck = {
  key: string
  label: string
  ok: boolean
  severity: "required" | "recommended"
  detail?: string
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function getProductReadiness(product: AdminProduct) {
  const mainImageUrl = product.mainImage?.url?.trim()
  const shippingProfile = product.shippingProfile

  const checks: ProductReadinessCheck[] = [
    {
      key: "slug",
      label: "slug",
      ok: hasText(product.slug),
      severity: "required",
      detail: "Потрібно для URL товару.",
    },
    {
      key: "name",
      label: "Назва товару",
      ok: hasText(product.name),
      severity: "required",
      detail: "Потрібно для сторінки товару, checkout і історії замовлень.",
    },
    {
      key: "price",
      label: "Ціна",
      ok: Number.isFinite(product.price) && product.price > 0,
      severity: "required",
      detail: "Товари з ціною 0 ¥ або нижче треба перевірити перед публікацією.",
    },
    {
      key: "mainImage",
      label: "Головне зображення",
      ok: hasText(mainImageUrl) || product.images.length > 0,
      severity: "required",
      detail: "Використовується в картці товару, на сторінці товару й у checkout.",
    },
    {
      key: "shippingProfile",
      label: "Доставка й пакування",
      ok: Boolean(shippingProfile),
      severity: "required",
      detail: "Потрібно для Smart Box і розрахунку доставки.",
    },
    {
      key: "shippingOrigin",
      label: "Відправлення з",
      ok: hasText(shippingProfile?.shippingOriginPrefecture),
      severity: "required",
      detail: "Використовується для відображення маршруту доставки.",
    },
    {
      key: "sizeClass",
      label: "Legacy sizeClass",
      ok:
        typeof shippingProfile?.sizeClass === "number" &&
        [60, 80, 100, 120, 140, 160, 170].includes(shippingProfile.sizeClass),
      severity: "required",
      detail: "Legacy-поле для сумісності з розрахунком ゆうパック.",
    },
    {
      key: "productDimensions",
      label: "Габарити й обʼєм товару",
      ok:
        typeof shippingProfile?.lengthCm === "number" &&
        shippingProfile.lengthCm > 0 &&
        typeof shippingProfile?.widthCm === "number" &&
        shippingProfile.widthCm > 0 &&
        typeof shippingProfile?.heightCm === "number" &&
        shippingProfile.heightCm > 0 &&
        typeof shippingProfile?.volumeCm3 === "number" &&
        shippingProfile.volumeCm3 > 0,
      severity: "required",
      detail: "Використовується Smart Box для вибору коробки.",
    },
    {
      key: "stockStatus",
      label: "Стан складу",
      ok: product.stockStatus !== "out-of-stock",
      severity: "required",
      detail: "Товар без залишку не можна купити.",
    },
    {
      key: "description",
      label: "Опис товару",
      ok: hasText(product.description),
      severity: "recommended",
      detail: "Впливає на переконливість сторінки товару.",
    },
    {
      key: "category",
      label: "Категорія",
      ok: hasText(product.category),
      severity: "recommended",
      detail: "Використовується для рекомендацій, story і категоризації.",
    },
    {
      key: "seo",
      label: "SEO-опис",
      ok: hasText(product.seoDescription),
      severity: "recommended",
      detail: "Впливає на якість пошуку й OG-відображення.",
    },
  ]

  const requiredMissing = checks.filter(
    (check) => check.severity === "required" && !check.ok
  )
  const recommendedMissing = checks.filter(
    (check) => check.severity === "recommended" && !check.ok
  )

  return {
    checks,
    requiredMissing,
    recommendedMissing,
    isReadyForPublish: requiredMissing.length === 0,
    score: checks.filter((check) => check.ok).length,
    total: checks.length,
  }
}

function getReadinessClass(isReadyForPublish: boolean, recommendedMissingCount: number) {
  if (!isReadyForPublish) return "bg-red-50 text-red-700 ring-red-200"
  if (recommendedMissingCount > 0) return "bg-amber-50 text-amber-700 ring-amber-200"
  return "bg-emerald-50 text-emerald-700 ring-emerald-200"
}

function getReadinessLabel(isReadyForPublish: boolean, recommendedMissingCount: number) {
  if (!isReadyForPublish) return "Потрібні правки"
  if (recommendedMissingCount > 0) return "Можна публікувати / є рекомендації"
  return "Готово до публікації"
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
  const [activeProductNav, setActiveProductNav] = useState<
    "products" | "filters" | "catalog" | "shop"
  >("products")

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

      params.set("_ts", String(Date.now()))

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

        const readiness = getProductReadiness(product)
        if (readiness.isReadyForPublish) acc.ready += 1
        if (!readiness.isReadyForPublish) acc.needsFix += 1
        if (readiness.recommendedMissing.length > 0) acc.recommendedFix += 1

        return acc
      },
      {
        active: 0,
        outOfStock: 0,
        archived: 0,
        ready: 0,
        needsFix: 0,
        recommendedFix: 0,
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

      setProducts((current) =>
        current.map((currentProduct) =>
          currentProduct.id === product.id ? data.product! : currentProduct
        )
      )
      setDrafts((current) => ({
        ...current,
        [product.id]: createDraft(data.product!),
      }))

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
  const getProductNavClass = (item: typeof activeProductNav) =>
    `inline-flex h-11 w-11 items-center justify-center rounded-xl border transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 lg:hover:translate-x-0.5 lg:hover:translate-y-0 ${
      activeProductNav === item
        ? "border-neutral-900 bg-neutral-900 text-white hover:opacity-90"
        : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
    }`

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:pr-24">
      <nav
        aria-label="Навігація сторінки товарів"
        className="z-30 mb-8 flex justify-end lg:fixed lg:right-6 lg:top-1/2 lg:mb-0 lg:-translate-y-1/2"
      >
        <div className="inline-flex gap-2 rounded-2xl border border-neutral-200 bg-white/92 p-2 shadow-sm backdrop-blur lg:flex-col">
          <a
            href="#products"
            onClick={() => setActiveProductNav("products")}
            aria-label="Товари"
            title="Товари"
            className={getProductNavClass("products")}
          >
            <Package className="h-[18px] w-[18px]" />
          </a>
          <a
            href="#filters"
            onClick={() => setActiveProductNav("filters")}
            aria-label="Пошук"
            title="Пошук"
            className={getProductNavClass("filters")}
          >
            <Search className="h-[18px] w-[18px]" />
          </a>
          <a
            href="#catalog"
            onClick={() => setActiveProductNav("catalog")}
            aria-label="Список"
            title="Список"
            className={getProductNavClass("catalog")}
          >
            <List className="h-[18px] w-[18px]" />
          </a>
          <Link
            href="/shop"
            onClick={() => setActiveProductNav("shop")}
            target="_blank"
            rel="noreferrer"
            aria-label="Відкрити магазин"
            title="Відкрити магазин"
            className={getProductNavClass("shop")}
          >
            <ExternalLink className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </nav>

      <section id="products" className="scroll-mt-28">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm tracking-[0.2em] text-neutral-500">АДМІН / ТОВАРИ</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              Керування товарами
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
              Перевірка каталогу, статусу публікації, складу й готовності товарів до продажу.
            </p>
          </div>

        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.18em] text-neutral-500">УСЬОГО</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {pagination.totalItems}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Товарів за поточними умовами</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.18em] text-neutral-500">АКТИВНІ</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {pageStats.active}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Опубліковані на цій сторінці</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.18em] text-neutral-500">НЕМАЄ НА СКЛАДІ</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {pageStats.outOfStock}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Товари без залишку на цій сторінці</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.18em] text-neutral-500">ГОТОВІ</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {pageStats.ready}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Мають усі обовʼязкові дані</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.18em] text-neutral-500">ПОТРЕБУЮТЬ ПРАВОК</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {pageStats.needsFix}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Потрібно виправити перед публікацією</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.18em] text-neutral-500">ВАРТІСТЬ СТОРІНКИ</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatYen(pageStats.totalValue)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Орієнтовна сума цін у вибірці</p>
          </div>
        </div>
      </section>

      <section
        id="filters"
        className="mb-8 scroll-mt-28 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-neutral-900">Пошук і фільтри</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Шукайте за назвою товару, slug, legacy id або категорією.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Назва / slug / категорія"
            className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm outline-none transition focus:border-neutral-900"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm outline-none transition focus:border-neutral-900"
          >
            <option value="">Усі статуси</option>
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
            <option value="">Усі стани складу</option>
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
              Пошук
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-11 rounded-xl border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Скинути
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
          Показувати архівні товари
        </label>
      </section>

      <section
        id="catalog"
        className="scroll-mt-28 overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Список товарів</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {loading ? "Завантаження..." : `Показано ${products.length} з ${pagination.totalItems}`}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => loadProducts(pagination.page - 1)}
              disabled={!hasPrevPage || loading}
              className="rounded-xl border border-neutral-200 px-4 py-2 font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Назад
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
              Далі
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
              Немає товарів за поточними умовами.
            </div>
          ) : null}

          {products.map((product) => {
            const draft = drafts[product.id] ?? createDraft(product)
            const isSaving = savingId === product.id
            const readiness = getProductReadiness(product)

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
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${getReadinessClass(readiness.isReadyForPublish, readiness.recommendedMissing.length)}`}>
                          {getReadinessLabel(readiness.isReadyForPublish, readiness.recommendedMissing.length)}
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
                          <span className="text-neutral-400">ціна:</span>{" "}
                          <span className="font-semibold text-neutral-900">
                            {formatYen(product.price)}
                          </span>
                        </p>
                        <p>
                          <span className="text-neutral-400">оновлено:</span>{" "}
                          {formatDate(product.updatedAt)}
                        </p>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-neutral-500 md:grid-cols-3">
                        <div className="rounded-xl bg-neutral-50 p-3">
                          <p className="text-neutral-400">Відправлення з</p>
                          <p className="mt-1 font-medium text-neutral-800">
                            {product.shippingProfile?.shippingOriginPrefecture ?? "Не задано"}
                          </p>
                        </div>
                        <div className="rounded-xl bg-neutral-50 p-3">
                          <p className="text-neutral-400">Габарити товару</p>
                          <p className="mt-1 font-medium text-neutral-800">
                            {product.shippingProfile?.lengthCm &&
                            product.shippingProfile.widthCm &&
                            product.shippingProfile.heightCm
                              ? `${product.shippingProfile.lengthCm} × ${product.shippingProfile.widthCm} × ${product.shippingProfile.heightCm} cm`
                              : "Не задано"}
                          </p>
                          <p className="mt-1 text-[11px] leading-4 text-neutral-500">
                            Smart Box:{" "}
                            {product.shippingProfile?.volumeCm3
                              ? `${product.shippingProfile.volumeCm3.toLocaleString()} cm³`
                              : "обʼєм не задано"}
                            {product.shippingProfile?.weightGrams
                              ? ` / ${product.shippingProfile.weightGrams.toLocaleString()} g`
                              : ""}
                          </p>
                        </div>
                        <div className="rounded-xl bg-neutral-50 p-3">
                          <p className="text-neutral-400">Зображення</p>
                          <p className="mt-1 font-medium text-neutral-800">
                            {product.images.length} файлів
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl border border-neutral-200 bg-white p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-medium tracking-[0.18em] text-neutral-500">
                              Готовність товару
                            </p>
                            <p className="mt-1 text-sm font-semibold text-neutral-900">
                              {readiness.score} / {readiness.total} перевірок
                            </p>
                          </div>
                          <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${getReadinessClass(readiness.isReadyForPublish, readiness.recommendedMissing.length)}`}>
                            {getReadinessLabel(readiness.isReadyForPublish, readiness.recommendedMissing.length)}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {readiness.checks.map((check) => (
                            <div
                              key={check.key}
                              title={check.detail}
                              className={`rounded-xl border px-3 py-2 text-xs ${
                                check.ok
                                  ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                                  : check.severity === "required"
                                    ? "border-red-100 bg-red-50 text-red-800"
                                    : "border-amber-100 bg-amber-50 text-amber-800"
                              }`}
                            >
                              <span className="mr-1 font-semibold">
                                {check.ok ? "✓" : check.severity === "required" ? "!" : "△"}
                              </span>
                              {check.label}
                            </div>
                          ))}
                        </div>

                        {readiness.requiredMissing.length > 0 ? (
                          <p className="mt-3 text-xs leading-5 text-red-700">
                            Бракує обовʼязкового: {readiness.requiredMissing.map((check) => check.label).join(" / ")}
                          </p>
                        ) : readiness.recommendedMissing.length > 0 ? (
                          <p className="mt-3 text-xs leading-5 text-amber-700">
                            Рекомендовано перевірити: {readiness.recommendedMissing.map((check) => check.label).join(" / ")}
                          </p>
                        ) : (
                          <p className="mt-3 text-xs leading-5 text-emerald-700">
                            Основні дані для публікації та покупки заповнені.
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/product/${product.slug}`}
                          target="_blank"
                          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50"
                        >
                          Відкрити сторінку товару
                        </Link>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(product.slug)}
                          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50"
                        >
                          Копіювати slug
                        </button>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50"
                        >
                          Детальне редагування
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-[#fffaf2] p-4">
                    <p className="text-xs font-medium tracking-[0.18em] text-neutral-500">
                      Швидке оновлення
                    </p>

                    <div className="mt-4 grid gap-3">
                      <label className="grid gap-1 text-xs text-neutral-500">
                        Статус публікації
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
                        Стан складу
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
                        Кількість на складі
                        <input
                          value={draft.stockQuantity}
                          onChange={(event) =>
                            updateDraft(product.id, {
                              stockQuantity: event.target.value.replace(/\D/g, ""),
                            })
                          }
                          placeholder="Не задано"
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
                          {isSaving ? "Збереження..." : "Зберегти"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleArchive(product)}
                          disabled={isSaving || product.isArchived}
                          className="h-10 rounded-xl border border-red-200 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          В архів
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
        <h2 className="text-xl font-semibold text-neutral-900">Операційні нотатки</h2>
        <div className="mt-4 grid gap-4 text-sm leading-7 text-neutral-600 md:grid-cols-3">
          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="font-medium text-neutral-900">Архівування замість видалення</p>
            <p className="mt-2">
              Для збереження узгодженості з історією замовлень товари не видаляємо, а архівуємо.
            </p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="font-medium text-neutral-900">Дані доставки обовʼязкові</p>
            <p className="mt-2">
              Для Smart Box і розрахунку доставки зберігаємо місце відправлення, габарити й обʼєм товару.
            </p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="font-medium text-neutral-900">Контроль перед публікацією</p>
            <p className="mt-2">
              Перевіряємо обовʼязкові й рекомендовані поля товару перед публікацією.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
