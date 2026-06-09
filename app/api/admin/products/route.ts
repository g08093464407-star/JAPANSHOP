import { NextRequest, NextResponse } from "next/server"
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  adminAuditLogs,
  catalogProducts,
  productFaqItems,
  productImages,
  productShippingProfiles,
} from "@/lib/db/schema"
import { logger } from "@/lib/logger"
import { getProductReadiness } from "@/lib/product/readiness"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

const allowedProductStatuses = [
  "draft",
  "active",
  "hidden",
  "out-of-stock",
  "archived",
] as const

const allowedStockStatuses = ["in-stock", "limited", "out-of-stock"] as const
const allowedImageRoles = ["main", "gallery", "og", "story", "thumbnail"] as const
const allowedShippingSizes = [60, 80, 100, 120, 140, 160, 170] as const

type ProductStatus = (typeof allowedProductStatuses)[number]
type StockStatus = (typeof allowedStockStatuses)[number]
type ImageRole = (typeof allowedImageRoles)[number]
type ShippingSize = (typeof allowedShippingSizes)[number]

type ProductImageInput = {
  url?: unknown
  alt?: unknown
  role?: unknown
  sortOrder?: unknown
}

type ProductFaqInput = {
  question?: unknown
  answer?: unknown
  sortOrder?: unknown
  isActive?: unknown
}

type ProductShippingInput = {
  shippingOriginPrefecture?: unknown
  sizeClass?: unknown
  volumeUnits?: unknown
  lengthCm?: unknown
  widthCm?: unknown
  heightCm?: unknown
  volumeCm3?: unknown
  weightGrams?: unknown
  packageType?: unknown
  temperatureType?: unknown
}

type ProductCreateBody = {
  legacyId?: unknown
  slug?: unknown
  name?: unknown
  price?: unknown
  shortDescription?: unknown
  description?: unknown
  origin?: unknown
  ingredients?: unknown
  allergens?: unknown
  shelfLife?: unknown
  storage?: unknown
  category?: unknown
  tag?: unknown
  stockStatus?: unknown
  stockQuantity?: unknown
  status?: unknown
  isActive?: unknown
  isArchived?: unknown
  seoTitle?: unknown
  seoDescription?: unknown
  canonicalSlug?: unknown
  images?: unknown
  shippingProfile?: unknown
  faqItems?: unknown
}

type ProductsSummary = {
  total: number
  readyForPublish: number
  needsData: number
  availableForSale: number
  limitedStock: number
  outOfStock: number
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

function normalizeText(value: unknown, maxLength = 2000) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, maxLength)
}

function normalizeOptionalText(value: unknown, maxLength = 2000) {
  const normalized = normalizeText(value, maxLength)
  return normalized.length > 0 ? normalized : null
}

function normalizeInteger(value: unknown) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed)) {
    return null
  }

  return parsed
}

function isProductStatus(value: unknown): value is ProductStatus {
  return (
    typeof value === "string" &&
    allowedProductStatuses.includes(value as ProductStatus)
  )
}

function isStockStatus(value: unknown): value is StockStatus {
  return (
    typeof value === "string" &&
    allowedStockStatuses.includes(value as StockStatus)
  )
}

function isImageRole(value: unknown): value is ImageRole {
  return (
    typeof value === "string" &&
    allowedImageRoles.includes(value as ImageRole)
  )
}

function isShippingSize(value: unknown): value is ShippingSize {
  return (
    typeof value === "number" &&
    allowedShippingSizes.includes(value as ShippingSize)
  )
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value
  return fallback
}

