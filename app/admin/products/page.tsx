"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { ExternalLink, List, Package, Search } from "lucide-react"

import { getProductReadiness } from "@/lib/product/readiness"

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
  focusedProduct?: AdminProduct | null
  pagination?: PaginationInfo
  summary?: ProductSummary
  error?: string
}

type ProductSummary = {
  total: number
  drafts: number
  needsData: number
  onSale: number
  limitedStock: number
  outOfStock: number
  previews: {
    needsData: ProductMetricPreview[]
    limitedStock: ProductMetricPreview[]
    outOfStock: ProductMetricPreview[]
  }
}

type ProductMetricPreview = {
  id: string
  legacyId: string | null
  name: string
  image: string | null
  stockQuantity: number | null
  missingRequiredLabels: string[]
}

type PopularProduct = {
  productKey: string
  slug: string | null
  id: string | null
  name: string
  image: string | null
  quantityTotal: number
  orderCount: number
  revenueTotal: number
  lastOrderedAt: string
}

type PopularProductsResponse = {
  products?: PopularProduct[]
  error?: string
}

type ProductQuickDraft = {
  status: ProductStatus
  stockStatus: StockStatus
  stockQuantity: string
}

type ProductReadinessFilter = "all" | "needs-data"
type ProductMetricModal = "needsData" | "limitedStock" | "outOfStock" | null
type ProductListUrlFilters = {
  q: string
  status: ProductStatus | ""
  stockStatus: StockStatus | ""
  readiness: ProductReadinessFilter
  includeArchived: boolean
}

const PAGE_SIZE = 20

const productStatusOptions: ProductStatus[] = [
  "draft",
  "active",
  "hidden",
  "out-of-stock",
  "archived",
]
const visibleProductStatusFilterOptions: ProductStatus[] = [
  "draft",
  "active",
  "hidden",
  "archived",
]
const editableProductStatusOptions: ProductStatus[] = [
  "draft",
  "active",
  "hidden",
  "archived",
]

const stockStatusOptions: StockStatus[] = [
  "in-stock",
  "limited",
  "out-of-stock",
]

function isProductStatusFilter(value: string | null): value is ProductStatus {
  return productStatusOptions.includes(value as ProductStatus)
}

function isStockStatusFilter(value: string | null): value is StockStatus {
  return stockStatusOptions.includes(value as StockStatus)
}

