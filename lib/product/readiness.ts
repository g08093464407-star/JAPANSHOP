export type ProductReadinessCheck = {
  key: string
  label: string
  ok: boolean
  severity: "required" | "recommended"
  detail?: string
}

export type ProductReadinessInput = {
  slug: string | null
  name: string | null
  price: number | null
  description: string | null
  category?: string | null
  seoDescription?: string | null
  status?: string | null
  isActive?: boolean | null
  isArchived?: boolean | null
  stockStatus?: string | null
  stockQuantity?: number | null
  images?: { url?: string | null }[]
  mainImage?: { url?: string | null } | null
  shippingProfile?: {
    shippingOriginPrefecture?: string | null
    lengthCm?: number | null
    widthCm?: number | null
    heightCm?: number | null
    volumeCm3?: number | null
  } | null
}

export type ProductReadinessResult = {
  checks: ProductReadinessCheck[]
  requiredMissing: ProductReadinessCheck[]
  recommendedMissing: ProductReadinessCheck[]
  isReadyForPublish: boolean
  isAvailableForSale: boolean
  score: number
  total: number
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function isPositiveNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
}

export function getProductReadiness(
  product: ProductReadinessInput
): ProductReadinessResult {
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
      ok: isPositiveNumber(product.price),
      severity: "required",
      detail: "Ціна 0 ¥ може зберігатися в чернетці, але не готова до публікації.",
    },
    {
      key: "mainImage",
      label: "Головне зображення",
      ok:
        hasText(mainImageUrl) ||
        Boolean(product.images?.some((image) => hasText(image.url))),
      severity: "required",
      detail: "Використовується в картці товару, на сторінці товару й у checkout.",
    },
    {
      key: "description",
      label: "Опис товару",
      ok: hasText(product.description),
      severity: "required",
      detail: "Потрібно для публічної сторінки товару.",
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
      key: "productDimensions",
      label: "Габарити й обʼєм товару",
      ok:
        isPositiveNumber(shippingProfile?.lengthCm) &&
        isPositiveNumber(shippingProfile?.widthCm) &&
        isPositiveNumber(shippingProfile?.heightCm) &&
        isPositiveNumber(shippingProfile?.volumeCm3),
      severity: "required",
      detail: "Використовується Smart Box для вибору коробки.",
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
  const hasPositiveStockQuantity =
    typeof product.stockQuantity !== "number" || product.stockQuantity > 0

  return {
    checks,
    requiredMissing,
    recommendedMissing,
    isReadyForPublish: requiredMissing.length === 0,
    isAvailableForSale:
      product.status === "active" &&
      product.isActive === true &&
      product.isArchived !== true &&
      product.stockStatus !== "out-of-stock" &&
      hasPositiveStockQuantity,
    score: checks.filter((check) => check.ok).length,
    total: checks.length,
  }
}
