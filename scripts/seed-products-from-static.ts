import { eq } from "drizzle-orm"

import { products as staticProducts } from "../data/products"
import { db } from "../lib/db"
import {
  adminAuditLogs,
  catalogProducts,
  productImages,
  productShippingProfiles,
} from "../lib/db/schema"
import { getProductShippingProfile } from "../lib/shipping/japan-post"

function getSeoDescription(description: string) {
  return description.length > 155 ? `${description.slice(0, 152)}...` : description
}

async function seedProducts() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed products.")
  }

  for (const product of staticProducts) {
    const now = new Date()
    const status = product.stockStatus === "out-of-stock" ? "out-of-stock" : "active"
    const shippingProfile = getProductShippingProfile(product.id)

    const upserted = await db
      .insert(catalogProducts)
      .values({
        legacyId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        shortDescription: null,
        description: product.description,
        origin: product.origin,
        ingredients: product.ingredients,
        allergens: product.allergens,
        shelfLife: product.shelfLife,
        storage: product.storage,
        category: product.category ?? null,
        tag: product.tag ?? null,
        stockStatus: product.stockStatus,
        stockQuantity: null,
        status,
        isActive: status === "active",
        isArchived: false,
        seoTitle: product.name,
        seoDescription: getSeoDescription(product.description),
        canonicalSlug: product.slug,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: catalogProducts.legacyId,
        set: {
          slug: product.slug,
          name: product.name,
          price: product.price,
          description: product.description,
          origin: product.origin,
          ingredients: product.ingredients,
          allergens: product.allergens,
          shelfLife: product.shelfLife,
          storage: product.storage,
          category: product.category ?? null,
          tag: product.tag ?? null,
          stockStatus: product.stockStatus,
          status,
          isActive: status === "active",
          isArchived: false,
          seoTitle: product.name,
          seoDescription: getSeoDescription(product.description),
          canonicalSlug: product.slug,
          updatedAt: now,
        },
      })
      .returning()

    const catalogProduct = upserted[0]

    if (!catalogProduct) {
      throw new Error(`Failed to upsert product ${product.id}`)
    }

    await db
      .delete(productImages)
      .where(eq(productImages.productId, catalogProduct.id))

    const imageRows = [
      {
        productId: catalogProduct.id,
        url: product.image,
        alt: product.name,
        role: "main",
        sortOrder: 0,
      },
      ...(product.images ?? [])
        .filter((image) => image && image !== product.image)
        .map((image, index) => ({
          productId: catalogProduct.id,
          url: image,
          alt: product.name,
          role: "gallery",
          sortOrder: index + 1,
        })),
    ]

    if (imageRows.length > 0) {
      await db.insert(productImages).values(imageRows)
    }

    await db
      .insert(productShippingProfiles)
      .values({
        productId: catalogProduct.id,
        shippingOriginPrefecture: "愛知県",
        sizeClass: shippingProfile.sizeClass,
        volumeUnits: shippingProfile.volumeUnits,
        weightGrams: shippingProfile.weightGrams ?? null,
        packageType: "standard",
        temperatureType: "ambient",
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: productShippingProfiles.productId,
        set: {
          shippingOriginPrefecture: "愛知県",
          sizeClass: shippingProfile.sizeClass,
          volumeUnits: shippingProfile.volumeUnits,
          weightGrams: shippingProfile.weightGrams ?? null,
          packageType: "standard",
          temperatureType: "ambient",
          updatedAt: now,
        },
      })

    await db.insert(adminAuditLogs).values({
      entityType: "product",
      entityId: catalogProduct.id,
      action: "seed_from_static_catalog",
      beforeJson: null,
      afterJson: {
        legacyId: product.id,
        slug: product.slug,
        shippingProfile,
      },
      createdAt: now,
    })

    console.log(`Seeded product: ${product.id} / ${product.slug}`)
  }
}

seedProducts()
  .then(() => {
    console.log("Product seed completed.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Product seed failed:", error)
    process.exit(1)
  })
