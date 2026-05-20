import { NextResponse } from "next/server"

import { getCatalogProducts } from "@/lib/product/catalog"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function serializePublicCatalogProduct(
  product: Awaited<ReturnType<typeof getCatalogProducts>>[number]
) {
  return {
    id: product.id,
    legacyId: product.legacyId,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    images: product.images,
    description: product.description,
    category: product.category ?? null,
    tag: product.tag ?? null,
    stockStatus: product.stockStatus,
    shippingProfile: product.shippingProfile
      ? {
          shippingOriginPrefecture: product.shippingProfile.shippingOriginPrefecture,
          sizeClass: product.shippingProfile.sizeClass,
          volumeUnits: product.shippingProfile.volumeUnits,
          lengthCm: product.shippingProfile.lengthCm,
          widthCm: product.shippingProfile.widthCm,
          heightCm: product.shippingProfile.heightCm,
          volumeCm3: product.shippingProfile.volumeCm3,
          weightGrams: product.shippingProfile.weightGrams,
          packageType: product.shippingProfile.packageType,
          temperatureType: product.shippingProfile.temperatureType,
        }
      : {
          shippingOriginPrefecture: "愛知県",
          sizeClass: 60,
          volumeUnits: 1,
          lengthCm: null,
          widthCm: null,
          heightCm: null,
          volumeCm3: null,
          weightGrams: null,
          packageType: "standard",
          temperatureType: "ambient",
        },
  }
}

export async function GET() {
  try {
    const products = await getCatalogProducts()

    return NextResponse.json({
      products: products.map(serializePublicCatalogProduct),
    })
  } catch (error) {
    logger.error("Failed to load public catalog products", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to load catalog products." },
      { status: 500 }
    )
  }
}