function parseProductsPage(value: string | null) {
  if (!value) return 1

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function parseProductIssue(value: string | null): ProductMetricModal {
  if (value === "needsData" || value === "limitedStock" || value === "outOfStock") {
    return value
  }

  return null
}

function buildProductsUrl(targetPage: number, filters: ProductListUrlFilters) {
  const params = new URLSearchParams()

  if (targetPage > 1) {
    params.set("page", String(targetPage))
  }

  if (filters.q.trim()) {
    params.set("q", filters.q.trim())
  }

  if (filters.status) {
    params.set("status", filters.status)
  }

  if (filters.stockStatus) {
    params.set("stockStatus", filters.stockStatus)
  }

  if (filters.readiness === "needs-data") {
    params.set("readiness", "needs-data")
  }

  if (filters.includeArchived) {
    params.set("includeArchived", "true")
  }

  const query = params.toString()
  return query ? `/admin/products?${query}` : "/admin/products"
}

function createEmptyProductSummary(): ProductSummary {
  return {
    total: 0,
    drafts: 0,
    needsData: 0,
    onSale: 0,
    limitedStock: 0,
    outOfStock: 0,
    previews: {
      needsData: [],
      limitedStock: [],
      outOfStock: [],
    },
  }
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

function AdminProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlSearchQuery = searchParams.get("q")?.trim() ?? ""
  const urlStatusParam = searchParams.get("status")
  const urlStockParam = searchParams.get("stockStatus")
  const urlStatusFilter: ProductStatus | "" = isProductStatusFilter(
    urlStatusParam
  )
    ? urlStatusParam
    : ""
  const urlStockFilter: StockStatus | "" = isStockStatusFilter(urlStockParam)
    ? urlStockParam
    : ""
  const urlIncludeArchived = searchParams.get("includeArchived") === "true"
  const urlReadinessFilter: ProductReadinessFilter =
    searchParams.get("readiness") === "needs-data" ? "needs-data" : "all"
  const urlPage = parseProductsPage(searchParams.get("page"))
  const focusProductId = searchParams.get("focus")?.trim() ?? ""
  const urlIssueModal = parseProductIssue(searchParams.get("issue"))
  const urlFilters: ProductListUrlFilters = {
    q: urlSearchQuery,
    status: urlStatusFilter,
    stockStatus: urlStockFilter,
    readiness: urlReadinessFilter,
    includeArchived: urlIncludeArchived,
  }
  const productCardRefs = useRef<Record<string, HTMLElement | null>>({})
  const lastScrolledFocusRef = useRef<string | null>(null)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const productsRequestSeqRef = useRef(0)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [focusedProduct, setFocusedProduct] = useState<AdminProduct | null>(null)
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([])
  const [productsSummary, setProductsSummary] = useState<ProductSummary>(
    createEmptyProductSummary
  )
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  })
  const [drafts, setDrafts] = useState<Record<string, ProductQuickDraft>>({})

  const [searchInput, setSearchInput] = useState(urlSearchQuery)
  const [activeSearch, setActiveSearch] = useState(urlSearchQuery)
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">(
    urlStatusFilter
  )
  const [activeStatusFilter, setActiveStatusFilter] = useState<ProductStatus | "">(
    urlStatusFilter
  )
  const [stockFilter, setStockFilter] = useState<StockStatus | "">(
    urlStockFilter
  )
  const [activeStockFilter, setActiveStockFilter] = useState<StockStatus | "">(
    urlStockFilter
  )
  const [readinessFilter, setReadinessFilter] =
    useState<ProductReadinessFilter>(urlReadinessFilter)
  const [activeReadinessFilter, setActiveReadinessFilter] =
    useState<ProductReadinessFilter>(urlReadinessFilter)
  const [includeArchived, setIncludeArchived] = useState(urlIncludeArchived)
  const [activeIncludeArchived, setActiveIncludeArchived] =
    useState(urlIncludeArchived)
  const [activeProductNav, setActiveProductNav] = useState<
    "products" | "filters" | "catalog" | "shop"
  >("products")

  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(
    null
  )
  const [metricModal, setMetricModal] = useState<ProductMetricModal>(null)
  const [error, setError] = useState("")

  const closeMetricModal = useCallback(() => {
    if (!searchParams.has("issue")) {
      setMetricModal(null)
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.delete("issue")
    const query = params.toString()

    router.push(query ? `/admin/products?${query}` : "/admin/products")
  }, [router, searchParams])

  async function loadPopularProducts() {
    try {
      const response = await fetch("/api/admin/orders/popular-products?limit=50", {
        cache: "no-store",
      })
      const data = (await response.json()) as PopularProductsResponse

      if (!response.ok || !Array.isArray(data.products)) {
        console.error(
          "Failed to load popular product recommendations:",
          data.error ?? "unknown_error"
        )
        setPopularProducts([])
        return
      }

      setPopularProducts(data.products)
    } catch (loadError) {
      console.error("Failed to load popular product recommendations:", loadError)
      setPopularProducts([])
    }
  }

  async function loadProducts(
    targetPage: number,
    filters: ProductListUrlFilters,
    focusId: string
  ) {
    const requestId = productsRequestSeqRef.current + 1
    productsRequestSeqRef.current = requestId
    const isLatestRequest = () => productsRequestSeqRef.current === requestId

    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams()
      params.set("page", String(targetPage))
      params.set("pageSize", String(PAGE_SIZE))

      if (filters.q.trim()) {
        params.set("q", filters.q.trim())
      }

      if (filters.status) {
        params.set("status", filters.status)
      }

      if (filters.stockStatus) {
        params.set("stockStatus", filters.stockStatus)
      }

      if (filters.includeArchived) {
        params.set("includeArchived", "true")
      }

      if (filters.readiness === "needs-data") {
        params.set("readiness", "needs-data")
      }

      if (focusId) {
        params.set("focus", focusId)
      }

      params.set("_ts", String(Date.now()))

      const response = await fetch(`/api/admin/products?${params.toString()}`, {
        cache: "no-store",
      })
      const data = (await response.json()) as AdminProductsResponse

      if (!isLatestRequest()) return

      if (!response.ok || !data.products || !data.pagination || !data.summary) {
        setError(data.error ?? "Не вдалося завантажити список товарів.")
        return
      }

      setProducts(data.products)
      setFocusedProduct(data.focusedProduct ?? null)
      setPagination(data.pagination)
      setProductsSummary(data.summary)

      const nextDrafts: Record<string, ProductQuickDraft> = {}

      for (const product of data.products) {
        nextDrafts[product.id] = createDraft(product)
      }

      if (data.focusedProduct) {
        nextDrafts[data.focusedProduct.id] = createDraft(data.focusedProduct)
      }

      setDrafts(nextDrafts)
    } catch (loadError) {
      if (!isLatestRequest()) return

      console.error("Failed to load admin products:", loadError)
      setError("Під час завантаження товарів сталася помилка звʼязку.")
    } finally {
      if (isLatestRequest()) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadProducts(urlPage, urlFilters, focusProductId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    urlPage,
    urlFilters.q,
    urlFilters.status,
    urlFilters.stockStatus,
    urlFilters.readiness,
    urlFilters.includeArchived,
    focusProductId,
  ])

  useEffect(() => {
    void loadPopularProducts()
  }, [])

  useEffect(() => {
    setMetricModal(urlIssueModal)
  }, [urlIssueModal])

  useEffect(() => {
    setSearchInput(urlSearchQuery)
    setActiveSearch(urlSearchQuery)
    setStatusFilter(urlStatusFilter)
    setActiveStatusFilter(urlStatusFilter)
    setStockFilter(urlStockFilter)
    setActiveStockFilter(urlStockFilter)
    setReadinessFilter(urlReadinessFilter)
    setActiveReadinessFilter(urlReadinessFilter)
    setIncludeArchived(urlIncludeArchived)
    setActiveIncludeArchived(urlIncludeArchived)

    if (
      urlSearchQuery ||
      urlStatusFilter ||
      urlStockFilter ||
      urlReadinessFilter !== "all"
    ) {
      setActiveProductNav("filters")
    }
  }, [
    urlIncludeArchived,
    urlReadinessFilter,
    urlSearchQuery,
    urlStatusFilter,
    urlStockFilter,
  ])

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!metricModal) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMetricModal()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [closeMetricModal, metricModal])

  useEffect(() => {
    if (!focusProductId) {
      lastScrolledFocusRef.current = null
      setHighlightedProductId(null)
      return
    }

    if (loading || lastScrolledFocusRef.current === focusProductId) return

    const focusedElement = productCardRefs.current[focusProductId]

    if (!focusedElement) return

    lastScrolledFocusRef.current = focusProductId

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current)
    }

    window.requestAnimationFrame(() => {
      focusedElement.scrollIntoView({ behavior: "smooth", block: "center" })
      setHighlightedProductId(focusProductId)

      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedProductId((current) =>
          current === focusProductId ? null : current
        )
      }, 2200)
    })
  }, [focusProductId, focusedProduct, loading, products])

  function updateDraft(productId: string, patch: Partial<ProductQuickDraft>) {
    setDrafts((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        ...patch,
      },
    }))
  }

  function getPopularProductForAdminProduct(product: AdminProduct) {
    return popularProducts.find((popular) => {
      return (
        popular.slug === product.slug ||
        popular.id === product.id ||
        popular.id === product.legacyId ||
        popular.productKey === product.slug ||
        popular.productKey === product.legacyId ||
        popular.productKey === product.id
      )
    })
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
      alert("Кількість на складі має бути цілим числом 0 або більше.")
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
        alert(data.error ?? "Не вдалося оновити товар.")
        return
      }

      setProducts((current) =>
        current.map((currentProduct) =>
          currentProduct.id === product.id ? data.product! : currentProduct
        )
      )
      setFocusedProduct((current) =>
        current?.id === product.id ? data.product! : current
      )
      setDrafts((current) => ({
        ...current,
        [product.id]: createDraft(data.product!),
      }))

      await loadProducts(pagination.page, urlFilters, focusProductId)
    } catch (saveError) {
      console.error("Failed to save product:", saveError)
      alert("Під час оновлення товару сталася помилка звʼязку.")
    } finally {
      setSavingId(null)
    }
  }

  async function handleArchive(product: AdminProduct) {
    const confirmed = window.confirm(
      `Архівувати “${product.name}”?\nТовар не буде видалено і залишиться доступним для відновлення в адмінці.`
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
        alert(data.error ?? "Не вдалося архівувати товар.")
        return
      }

      await loadProducts(pagination.page, urlFilters, focusProductId)
    } catch (archiveError) {
      console.error("Failed to archive product:", archiveError)
      alert("Під час архівування товару сталася помилка звʼязку.")
    } finally {
      setSavingId(null)
    }
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    router.push(
      buildProductsUrl(1, {
        q: searchInput.trim(),
        status: statusFilter,
        stockStatus: stockFilter,
        readiness: readinessFilter,
        includeArchived,
      })
    )
  }

  function handleResetFilters() {
    setSearchInput("")
    setActiveSearch("")
    setStatusFilter("")
    setActiveStatusFilter("")
    setStockFilter("")
    setActiveStockFilter("")
    setReadinessFilter("all")
    setActiveReadinessFilter("all")
    setIncludeArchived(false)
    setActiveIncludeArchived(false)
    router.push("/admin/products")
  }

  function openPreviewProduct(productId: string) {
    router.push(`/admin/products?focus=${encodeURIComponent(productId)}`)
  }

  function buildMetricListUrl(target: Exclude<ProductMetricModal, null>) {
    const params = new URLSearchParams()

    if (activeSearch.trim()) {
      params.set("q", activeSearch.trim())
    }

    if (activeStatusFilter) {
      params.set("status", activeStatusFilter)
    }

    if (activeIncludeArchived) {
      params.set("includeArchived", "true")
    }

    if (target === "needsData") {
      params.set("readiness", "needs-data")
    }

    if (target === "limitedStock") {
      params.set("stockStatus", "limited")
    }

    if (target === "outOfStock") {
      params.set("stockStatus", "out-of-stock")
    }

    const query = params.toString()
    return query ? `/admin/products?${query}` : "/admin/products"
  }

  function openMetricList(target: Exclude<ProductMetricModal, null>) {
    router.push(buildMetricListUrl(target))
  }

  const hasPrevPage = pagination.page > 1
  const hasNextPage = pagination.page < pagination.totalPages
  const isFocusedProductOnPage = focusedProduct
    ? products.some((product) => product.id === focusedProduct.id)
    : false
  const visibleProducts =
    focusedProduct && !isFocusedProductOnPage
      ? [focusedProduct, ...products]
      : products
  const getProductNavClass = (item: typeof activeProductNav) =>
    `inline-flex h-11 w-11 items-center justify-center rounded-xl border transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 lg:hover:translate-x-0.5 lg:hover:translate-y-0 ${
      activeProductNav === item
        ? "border-neutral-900 bg-neutral-900 text-white hover:opacity-90"
        : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
    }`
  const metricModalConfig = metricModal
    ? {
        needsData: {
          title: "Товари, що потребують даних",
          subtitle: "До 10 товарів з найбільшою кількістю відсутніх обовʼязкових полів.",
          empty: "Товарів з браком обовʼязкових даних немає.",
          button: "Дивитись всі",
        },
        limitedStock: {
          title: "Товари з малим залишком",
          subtitle: "До 10 товарів, позначених як обмежений склад.",
          empty: "Товарів з малим залишком немає.",
          button: "Дивитись всі",
        },
        outOfStock: {
          title: "Товари без складу",
          subtitle: "До 10 товарів, які зараз позначені як недоступні.",
          empty: "Товарів без складу немає.",
          button: "Дивитись всі",
        },
      }[metricModal]
    : null
  const metricModalItems = metricModal
    ? productsSummary.previews[metricModal]
    : []

  function renderPreviewReason(
    modal: Exclude<ProductMetricModal, null>,
    product: ProductMetricPreview
  ) {
    if (modal === "needsData") {
      const visibleLabels = product.missingRequiredLabels.slice(0, 3)
      const hiddenCount = Math.max(
        0,
        product.missingRequiredLabels.length - visibleLabels.length
      )

      return (
        <>
          Бракує: {visibleLabels.join(" / ") || "обовʼязкові дані"}
          {hiddenCount > 0 ? (
            <span className="ml-1 font-semibold text-neutral-700">
              + ще {hiddenCount}
            </span>
          ) : null}
        </>
      )
    }

    if (modal === "limitedStock") {
      return typeof product.stockQuantity === "number"
        ? `Малий залишок: ${product.stockQuantity} шт.`
        : "Малий залишок, кількість не задана."
    }

    return "Позначено як немає на складі."
  }

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
              {productsSummary.total}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Товарів за поточними умовами</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.18em] text-neutral-500">ЧЕРНЕТКИ</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {productsSummary.drafts}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Ще не опубліковані товари</p>
          </div>
          <button
            type="button"
            onClick={() => setMetricModal("needsData")}
            disabled={productsSummary.needsData === 0}
            aria-label="Показати товари, що потребують даних"
            className="rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#e2d2bb] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:border-neutral-200 disabled:hover:shadow-sm"
          >
            <p className="text-xs tracking-[0.18em] text-neutral-500">ПОТРЕБУЮТЬ ДАНИХ</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {productsSummary.needsData}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Бракує обовʼязкових полів</p>
          </button>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.18em] text-neutral-500">В ПРОДАЖУ</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {productsSummary.onSale}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Опубліковані в каталозі</p>
          </div>
          <button
            type="button"
            onClick={() => setMetricModal("limitedStock")}
            disabled={productsSummary.limitedStock === 0}
            aria-label="Показати товари з малим залишком"
            className="rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#e2d2bb] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:border-neutral-200 disabled:hover:shadow-sm"
          >
            <p className="text-xs tracking-[0.18em] text-neutral-500">МАЛИЙ ЗАЛИШОК</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {productsSummary.limitedStock}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Позначені як обмежений склад</p>
          </button>
          <button
            type="button"
            onClick={() => setMetricModal("outOfStock")}
            disabled={productsSummary.outOfStock === 0}
            aria-label="Показати товари, яких немає на складі"
            className="rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#e2d2bb] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:border-neutral-200 disabled:hover:shadow-sm"
          >
            <p className="text-xs tracking-[0.18em] text-neutral-500">НЕМАЄ НА СКЛАДІ</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {productsSummary.outOfStock}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Зараз недоступні для продажу</p>
          </button>
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

        <form onSubmit={handleSearchSubmit} className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto]">
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
            {visibleProductStatusFilterOptions.map((status) => (
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

          <select
            value={readinessFilter}
            onChange={(event) =>
              setReadinessFilter(event.target.value as ProductReadinessFilter)
            }
            className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm outline-none transition focus:border-neutral-900"
          >
            <option value="all">Уся готовність</option>
            <option value="needs-data">Потребують даних</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="h-11 rounded-xl bg-neutral-950 px-5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-md active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            >
              Пошук
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-11 rounded-xl border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d8c6aa] hover:bg-[#fffaf2] hover:shadow-md active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
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
              onClick={() =>
                router.push(
                  buildProductsUrl(pagination.page - 1, {
                    q: urlFilters.q,
                    status: urlFilters.status,
                    stockStatus: urlFilters.stockStatus,
                    readiness: urlFilters.readiness,
                    includeArchived: urlFilters.includeArchived,
                  })
                )
              }
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
              onClick={() =>
                router.push(
                  buildProductsUrl(pagination.page + 1, {
                    q: urlFilters.q,
                    status: urlFilters.status,
                    stockStatus: urlFilters.stockStatus,
                    readiness: urlFilters.readiness,
                    includeArchived: urlFilters.includeArchived,
                  })
                )
              }
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

        <div className="grid gap-4 bg-[#f7f1e8] p-4">
          {focusProductId && !loading && !focusedProduct ? (
            <div className="rounded-[24px] border border-[#eadfce] bg-white p-5 text-sm text-neutral-600 shadow-sm">
              Обраний товар не знайдено.
            </div>
          ) : null}

          {visibleProducts.length === 0 && !loading ? (
            <div className="rounded-[24px] border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500 shadow-sm">
              Немає товарів за поточними умовами.
            </div>
          ) : null}

          {visibleProducts.map((product) => {
            const draft = drafts[product.id] ?? createDraft(product)
            const isSaving = savingId === product.id
            const readiness = getProductReadiness(product)
            const popularProduct = getPopularProductForAdminProduct(product)
            const isStandaloneFocusedProduct =
              focusedProduct?.id === product.id && !isFocusedProductOnPage
            const isHighlightedProduct = highlightedProductId === product.id

            return (
              <div key={product.id} className="grid gap-2">
                {isStandaloneFocusedProduct ? (
                  <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9a6a20]">
                    <span className="h-px flex-1 bg-[#eadfce]" />
                    Обраний товар
                    <span className="h-px flex-1 bg-[#eadfce]" />
                  </div>
                ) : null}

                <article
                  id={`product-${product.id}`}
                  ref={(element) => {
                    productCardRefs.current[product.id] = element
                  }}
                  className={`relative rounded-[24px] border bg-white p-5 transition-[transform,box-shadow,border-color] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-10 hover:-translate-y-0.5 hover:scale-[1.015] hover:border-[#e2d2bb] hover:shadow-[0_24px_64px_rgba(58,42,22,0.14)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 ${
                    isHighlightedProduct
                      ? "border-[#c9973f] shadow-[0_0_0_3px_rgba(201,151,63,0.18),0_24px_64px_rgba(201,151,63,0.16)]"
                      : "border-neutral-200 shadow-sm"
                  }`}
                >
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
                        {popularProduct ? (
                          <span className="rounded-full bg-[#fff7e4] px-2.5 py-1 text-xs text-[#8a5d18] ring-1 ring-[#ead3a6]">
                            {product.tag === "人気商品"
                              ? "Вже марковано 人気商品"
                              : "Рекомендація: 人気商品"}
                            <span className="ml-1 text-[#a07122]">
                              {popularProduct.quantityTotal} шт. ·{" "}
                              {popularProduct.orderCount} зам.
                            </span>
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-neutral-950">
                        {product.name}
                      </h3>

                      <div className="mt-2 grid gap-1 text-sm text-neutral-500 md:grid-cols-2">
                        <p>
                          <span className="text-neutral-400">№ товару:</span>{" "}
                          <span className="font-mono text-xs">
                            {product.legacyId || "не задано"}
                          </span>
                        </p>
                        <p>
                          <span className="text-neutral-400">slug:</span>{" "}
                          <span className="font-mono text-xs">{product.slug}</span>
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
                          {draft.status === "out-of-stock" ? (
                            <option value="out-of-stock" disabled>
                              Немає на складі — застарілий статус
                            </option>
                          ) : null}
                          {editableProductStatusOptions.map((status) => (
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
              </div>
            )
          })}
        </div>
      </section>

      {metricModal && metricModalConfig ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/35 px-4 py-6"
          onClick={closeMetricModal}
        >
          <div
            className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-[32px] border border-[#eadfce] bg-[#fffdf8] shadow-[0_28px_80px_rgba(24,24,27,0.24)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#eadfce] px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a58d68]">
                  Товари
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-neutral-950">
                  {metricModalConfig.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  {metricModalConfig.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={closeMetricModal}
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#d8c6aa] bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-[#fffaf2]"
              >
                Закрити
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto px-6 py-5">
              {metricModalItems.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-[#e1d4c0] bg-white/62 p-8 text-sm leading-6 text-neutral-500">
                  {metricModalConfig.empty}
                </div>
              ) : (
                <div className="grid gap-3">
                  {metricModalItems.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => openPreviewProduct(product.id)}
                      className="grid gap-4 rounded-[24px] border border-[#eadfce] bg-white/78 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_42px_rgba(58,42,22,0.075)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 md:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <div className="flex min-w-0 gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#eadfce] bg-[#fffaf2]">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-medium uppercase tracking-[0.12em] text-[#b9a98f]">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-neutral-950">
                            {product.name}
                          </p>
                          <p className="mt-2 text-xs text-neutral-500">
                            № товару:{" "}
                            <span className="font-mono">
                              {product.legacyId || "не задано"}
                            </span>
                          </p>
                          <p className="mt-2 text-xs leading-5 text-neutral-600">
                            {renderPreviewReason(metricModal, product)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[#eadfce] px-6 py-4">
              <button
                type="button"
                onClick={() => openMetricList(metricModal)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#d8c6aa] bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:bg-[#fffaf2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
              >
                {metricModalConfig.button}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="rounded-[28px] border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          Завантаження товарів...
        </main>
      }
    >
      <AdminProductsContent />
    </Suspense>
  )
}
