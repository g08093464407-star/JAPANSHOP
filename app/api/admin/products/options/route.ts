import { NextResponse } from "next/server"
import { asc, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import { catalogProducts, productImages } from "@/lib/db/schema"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const productRows = await db
      .select({
        id: catalogProducts.id,
        legacyId: catalogProducts.legacyId,
        slug: catalogProducts.slug,
        name: catalogProducts.name,
        category: catalogProducts.category,
        createdAt: catalogProducts.createdAt,
      })
      .from(catalogProducts)
      .orderBy(asc(catalogProducts.createdAt), asc(catalogProducts.name))

    const productIds = productRows.map((product) => product.id)

    const imageRows =
      productIds.length > 0
        ? await db
            .select({
              productId: productImages.productId,
              url: productImages.url,
              role: productImages.role,
            })
            .from(productImages)
            .where(inArray(productImages.productId, productIds))
            .orderBy(asc(productImages.sortOrder), asc(productImages.createdAt))
        : []

    const imagesByProductId = imageRows.reduce<
      Record<string, typeof imageRows>
    >((acc, image) => {
      acc[image.productId] = acc[image.productId] ?? []
      acc[image.productId].push(image)
      return acc
    }, {})

    const products = productRows.map((product) => {
      const images = imagesByProductId[product.id] ?? []
      const image =
        images.find((item) => item.role === "main")?.url ?? images[0]?.url ?? null

      return {
        id: product.id,
        legacyId: product.legacyId,
        slug: product.slug,
        name: product.name,
        image,
        category: product.category,
      }
    })

    return NextResponse.json({ products })
  } catch (error) {
    logger.error("Failed to load admin product options", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to load product options." },
      { status: 500 }
    )
  }
}
