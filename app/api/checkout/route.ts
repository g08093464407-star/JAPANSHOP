import { NextRequest, NextResponse } from "next/server"

import { stripe } from "@/lib/stripe"
import { toAbsoluteUrl } from "@/lib/site-url"
import { logger } from "@/lib/logger"
import {
  getJapanPostRate,
  getJapanPostZoneByPrefecture,
  type JapanPostZone,
  type ShippingSize,
} from "@/lib/shipping/japan-post"
import {
  getCatalogProductByLegacyId,
  getCatalogProductBySlug,
  type CatalogProduct,
} from "@/lib/product/catalog"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CheckoutItem = {
  id?: string
  slug?: string
  name?: string
  price?: number
  image?: string
  quantity?: number
}

type CheckoutCustomer = {
  fullName?: string
  email?: string
  phone?: string
  postalCode?: string
  prefecture?: string
  city?: string
  addressLine1?: string
  addressLine2?: string
}

type CheckoutRequestBody = {
  items?: CheckoutItem[]
  customer?: CheckoutCustomer
}

type ValidatedCheckoutItem = {
  id: string
  slug: string
  name: string
  price: number
  image: string
  quantity: number
  shippingProfile: {
    shippingOriginPrefecture: string
    sizeClass: ShippingSize
    volumeUnits: number
    weightGrams: number | null
  }
}

type ValidatedCheckoutCustomer = {
  fullName: string
  email: string
  phone: string
  postalCode: string
  prefecture: string
  city: string
  addressLine1: string
  addressLine2: string
}

const allowedShippingSizes: ShippingSize[] = [60, 80, 100, 120, 140, 160, 170]

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function getDigits(value: string) {
  return value.replace(/\D/g, "")
}

function normalizeSiteUrl(value: string) {
  return value.trim().replace(/\/+$/, "")
}

function getCanonicalSiteUrl(request: NextRequest) {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.APP_URL

  if (envUrl && envUrl.trim()) {
    return normalizeSiteUrl(envUrl)
  }

  return normalizeSiteUrl(request.nextUrl.origin)
}

function validateCustomer(customer: CheckoutCustomer | undefined) {
  if (!customer) {
    return { error: "Missing customer info." } as const
  }

  const fullName = customer.fullName?.trim() ?? ""
  const email = customer.email?.trim() ?? ""
  const phone = customer.phone?.trim() ?? ""
  const postalCode = customer.postalCode?.trim() ?? ""
  const prefecture = customer.prefecture?.trim() ?? ""
  const city = customer.city?.trim() ?? ""
  const addressLine1 = customer.addressLine1?.trim() ?? ""
  const addressLine2 = customer.addressLine2?.trim() ?? ""

  if (!fullName) {
    return { error: "Missing full name." } as const
  }

  if (!email || !isValidEmail(email)) {
    return { error: "Invalid email." } as const
  }

  const phoneDigits = getDigits(phone)

  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    return { error: "Invalid phone number." } as const
  }

  const postalCodeDigits = getDigits(postalCode)

  if (postalCodeDigits.length !== 7) {
    return { error: "Invalid postal code." } as const
  }

  if (!prefecture) {
    return { error: "Missing prefecture." } as const
  }

  if (!city) {
    return { error: "Missing city." } as const
  }

  if (!addressLine1) {
    return { error: "Missing address line." } as const
  }

  return {
    customer: {
      fullName,
      email,
      phone,
      postalCode,
      prefecture,
      city,
      addressLine1,
      addressLine2,
    } satisfies ValidatedCheckoutCustomer,
  } as const
}

async function findCatalogProduct(item: CheckoutItem) {
  const id = typeof item.id === "string" ? item.id.trim() : ""
  const slug = typeof item.slug === "string" ? item.slug.trim() : ""

  if (id) {
    const product = await getCatalogProductByLegacyId(id)

    if (product) return product
  }

  if (slug) {
    return getCatalogProductBySlug(slug)
  }

  return null
}

