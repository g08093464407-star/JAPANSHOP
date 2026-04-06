import { NextRequest, NextResponse } from "next/server"

import { stripe } from "@/lib/stripe"
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CheckoutItem = {
  id: string
  slug: string
  name: string
  price: number
  image: string
  quantity: number
}

type CheckoutCustomer = {
  fullName: string
  email: string
  postalCode: string
  prefecture: string
  city: string
  addressLine1: string
  addressLine2?: string
}

type CheckoutRequestBody = {
  items: CheckoutItem[]
  customer: CheckoutCustomer
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequestBody
    const items = body?.items ?? []
    const customer = body?.customer

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 })
    }

    if (!customer) {
      return NextResponse.json({ error: "Missing customer info." }, { status: 400 })
    }

    if (!customer.fullName?.trim()) {
      return NextResponse.json({ error: "Missing full name." }, { status: 400 })
    }

    if (!customer.email?.trim() || !isValidEmail(customer.email)) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 })
    }

    const siteUrl = getSiteUrl(request.nextUrl.origin)

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "ja",
      customer_email: customer.email,
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?canceled=1`,
      metadata: {
        customer_fullName: customer.fullName,
        customer_email: customer.email,
        customer_postalCode: customer.postalCode,
        customer_prefecture: customer.prefecture,
        customer_city: customer.city,
        customer_addressLine1: customer.addressLine1,
        customer_addressLine2: customer.addressLine2 ?? "",
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
              app_item_slug: item.slug ?? "",
              app_item_image: item.image ?? "",
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
    console.error("Checkout session creation failed:", error)

    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    )
  }
}
