import "server-only"

import { and, asc, eq, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  catalogProducts,
  productImages,
  productShippingProfiles,
} from "@/lib/db/schema"
import type { Product } from "@/types/product"

type CatalogProductRow = typeof catalogProducts.$inferSelect
type ProductImageRow = typeof productImages.$inferSelect
type ProductShippingProfileRow = typeof productShippingProfiles.$inferSelect

export type CatalogProduct = Product & {
  legacyId: string
  status: string
  isActive: boolean
  isArchived: boolean
  stockQuantity: number | null
  seoTitle: string | null
  seoDescription: string | null
  canonicalSlug: string | null
  shippingProfile?: ProductShippingProfileRow | null
}

function isPublicCatalogProduct(row: CatalogProductRow) {
  return (
    row.status === "active" &&
    row.isActive === true &&
    row.isArchived === false
  )
}

function publicCatalogProductWhere() {
  return and(
    eq(catalogProducts.status, "active"),
    eq(catalogProducts.isActive, true),
    eq(catalogProducts.isArchived, false)
  )
}

function mapCatalogProduct({
  row,
  images,
  shippingProfile,
}: {
  row: CatalogProductRow
  images: ProductImageRow[]
  shippingProfile?: ProductShippingProfileRow | null
}): CatalogProduct {
  const mainImage =
    images.find((image) => image.role === "main")?.url ?? images[0]?.url ?? ""

  return {
    id: row.legacyId,
    legacyId: row.legacyId,
    slug: row.slug,
    name: row.name,
    price: row.price,
    image: mainImage,
    images: images.map((image) => image.url),
    description: row.description,
    origin: row.origin ?? "",
    ingredients: row.ingredients ?? "",
    allergens: row.allergens ?? "",
    shelfLife: row.shelfLife ?? "",
    storage: row.storage ?? "",
    stockStatus: row.stockStatus as Product["stockStatus"],
    category: row.category ?? undefined,
    tag: row.tag ?? undefined,
    status: row.status,
    isActive: row.isActive,
    isArchived: row.isArchived,
    stockQuantity: row.stockQuantity,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    canonicalSlug: row.canonicalSlug,
    shippingProfile,
  }
}

export async function getCatalogProducts({
  includeInactive = false,
}: {
  includeInactive?: boolean
} = {}) {
  const productRows = includeInactive
    ? await db.select().from(catalogProducts).orderBy(asc(catalogProducts.createdAt))
    : await db
        .select()
        .from(catalogProducts)
        .where(publicCatalogProductWhere())
        .orderBy(asc(catalogProducts.createdAt))

  if (productRows.length === 0) {
    return []
  }

  const productIds = productRows.map((product) => product.id)

  const imageRows = await db
    .select()
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.sortOrder))

  const shippingRows = await db
    .select()
    .from(productShippingProfiles)
    .where(inArray(productShippingProfiles.productId, productIds))

  return productRows.map((row) =>
    mapCatalogProduct({
      row,
      images: imageRows.filter((image) => image.productId === row.id),
      shippingProfile:
        shippingRows.find((profile) => profile.productId === row.id) ?? null,
    })
  )
}

export async function getCatalogProductBySlug(slug: string) {
  const rows = await db
    .select()
    .from(catalogProducts)
    .where(eq(catalogProducts.slug, slug))
    .limit(1)

  const row = rows[0]

  if (!row || !isPublicCatalogProduct(row)) {
    return null
  }

  const [imageRows, shippingRows] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, row.id))
      .orderBy(asc(productImages.sortOrder)),
    db
      .select()
      .from(productShippingProfiles)
      .where(eq(productShippingProfiles.productId, row.id))
      .limit(1),
  ])

  return mapCatalogProduct({
    row,
    images: imageRows,
    shippingProfile: shippingRows[0] ?? null,
  })
}

export async function getCatalogProductByLegacyId(legacyId: string) {
  const rows = await db
    .select()
    .from(catalogProducts)
    .where(eq(catalogProducts.legacyId, legacyId))
    .limit(1)

  const row = rows[0]

  if (!row || row.isArchived) {
    return null
  }

  const [imageRows, shippingRows] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, row.id))
      .orderBy(asc(productImages.sortOrder)),
    db
      .select()
      .from(productShippingProfiles)
      .where(eq(productShippingProfiles.productId, row.id))
      .limit(1),
  ])

  return mapCatalogProduct({
    row,
    images: imageRows,
    shippingProfile: shippingRows[0] ?? null,
  })
}