function getProductMainImage(product: CatalogProduct) {
  if (product.image) return product.image
  return product.images?.[0] ?? ""
}

function getValidatedShippingProfile(product: CatalogProduct) {
  const profile = product.shippingProfile
  const sizeClass = Number(profile?.sizeClass ?? 60)
  const volumeUnits = Number(profile?.volumeUnits ?? 1)
  const weightGrams =
    typeof profile?.weightGrams === "number" ? profile.weightGrams : null

  return {
    shippingOriginPrefecture:
      profile?.shippingOriginPrefecture?.trim() || "愛知県",
    sizeClass: allowedShippingSizes.includes(sizeClass as ShippingSize)
      ? (sizeClass as ShippingSize)
      : 60,
    volumeUnits:
      Number.isInteger(volumeUnits) && volumeUnits >= 1 && volumeUnits <= 24
        ? volumeUnits
        : 1,
    weightGrams:
      weightGrams !== null && Number.isInteger(weightGrams) && weightGrams >= 0
        ? weightGrams
        : null,
  }
}

async function validateItems(items: CheckoutItem[] | undefined) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Cart is empty." } as const
  }

  const validatedItems: ValidatedCheckoutItem[] = []

  for (const item of items) {
    const quantity = Number(item.quantity ?? 0)

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { error: "Invalid item quantity." } as const
    }

    const catalogProduct = await findCatalogProduct(item)

    if (!catalogProduct) {
      return { error: "Invalid product in cart." } as const
    }

    if (
      !catalogProduct.isActive ||
      catalogProduct.isArchived ||
      catalogProduct.status !== "active"
    ) {
      return { error: `${catalogProduct.name} is not available.` } as const
    }

    if (catalogProduct.stockStatus === "out-of-stock") {
      return { error: `${catalogProduct.name} is out of stock.` } as const
    }

    if (
      typeof catalogProduct.stockQuantity === "number" &&
      quantity > catalogProduct.stockQuantity
    ) {
      return {
        error: `${catalogProduct.name} has only ${catalogProduct.stockQuantity} items available.`,
      } as const
    }

    validatedItems.push({
      id: catalogProduct.legacyId,
      slug: catalogProduct.slug,
      name: catalogProduct.name,
      price: catalogProduct.price,
      image: getProductMainImage(catalogProduct),
      quantity,
      shippingProfile: getValidatedShippingProfile(catalogProduct),
    })
  }

  return { items: validatedItems } as const
}

function getPackageCapacityUnits(size: ShippingSize) {
  if (size <= 60) return 2
  if (size <= 80) return 5
  if (size <= 100) return 8
  if (size <= 120) return 12
  if (size <= 140) return 16
  if (size <= 160) return 20
  return 24
}

function getNextAvailableSize(size: number): ShippingSize {
  for (const shippingSize of allowedShippingSizes) {
    if (size <= shippingSize) {
      return shippingSize
    }
  }

  return 170
}

function getSizeFromVolumeUnits(volumeUnits: number): ShippingSize {
  if (volumeUnits <= 2) return 60
  if (volumeUnits <= 5) return 80
  if (volumeUnits <= 8) return 100
  if (volumeUnits <= 12) return 120
  if (volumeUnits <= 16) return 140
  if (volumeUnits <= 20) return 160
  return 170
}

function calculateShippingSize(items: ValidatedCheckoutItem[]) {
  let totalVolumeUnits = 0
  let largestSize: ShippingSize = 60

  for (const item of items) {
    totalVolumeUnits += item.shippingProfile.volumeUnits * item.quantity

    if (item.shippingProfile.sizeClass > largestSize) {
      largestSize = item.shippingProfile.sizeClass
    }
  }

  const volumeSize = getSizeFromVolumeUnits(totalVolumeUnits)
  return getNextAvailableSize(Math.max(largestSize, volumeSize))
}

