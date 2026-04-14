import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

import { stripe } from "../../../../lib/stripe"
import { createOrderId } from "../../../../lib/order-id"
import { savePaidOrder, getOrderBySessionId } from "../../../../lib/blob-orders"
import { put, get } from "@vercel/blob"

import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { sendOrderConfirmationEmail } from "@/lib/email"

import type { CustomerInfo, OrderItem, PaidOrder } from "../../../../types/order"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string

if (!webhookSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET")
}

async function isStripeEventProcessed(eventId: string): Promise<boolean> {
  const path = `orders/processed-events/${eventId}.json`
  const res = await get(path, { access: "private" }).catch(() => null)
  return !!res && res.statusCode === 200
}

async function markStripeEventProcessed(eventId: string): Promise<void> {
  const path = `orders/processed-events/${eventId}.json`

  await put(
    path,
    JSON.stringify({ processed: true, at: new Date().toISOString() }),
    {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json; charset=utf-8",
    }
  )
}

function isPostgresUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }

  const maybeError = error as {
    code?: string
    message?: string
    cause?: { code?: string; message?: string }
  }

  return (
    maybeError.code === "23505" ||
    maybeError.cause?.code === "23505" ||
    maybeError.message?.toLowerCase().includes("duplicate key") === true ||
    maybeError.cause?.message?.toLowerCase().includes("duplicate key") === true
  )
}

function isExpandedProduct(
  product: string | Stripe.Product | Stripe.DeletedProduct | null | undefined
): product is Stripe.Product {
  return (
    !!product &&
    typeof product !== "string" &&
    product.object === "product" &&
    !("deleted" in product)
  )
}

function buildAbsoluteUrl(pathOrUrl: string, siteUrl?: string) {
  if (!pathOrUrl) return ""
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl
  if (!siteUrl) return pathOrUrl
  return `${siteUrl}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`
}

function getLineItemProduct(item: Stripe.LineItem): Stripe.Product | null {
  const price = item.price

  if (!price || typeof price === "string") {
    return null
  }

  return isExpandedProduct(price.product) ? price.product : null
}

function getLineItemImage(item: Stripe.LineItem, siteUrl?: string): string {
  const product = getLineItemProduct(item)

  if (product && Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0] ?? ""
  }

  const metadataImage = product?.metadata?.app_item_image ?? ""
  return buildAbsoluteUrl(metadataImage, siteUrl)
}

function getLineItemSlug(item: Stripe.LineItem): string {
  const product = getLineItemProduct(item)
  return product?.metadata?.app_item_slug ?? ""
}

function getLineItemId(item: Stripe.LineItem, fallbackId: string): string {
  const product = getLineItemProduct(item)
  return product?.metadata?.app_item_id ?? fallbackId
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 })
  }

  const body = await request.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 })
  }

  try {
    if (await isStripeEventProcessed(event.id)) {
      console.log("Duplicate Stripe event skipped:", event.id)
      return NextResponse.json({ received: true, duplicate: true, reason: "event_already_processed" })
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.payment_status !== "paid") {
          console.log("Session not paid, skipping:", session.id)
          break
        }

        const existingOrder = await getOrderBySessionId(session.id)

        if (existingOrder) {
          console.log("Duplicate session skipped:", session.id)
          await markStripeEventProcessed(event.id)
          return NextResponse.json({ received: true, duplicate: true, reason: "session_already_exists" })
        }

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ["data.price.product"],
        })

        let receiptUrl: string | null = null
        let stripePaymentIntentId: string | null = null

        if (typeof session.payment_intent === "string") {
          stripePaymentIntentId = session.payment_intent

          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent, {
            expand: ["latest_charge"],
          })

          if (paymentIntent.latest_charge && typeof paymentIntent.latest_charge !== "string") {
            receiptUrl = paymentIntent.latest_charge.receipt_url ?? null
          }
        }

        const customer: CustomerInfo = {
          fullName: session.metadata?.customer_fullName ?? "",
          email:
            session.metadata?.customer_email ??
            session.customer_details?.email ??
            session.customer_email ??
            "",
          postalCode: session.metadata?.customer_postalCode ?? "",
          prefecture: session.metadata?.customer_prefecture ?? "",
          city: session.metadata?.customer_city ?? "",
          addressLine1: session.metadata?.customer_addressLine1 ?? "",
          addressLine2: session.metadata?.customer_addressLine2 ?? "",
        }

        const siteUrl = session.metadata?.site_url ?? ""

        const items: OrderItem[] = lineItems.data.map((item, index) => {
          const quantity = item.quantity ?? 1
          const amountTotal = item.amount_total ?? 0
          const price = quantity > 0 ? Math.round(amountTotal / quantity) : 0

          return {
            id: getLineItemId(item, `${session.id}-${index}`),
            slug: getLineItemSlug(item),
            name: item.description ?? "Item",
            price,
            image: getLineItemImage(item, siteUrl),
            quantity,
          }
        })

        const order: PaidOrder = {
          id: createOrderId(),
          stripeSessionId: session.id,
          stripePaymentIntentId,
          stripeReceiptUrl: receiptUrl,
          currency: session.currency ?? "jpy",
          total: session.amount_total ?? 0,
          paymentStatus: "paid",
          customer,
          items,
          createdAt: new Date().toISOString(),
        }

        const savedPath = await savePaidOrder(order)

        await markStripeEventProcessed(event.id)

        try {
          await db.insert(orders).values({
            stripeSessionId: order.stripeSessionId,
            customerName: order.customer.fullName,
            customerEmail: order.customer.email,
            customerPostalCode: order.customer.postalCode,
            customerPrefecture: order.customer.prefecture,
            customerCity: order.customer.city,
            customerAddressLine1: order.customer.addressLine1,
            customerAddressLine2: order.customer.addressLine2 ?? "",
            totalAmount: order.total,
            items: order.items,
            status: "paid",
          })

          console.log("✅ Order mirrored to Neon database")
        } catch (neonError) {
          if (isPostgresUniqueViolation(neonError)) {
            console.log("ℹ️ Neon duplicate insert skipped for session:", order.stripeSessionId)
          } else {
            console.error("❌ Neon mirror failed, but Blob saved:", neonError)
          }
        }

        try {
          await sendOrderConfirmationEmail(order)
          console.log("✅ Order confirmation email sent")
        } catch (emailError) {
          console.error("❌ Failed to send order confirmation email:", emailError)
        }

        console.log("PAID ORDER SAVED:")
        console.log({
          orderId: order.id,
          savedPath,
          stripeSessionId: order.stripeSessionId,
          total: order.total,
          customerEmail: order.customer.email,
          itemsCount: order.items.length,
        })

        break
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Stripe webhook handler failed:", error)
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 })
  }
}