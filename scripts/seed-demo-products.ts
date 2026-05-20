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

const shouldPublishDemoProducts =
  process.env.SEED_DEMO_PRODUCTS_PUBLIC === "true"

function getSeoDescription(description: string) {
  return description.length > 155 ? `${description.slice(0, 152)}...` : description
}

function getDemoSlug(slug: string) {
  return `demo-${slug}`
}

function getDemoLegacyId(id: string) {
  return `demo-${id}`
}

async function seedDemoProducts() {
  for (const product of staticProducts) {
    const now = new Date()
    const shippingProfile = getProductShippingProfile(product.id)
    const legacyId = getDemoLegacyId(product.id)
    const slug = getDemoSlug(product.slug)
    const name = `【DEMO】${product.name}`

    const status = shouldPublishDemoProducts ? "active" : "draft"
    const stockStatus = product.stockStatus === "out-of-stock" ? "in-stock" : product.stockStatus

    const upserted = await db
      .insert(catalogProducts)
      .values({
        legacyId,
        slug,
        name,
        price: product.price,
        shortDescription: "開発・表示確認用のデモ商品です。本番販売用の商品ではありません。",
        description: product.description,
        origin: product.origin,
        ingredients: product.ingredients,
        allergens: product.allergens,
        shelfLife: product.shelfLife,
        storage: product.storage,
        category: product.category ?? null,
        tag: product.tag ?? "DEMO",
        stockStatus,
        stockQuantity: 20,
        status,
        isActive: shouldPublishDemoProducts,
        isArchived: false,
        seoTitle: name,
        seoDescription: getSeoDescription(product.description),
        canonicalSlug: slug,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: catalogProducts.legacyId,
        set: {
          slug,
          name,
          price: product.price,
          shortDescription: "開発・表示確認用のデモ商品です。本番販売用の商品ではありません。",
          description: product.description,
          origin: product.origin,
          ingredients: product.ingredients,
          allergens: product.allergens,
          shelfLife: product.shelfLife,
          storage: product.storage,
          category: product.category ?? null,
          tag: product.tag ?? "DEMO",
          stockStatus,
          stockQuantity: 20,
          status,
          isActive: shouldPublishDemoProducts,
          isArchived: false,
          seoTitle: name,
          seoDescription: getSeoDescription(product.description),
          canonicalSlug: slug,
          updatedAt: now,
        },
      })
      .returning()

    const catalogProduct = upserted[0]

    if (!catalogProduct) {
      throw new Error(`Failed to upsert demo product ${legacyId}`)
    }

    await db
      .delete(productImages)
      .where(eq(productImages.productId, catalogProduct.id))

    const imageRows = [
      {
        productId: catalogProduct.id,
        url: product.image,
        alt: name,
        role: "main",
        sortOrder: 0,
      },
      ...(product.images ?? [])
        .filter((image) => image && image !== product.image)
        .map((image, index) => ({
          productId: catalogProduct.id,
          url: image,
          alt: name,
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
      action: shouldPublishDemoProducts
        ? "seed_demo_product_public"
        : "seed_demo_product_draft",
      beforeJson: null,
      afterJson: {
        legacyId,
        slug,
        status,
        isActive: shouldPublishDemoProducts,
        shippingProfile,
      },
      createdAt: now,
    })

    console.log(
      `Seeded demo product: ${legacyId} / ${slug} / ${status} / public=${shouldPublishDemoProducts}`
    )
  }
}

seedDemoProducts()
  .then(() => {
    console.log("Demo product seed completed.")
    console.log(
      shouldPublishDemoProducts
        ? "Demo products are PUBLIC. They will appear on /shop and can be used for checkout testing."
        : "Demo products are DRAFT. They are visible in admin only."
    )
    process.exit(0)
  })
  .catch((error) => {
    console.error("Demo product seed failed:", error)
    process.exit(1)
  })
