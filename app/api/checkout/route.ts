import { NextRequest, NextResponse } from "next/server"

import { products } from "@/data/products"
import { stripe } from "@/lib/stripe"
import { toAbsoluteUrl } from "@/lib/site-url"
import { logger } from "@/lib/logger"

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

function validateItems(items: CheckoutItem[] | undefined) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Cart is empty." } as const
  }

  const validatedItems: ValidatedCheckoutItem[] = []

  for (const item of items) {
    const quantity = Number(item.quantity ?? 0)

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { error: "Invalid item quantity." } as const
    }

    const catalogProduct = products.find((product) => {
      if (item.id && product.id === item.id) return true
      if (item.slug && product.slug === item.slug) return true
      return false
    })

    if (!catalogProduct) {
      return { error: "Invalid product in cart." } as const
    }

    if (catalogProduct.stockStatus === "out-of-stock") {
      return { error: `${catalogProduct.name} is out of stock.` } as const
    }

    validatedItems.push({
      id: catalogProduct.id,
      slug: catalogProduct.slug,
      name: catalogProduct.name,
      price: catalogProduct.price,
      image: catalogProduct.image,
      quantity,
    })
  }

  return { items: validatedItems } as const
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequestBody

    const customerResult = validateCustomer(body?.customer)

    if ("error" in customerResult) {
      return NextResponse.json({ error: customerResult.error }, { status: 400 })
    }

    const itemsResult = validateItems(body?.items)

    if ("error" in itemsResult) {
      return NextResponse.json({ error: itemsResult.error }, { status: 400 })
    }

    const customer = customerResult.customer
    const items = itemsResult.items
    const siteUrl = getCanonicalSiteUrl(request)

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
      },
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "jpy",
          unit_amount: item.price,
          product_data: {
            name: item.name,
            images: item.image ? [toAbsoluteUrl(item.image, siteUrl)] : [],
            metadata: {
              app_item_id: item.id,
              app_item_slug: item.slug,
              app_item_image: item.image,
            },
          },
        },
      })),
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