function normalizeSlug(value: unknown) {
  return normalizeText(value, 160)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function validateProductBody(body: ProductCreateBody) {
  const legacyId = normalizeText(body.legacyId, 80)
  const slug = normalizeSlug(body.slug)
  const name = normalizeText(body.name, 240)
  const description = normalizeText(body.description, 6000)
  const price = normalizeInteger(body.price)

  if (!legacyId) {
    return { error: "legacyId is required." } as const
  }

  if (!slug) {
    return { error: "slug is required." } as const
  }

  if (!name) {
    return { error: "name is required." } as const
  }

  if (!description) {
    return { error: "description is required." } as const
  }

  if (price === null || price < 0 || price > 10_000_000) {
    return { error: "price must be a valid positive integer." } as const
  }

  const stockStatus = isStockStatus(body.stockStatus)
    ? body.stockStatus
    : "in-stock"

  const status = isProductStatus(body.status) ? body.status : "draft"
  const stockQuantity = normalizeInteger(body.stockQuantity)

  if (stockQuantity !== null && (stockQuantity < 0 || stockQuantity > 999_999)) {
    return { error: "stockQuantity is outside the allowed range." } as const
  }

  return {
    product: {
      legacyId,
      slug,
      name,
      price,
      shortDescription: normalizeOptionalText(body.shortDescription, 500),
      description,
      origin: normalizeOptionalText(body.origin, 500),
      ingredients: normalizeOptionalText(body.ingredients, 1000),
      allergens: normalizeOptionalText(body.allergens, 1000),
      shelfLife: normalizeOptionalText(body.shelfLife, 500),
      storage: normalizeOptionalText(body.storage, 1000),
      category: normalizeOptionalText(body.category, 120),
      tag: normalizeOptionalText(body.tag, 120),
      stockStatus,
      stockQuantity,
      status,
      isActive:
        typeof body.isActive === "boolean"
          ? body.isActive
          : status === "active",
      isArchived:
        typeof body.isArchived === "boolean"
          ? body.isArchived
          : status === "archived",
      seoTitle: normalizeOptionalText(body.seoTitle, 240),
      seoDescription: normalizeOptionalText(body.seoDescription, 500),
      canonicalSlug: normalizeOptionalText(body.canonicalSlug, 160),
      updatedAt: new Date(),
    },
  } as const
}

function normalizeImages(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((item, index) => {
      const image = item as ProductImageInput
      const url = normalizeText(image.url, 1000)

      if (!url) return null

      const role = isImageRole(image.role) ? image.role : "gallery"
      const sortOrder = normalizeInteger(image.sortOrder) ?? index

      return {
        url,
        alt: normalizeOptionalText(image.alt, 300),
        role,
        sortOrder,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

function normalizeFaqItems(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((item, index) => {
      const faq = item as ProductFaqInput
      const question = normalizeText(faq.question, 500)
      const answer = normalizeText(faq.answer, 2000)

      if (!question || !answer) return null

      return {
        question,
        answer,
        sortOrder: normalizeInteger(faq.sortOrder) ?? index,
        isActive: normalizeBoolean(faq.isActive, true),
        updatedAt: new Date(),
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

function validateShippingProfile(value: unknown) {
  const profile = (value ?? {}) as ProductShippingInput
  const sizeClass = normalizeInteger(profile.sizeClass) ?? 60
  const volumeUnits = normalizeInteger(profile.volumeUnits) ?? 1
  const lengthCm = normalizeInteger(profile.lengthCm)
  const widthCm = normalizeInteger(profile.widthCm)
  const heightCm = normalizeInteger(profile.heightCm)
  const weightGrams = normalizeInteger(profile.weightGrams)

  if (!isShippingSize(sizeClass)) {
    return { error: "shippingProfile.sizeClass is invalid." } as const
  }

  if (volumeUnits < 1 || volumeUnits > 24) {
    return {
      error: "shippingProfile.volumeUnits must be between 1 and 24.",
    } as const
  }

  for (const [key, value] of [
    ["lengthCm", lengthCm],
    ["widthCm", widthCm],
    ["heightCm", heightCm],
  ] as const) {
    if (value !== null && (value < 0 || value > 300)) {
      return { error: `shippingProfile.${key} is outside the allowed range.` } as const
    }
  }

  if (weightGrams !== null && (weightGrams < 0 || weightGrams > 30_000)) {
    return {
      error: "shippingProfile.weightGrams is outside the allowed range.",
    } as const
  }

  const volumeCm3 =
    lengthCm !== null && widthCm !== null && heightCm !== null
      ? lengthCm * widthCm * heightCm
      : normalizeInteger(profile.volumeCm3)

  const shippingOriginPrefecture =
    normalizeOptionalText(profile.shippingOriginPrefecture, 80) ?? "愛知県"

  return {
    shippingProfile: {
      shippingOriginPrefecture,
      sizeClass,
      volumeUnits,
      lengthCm,
      widthCm,
      heightCm,
      volumeCm3,
      weightGrams,
      packageType: normalizeOptionalText(profile.packageType, 80) ?? "standard",
      temperatureType:
        normalizeOptionalText(profile.temperatureType, 80) ?? "ambient",
      updatedAt: new Date(),
    },
  } as const
}

function buildFilters({
  searchQuery,
  status,
  stockStatus,
  category,
  includeArchived,
}: {
  searchQuery: string
  status: string | null
  stockStatus: string | null
  category: string
  includeArchived: boolean
}) {
  const conditions = []

  if (!includeArchived) {
    conditions.push(eq(catalogProducts.isArchived, false))
  }

  if (searchQuery) {
    const pattern = `%${searchQuery}%`

    conditions.push(
      or(
        ilike(catalogProducts.name, pattern),
        ilike(catalogProducts.slug, pattern),
        ilike(catalogProducts.legacyId, pattern),
        ilike(catalogProducts.category, pattern)
      )
    )
  }

  if (isProductStatus(status)) {
    conditions.push(eq(catalogProducts.status, status))
  }

  if (isStockStatus(stockStatus)) {
    conditions.push(eq(catalogProducts.stockStatus, stockStatus))
  }

  if (category) {
    conditions.push(eq(catalogProducts.category, category))
  }

  if (conditions.length === 0) return undefined
  if (conditions.length === 1) return conditions[0]
  return and(...conditions)
}

function serializeProduct(row: typeof catalogProducts.$inferSelect) {
  return {
    id: row.id,
    legacyId: row.legacyId,
    slug: row.slug,
    name: row.name,
    price: row.price,
    shortDescription: row.shortDescription,
    description: row.description,
    origin: row.origin,
    ingredients: row.ingredients,
    allergens: row.allergens,
    shelfLife: row.shelfLife,
    storage: row.storage,
    category: row.category,
    tag: row.tag,
    stockStatus: row.stockStatus,
    stockQuantity: row.stockQuantity,
    status: row.status,
    isActive: row.isActive,
    isArchived: row.isArchived,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    canonicalSlug: row.canonicalSlug,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString(),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : new Date(row.updatedAt).toISOString(),
  }
}

function serializeImage(row: typeof productImages.$inferSelect) {
  return {
    id: row.id,
    productId: row.productId,
    url: row.url,
    alt: row.alt,
    role: row.role,
    sortOrder: row.sortOrder,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString(),
  }
}

function serializeShippingProfile(
  row: typeof productShippingProfiles.$inferSelect
) {
  return {
    id: row.id,
    productId: row.productId,
    shippingOriginPrefecture: row.shippingOriginPrefecture,
    sizeClass: row.sizeClass,
    volumeUnits: row.volumeUnits,
    lengthCm: row.lengthCm,
    widthCm: row.widthCm,
    heightCm: row.heightCm,
    volumeCm3: row.volumeCm3,
    weightGrams: row.weightGrams,
    packageType: row.packageType,
    temperatureType: row.temperatureType,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString(),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : new Date(row.updatedAt).toISOString(),
  }
}

function groupByProductId<T extends { productId: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    acc[item.productId] = acc[item.productId] ?? []
    acc[item.productId].push(item)
    return acc
  }, {})
}

function createEmptyProductsSummary(): ProductsSummary {
  return {
    total: 0,
    readyForPublish: 0,
    needsData: 0,
    availableForSale: 0,
    limitedStock: 0,
    outOfStock: 0,
  }
}

async function writeAuditLog({
  entityId,
  action,
  beforeJson,
  afterJson,
}: {
  entityId: string
  action: string
  beforeJson?: unknown
  afterJson?: unknown
}) {
  await db.insert(adminAuditLogs).values({
    entityType: "product",
    entityId,
    action,
    beforeJson: beforeJson ?? null,
    afterJson: afterJson ?? null,
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE)
    const requestedPageSize = parsePositiveInt(
      searchParams.get("pageSize"),
      DEFAULT_PAGE_SIZE
    )
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
    const offset = (page - 1) * pageSize

    const searchQuery = (searchParams.get("q") ?? "").trim()
    const status = searchParams.get("status")
    const stockStatus = searchParams.get("stockStatus")
    const category = (searchParams.get("category") ?? "").trim()
    const includeArchived = searchParams.get("includeArchived") === "true"

    const filters = buildFilters({
      searchQuery,
      status,
      stockStatus,
      category,
      includeArchived,
    })

    const dataQuery = db
      .select()
      .from(catalogProducts)
      .orderBy(desc(catalogProducts.updatedAt), desc(catalogProducts.createdAt))
      .limit(pageSize)
      .offset(offset)

    const countQuery = db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(catalogProducts)

    const rows = filters ? await dataQuery.where(filters) : await dataQuery
    const totalCountResult = filters
      ? await countQuery.where(filters)
      : await countQuery

    const summaryProductQuery = db
      .select({
        id: catalogProducts.id,
        slug: catalogProducts.slug,
        name: catalogProducts.name,
        price: catalogProducts.price,
        description: catalogProducts.description,
        category: catalogProducts.category,
        stockStatus: catalogProducts.stockStatus,
        stockQuantity: catalogProducts.stockQuantity,
        status: catalogProducts.status,
        isActive: catalogProducts.isActive,
        isArchived: catalogProducts.isArchived,
        seoDescription: catalogProducts.seoDescription,
      })
      .from(catalogProducts)

    const summaryRows = filters
      ? await summaryProductQuery.where(filters)
      : await summaryProductQuery

    const summaryProductIds = summaryRows.map((row) => row.id)

    const [summaryImageRows, summaryShippingRows] =
      summaryProductIds.length > 0
        ? await Promise.all([
            db
              .select({
                productId: productImages.productId,
                url: productImages.url,
                role: productImages.role,
              })
              .from(productImages)
              .where(inArray(productImages.productId, summaryProductIds))
              .orderBy(asc(productImages.sortOrder), asc(productImages.createdAt)),
            db
              .select({
                productId: productShippingProfiles.productId,
                shippingOriginPrefecture:
                  productShippingProfiles.shippingOriginPrefecture,
                lengthCm: productShippingProfiles.lengthCm,
                widthCm: productShippingProfiles.widthCm,
                heightCm: productShippingProfiles.heightCm,
                volumeCm3: productShippingProfiles.volumeCm3,
              })
              .from(productShippingProfiles)
              .where(
                inArray(productShippingProfiles.productId, summaryProductIds)
              ),
          ])
        : [[], []]

    const summaryImagesByProductId = groupByProductId(summaryImageRows)
    const summaryShippingByProductId = summaryShippingRows.reduce<
      Record<string, (typeof summaryShippingRows)[number]>
    >((acc, row) => {
      acc[row.productId] = row
      return acc
    }, {})

    const summary = summaryRows.reduce<ProductsSummary>((acc, row) => {
      const images = summaryImagesByProductId[row.id] ?? []
      const readiness = getProductReadiness({
        ...row,
        images,
        mainImage:
          images.find((image) => image.role === "main") ?? images[0] ?? null,
        shippingProfile: summaryShippingByProductId[row.id] ?? null,
      })

      acc.total += 1

      if (readiness.isReadyForPublish) {
        acc.readyForPublish += 1
      } else {
        acc.needsData += 1
      }

      if (readiness.isAvailableForSale) {
        acc.availableForSale += 1
      }

      if (row.stockStatus === "limited") {
        acc.limitedStock += 1
      }

      if (row.stockStatus === "out-of-stock") {
        acc.outOfStock += 1
      }

      return acc
    }, createEmptyProductsSummary())

    const productIds = rows.map((row) => row.id)

    const imageRows =
      productIds.length > 0
        ? await db
            .select()
            .from(productImages)
            .where(inArray(productImages.productId, productIds))
            .orderBy(asc(productImages.sortOrder), asc(productImages.createdAt))
        : []

    const shippingRows =
      productIds.length > 0
        ? await db
            .select()
            .from(productShippingProfiles)
            .where(inArray(productShippingProfiles.productId, productIds))
        : []

    const imagesByProductId = groupByProductId(imageRows.map(serializeImage))
    const shippingByProductId = shippingRows.reduce<
      Record<string, ReturnType<typeof serializeShippingProfile>>
    >((acc, row) => {
      acc[row.productId] = serializeShippingProfile(row)
      return acc
    }, {})

    const products = rows.map((row) => ({
      ...serializeProduct(row),
      images: imagesByProductId[row.id] ?? [],
      mainImage:
        imagesByProductId[row.id]?.find((image) => image.role === "main") ??
        imagesByProductId[row.id]?.[0] ??
        null,
      shippingProfile: shippingByProductId[row.id] ?? null,
    }))

    const totalItems = totalCountResult[0]?.count ?? 0
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1

    return NextResponse.json({
      products,
      summary,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    })
  } catch (error) {
    logger.error("Failed to list admin products", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to list products." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProductCreateBody

    const validatedProduct = validateProductBody(body)

    if ("error" in validatedProduct) {
      return NextResponse.json(
        { error: validatedProduct.error },
        { status: 400 }
      )
    }

    const validatedShipping = validateShippingProfile(body.shippingProfile)

    if ("error" in validatedShipping) {
      return NextResponse.json(
        { error: validatedShipping.error },
        { status: 400 }
      )
    }

    const images = normalizeImages(body.images)
    const faqItems = normalizeFaqItems(body.faqItems)
    const now = new Date()

    const insertedProducts = await db
      .insert(catalogProducts)
      .values({
        ...validatedProduct.product,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    const product = insertedProducts[0]

    if (!product) {
      throw new Error("Failed to create product.")
    }

    if (images.length > 0) {
      await db.insert(productImages).values(
        images.map((image) => ({
          productId: product.id,
          ...image,
          createdAt: now,
        }))
      )
    }

    await db.insert(productShippingProfiles).values({
      productId: product.id,
      ...validatedShipping.shippingProfile,
      createdAt: now,
      updatedAt: now,
    })

    if (faqItems.length > 0) {
      await db.insert(productFaqItems).values(
        faqItems.map((item) => ({
          productId: product.id,
          ...item,
          createdAt: now,
          updatedAt: now,
        }))
      )
    }

    await writeAuditLog({
      entityId: product.id,
      action: "create",
      beforeJson: null,
      afterJson: serializeProduct(product),
    })

    logger.info("Admin product created", {
      productId: product.id,
      legacyId: product.legacyId,
      slug: product.slug,
    })

    return NextResponse.json(
      {
        product: serializeProduct(product),
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error("Failed to create admin product", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to create product." },
      { status: 500 }
    )
  }
}