function getPrimaryOriginPrefecture(items: ValidatedCheckoutItem[]) {
  const origins = Array.from(
    new Set(
      items.map((item) => item.shippingProfile.shippingOriginPrefecture.trim())
    )
  ).filter(Boolean)

  if (origins.length === 0) return "愛知県"

  return origins[0] ?? "愛知県"
}

function calculateCheckoutShipping({
  destinationPrefecture,
  items,
}: {
  destinationPrefecture: string
  items: ValidatedCheckoutItem[]
}) {
  const normalizedDestinationPrefecture = destinationPrefecture
    .trim()
    .replace(/\s/g, "")
  const zone = getJapanPostZoneByPrefecture(normalizedDestinationPrefecture)
  const size = calculateShippingSize(items)
  const amount = getJapanPostRate({ zone, size })

  return {
    originPrefecture: getPrimaryOriginPrefecture(items),
    destinationPrefecture: normalizedDestinationPrefecture,
    zone,
    size,
    amount,
    carrier: "日本郵便" as const,
    service: "ゆうパック" as const,
    capacityUnits: getPackageCapacityUnits(size),
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequestBody

    const customerResult = validateCustomer(body?.customer)

    if ("error" in customerResult) {
      return NextResponse.json({ error: customerResult.error }, { status: 400 })
    }

    const itemsResult = await validateItems(body?.items)

    if ("error" in itemsResult) {
      return NextResponse.json({ error: itemsResult.error }, { status: 400 })
    }

    const customer = customerResult.customer
    const items = itemsResult.items
    const siteUrl = getCanonicalSiteUrl(request)
    const itemsSubtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const shippingQuote = calculateCheckoutShipping({
      destinationPrefecture: customer.prefecture,
      items,
    })
    const shippingAmount = shippingQuote.amount
    const donationBaseAmount = itemsSubtotal

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "ja",
      customer_email: customer.email,
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?canceled=1`,
      metadata: {
        customer_fullName: customer.fullName,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_postalCode: customer.postalCode,
        customer_prefecture: customer.prefecture,
        customer_city: customer.city,
        customer_addressLine1: customer.addressLine1,
        customer_addressLine2: customer.addressLine2,
        site_url: siteUrl,
        items_subtotal: String(itemsSubtotal),
        shipping_amount: String(shippingAmount),
        shipping_carrier: shippingQuote.carrier,
        shipping_service: shippingQuote.service,
        shipping_origin_prefecture: shippingQuote.originPrefecture,
        shipping_destination_prefecture: shippingQuote.destinationPrefecture,
        shipping_zone: shippingQuote.zone as JapanPostZone,
        shipping_size: String(shippingQuote.size),
        shipping_capacity_units: String(shippingQuote.capacityUnits),
        donation_base_amount: String(donationBaseAmount),
        donation_rate: "5",
      },
      line_items: [
        ...items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: "jpy",
            unit_amount: item.price,
            product_data: {
              name: item.name,
              images: item.image ? [toAbsoluteUrl(item.image, siteUrl)] : [],
              metadata: {
                app_line_type: "product",
                app_item_id: item.id,
                app_item_slug: item.slug,
                app_item_image: item.image,
              },
            },
          },
        })),
        {
          quantity: 1,
          price_data: {
            currency: "jpy",
            unit_amount: shippingAmount,
            product_data: {
              name: `ゆうパック送料（${shippingQuote.size}サイズ）`,
              metadata: {
                app_line_type: "shipping",
                shipping_carrier: shippingQuote.carrier,
                shipping_service: shippingQuote.service,
                shipping_zone: shippingQuote.zone,
                shipping_size: String(shippingQuote.size),
                shipping_origin_prefecture: shippingQuote.originPrefecture,
                shipping_destination_prefecture:
                  shippingQuote.destinationPrefecture,
              },
            },
          },
        },
      ],
    })

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe session URL was not created." },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    logger.error("Checkout session creation failed", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    )
  }
}
