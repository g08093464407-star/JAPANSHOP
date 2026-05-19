import { NextRequest, NextResponse } from "next/server"
import { asc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  adminAuditLogs,
  catalogProducts,
  productFaqItems,
  productImages,
  productShippingProfiles,
} from "@/lib/db/schema"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
  weightGrams?: unknown
  packageType?: unknown
  temperatureType?: unknown
}

type ProductUpdateBody = {
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

function normalizeSlug(value: unknown) {
  return normalizeText(value, 160)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value
  return fallback
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

function serializeFaqItem(row: typeof productFaqItems.$inferSelect) {
  return {
    id: row.id,
    productId: row.productId,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
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

function normalizeImages(value: unknown) {
  if (!Array.isArray(value)) return null

  return value
    .map((item, index) => {
      const image = item as ProductImageInput
      const url = normalizeText(image.url, 1000)

      if (!url) return null

      return {
        url,
        alt: normalizeOptionalText(image.alt, 300),
        role: isImageRole(image.role) ? image.role : "gallery",
        sortOrder: normalizeInteger(image.sortOrder) ?? index,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

function normalizeFaqItems(value: unknown) {
  if (!Array.isArray(value)) return null

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

function normalizeShippingProfile(value: unknown) {
  if (!value || typeof value !== "object") return null

  const profile = value as ProductShippingInput
  const sizeClass = normalizeInteger(profile.sizeClass)
  const volumeUnits = normalizeInteger(profile.volumeUnits)
  const weightGrams = normalizeInteger(profile.weightGrams)

  if (sizeClass !== null && !isShippingSize(sizeClass)) {
    return { error: "shippingProfile.sizeClass is invalid." } as const
  }

  if (volumeUnits !== null && (volumeUnits < 1 || volumeUnits > 24)) {
    return {
      error: "shippingProfile.volumeUnits must be between 1 and 24.",
    } as const
  }

  if (weightGrams !== null && (weightGrams < 0 || weightGrams > 30_000)) {
    return {
      error: "shippingProfile.weightGrams is outside the allowed range.",
    } as const
  }

  return {
    shippingProfile: {
      shippingOriginPrefecture:
        normalizeOptionalText(profile.shippingOriginPrefecture, 80) ?? "愛知県",
      sizeClass: sizeClass ?? 60,
      volumeUnits: volumeUnits ?? 1,
      weightGrams,
      packageType: normalizeOptionalText(profile.packageType, 80) ?? "standard",
      temperatureType:
        normalizeOptionalText(profile.temperatureType, 80) ?? "ambient",
      updatedAt: new Date(),
    },
  } as const
}

function buildProductUpdate(body: ProductUpdateBody) {
  const updateData: Partial<typeof catalogProducts.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (Object.prototype.hasOwnProperty.call(body, "legacyId")) {
    const legacyId = normalizeText(body.legacyId, 80)
    if (!legacyId) return { error: "legacyId cannot be empty." } as const
    updateData.legacyId = legacyId
  }

  if (Object.prototype.hasOwnProperty.call(body, "slug")) {
    const slug = normalizeSlug(body.slug)
    if (!slug) return { error: "slug cannot be empty." } as const
    updateData.slug = slug
  }

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    const name = normalizeText(body.name, 240)
    if (!name) return { error: "name cannot be empty." } as const
    updateData.name = name
  }

  if (Object.prototype.hasOwnProperty.call(body, "price")) {
    const price = normalizeInteger(body.price)
    if (price === null || price < 0 || price > 10_000_000) {
      return { error: "price must be a valid positive integer." } as const
    }
    updateData.price = price
  }

  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    const description = normalizeText(body.description, 6000)
    if (!description) {
      return { error: "description cannot be empty." } as const
    }
    updateData.description = description
  }

  if (Object.prototype.hasOwnProperty.call(body, "shortDescription")) {
    updateData.shortDescription = normalizeOptionalText(body.shortDescription, 500)
  }

  if (Object.prototype.hasOwnProperty.call(body, "origin")) {
    updateData.origin = normalizeOptionalText(body.origin, 500)
  }

  if (Object.prototype.hasOwnProperty.call(body, "ingredients")) {
    updateData.ingredients = normalizeOptionalText(body.ingredients, 1000)
  }

  if (Object.prototype.hasOwnProperty.call(body, "allergens")) {
    updateData.allergens = normalizeOptionalText(body.allergens, 1000)
  }

  if (Object.prototype.hasOwnProperty.call(body, "shelfLife")) {
    updateData.shelfLife = normalizeOptionalText(body.shelfLife, 500)
  }

  if (Object.prototype.hasOwnProperty.call(body, "storage")) {
    updateData.storage = normalizeOptionalText(body.storage, 1000)
  }

  if (Object.prototype.hasOwnProperty.call(body, "category")) {
    updateData.category = normalizeOptionalText(body.category, 120)
  }

  if (Object.prototype.hasOwnProperty.call(body, "tag")) {
    updateData.tag = normalizeOptionalText(body.tag, 120)
  }

  if (Object.prototype.hasOwnProperty.call(body, "stockStatus")) {
    if (!isStockStatus(body.stockStatus)) {
      return { error: "stockStatus is invalid." } as const
    }
    updateData.stockStatus = body.stockStatus
  }

  if (Object.prototype.hasOwnProperty.call(body, "stockQuantity")) {
    const stockQuantity = normalizeInteger(body.stockQuantity)

    if (
      stockQuantity !== null &&
      (stockQuantity < 0 || stockQuantity > 999_999)
    ) {
      return { error: "stockQuantity is outside the allowed range." } as const
    }

    updateData.stockQuantity = stockQuantity
  }

  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    if (!isProductStatus(body.status)) {
      return { error: "status is invalid." } as const
    }

    updateData.status = body.status
    updateData.isActive = body.status === "active"
    updateData.isArchived = body.status === "archived"
  }

  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    updateData.isActive = normalizeBoolean(body.isActive, false)
  }

  if (Object.prototype.hasOwnProperty.call(body, "isArchived")) {
    updateData.isArchived = normalizeBoolean(body.isArchived, false)
  }

  if (Object.prototype.hasOwnProperty.call(body, "seoTitle")) {
    updateData.seoTitle = normalizeOptionalText(body.seoTitle, 240)
  }

  if (Object.prototype.hasOwnProperty.call(body, "seoDescription")) {
    updateData.seoDescription = normalizeOptionalText(body.seoDescription, 500)
  }

  if (Object.prototype.hasOwnProperty.call(body, "canonicalSlug")) {
    updateData.canonicalSlug = normalizeOptionalText(body.canonicalSlug, 160)
  }

  return { updateData } as const
}

async function getProductDetail(id: string) {
  const rows = await db
    .select()
    .from(catalogProducts)
    .where(eq(catalogProducts.id, id))
    .limit(1)

  const product = rows[0]

  if (!product) return null

  const [images, shippingProfiles, faqItems] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.sortOrder), asc(productImages.createdAt)),
    db
      .select()
      .from(productShippingProfiles)
      .where(eq(productShippingProfiles.productId, id))
      .limit(1),
    db
      .select()
      .from(productFaqItems)
      .where(eq(productFaqItems.productId, id))
      .orderBy(asc(productFaqItems.sortOrder), asc(productFaqItems.createdAt)),
  ])

  return {
    ...serializeProduct(product),
    images: images.map(serializeImage),
    mainImage:
      images.map(serializeImage).find((image) => image.role === "main") ??
      images.map(serializeImage)[0] ??
      null,
    shippingProfile: shippingProfiles[0]
      ? serializeShippingProfile(shippingProfiles[0])
      : null,
    faqItems: faqItems.map(serializeFaqItem),
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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: "Missing product id." }, { status: 400 })
    }

    const product = await getProductDetail(id)

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    logger.error("Failed to get admin product", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to get product." },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as ProductUpdateBody

    if (!id) {
      return NextResponse.json({ error: "Missing product id." }, { status: 400 })
    }

    const before = await getProductDetail(id)

    if (!before) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 })
    }

    const builtUpdate = buildProductUpdate(body)

    if ("error" in builtUpdate) {
      return NextResponse.json({ error: builtUpdate.error }, { status: 400 })
    }

    const normalizedImages = Object.prototype.hasOwnProperty.call(body, "images")
      ? normalizeImages(body.images)
      : null

    const normalizedFaqItems = Object.prototype.hasOwnProperty.call(body, "faqItems")
      ? normalizeFaqItems(body.faqItems)
      : null

    const normalizedShipping = Object.prototype.hasOwnProperty.call(
      body,
      "shippingProfile"
    )
      ? normalizeShippingProfile(body.shippingProfile)
      : null

    if (normalizedShipping && "error" in normalizedShipping) {
      return NextResponse.json({ error: normalizedShipping.error }, { status: 400 })
    }

    const updatedRows = await db
      .update(catalogProducts)
      .set(builtUpdate.updateData)
      .where(eq(catalogProducts.id, id))
      .returning()

    const updatedProduct = updatedRows[0]

    if (!updatedProduct) {
      throw new Error("Failed to update product.")
    }

    if (normalizedImages) {
      await db.delete(productImages).where(eq(productImages.productId, id))

      if (normalizedImages.length > 0) {
        await db.insert(productImages).values(
          normalizedImages.map((image) => ({
            productId: id,
            ...image,
          }))
        )
      }
    }

    if (normalizedShipping && "shippingProfile" in normalizedShipping) {
      const existingShipping = await db
        .select()
        .from(productShippingProfiles)
        .where(eq(productShippingProfiles.productId, id))
        .limit(1)

      if (existingShipping[0]) {
        await db
          .update(productShippingProfiles)
          .set(normalizedShipping.shippingProfile)
          .where(eq(productShippingProfiles.productId, id))
      } else {
        await db.insert(productShippingProfiles).values({
          productId: id,
          ...normalizedShipping.shippingProfile,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }

    if (normalizedFaqItems) {
      await db.delete(productFaqItems).where(eq(productFaqItems.productId, id))

      if (normalizedFaqItems.length > 0) {
        await db.insert(productFaqItems).values(
          normalizedFaqItems.map((item) => ({
            productId: id,
            ...item,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        )
      }
    }

    const after = await getProductDetail(id)

    await writeAuditLog({
      entityId: id,
      action: "update",
      beforeJson: before,
      afterJson: after,
    })

    logger.info("Admin product updated", {
      productId: id,
      slug: updatedProduct.slug,
    })

    return NextResponse.json({ product: after })
  } catch (error) {
    logger.error("Failed to update admin product", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: "Missing product id." }, { status: 400 })
    }

    const before = await getProductDetail(id)

    if (!before) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 })
    }

    const updatedRows = await db
      .update(catalogProducts)
      .set({
        status: "archived",
        isActive: false,
        isArchived: true,
        updatedAt: new Date(),
      })
      .where(eq(catalogProducts.id, id))
      .returning()

    const updatedProduct = updatedRows[0]

    if (!updatedProduct) {
      throw new Error("Failed to archive product.")
    }

    const after = await getProductDetail(id)

    await writeAuditLog({
      entityId: id,
      action: "archive",
      beforeJson: before,
      afterJson: after,
    })

    logger.info("Admin product archived", {
      productId: id,
      slug: updatedProduct.slug,
    })

    return NextResponse.json({ product: after })
  } catch (error) {
    logger.error("Failed to archive admin product", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to archive product." },
      { status: 500 }
    )
  }
}
