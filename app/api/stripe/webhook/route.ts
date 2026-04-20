import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { eq } from "drizzle-orm"

import { stripe } from "../../../../lib/stripe"
import { createOrderId } from "../../../../lib/order-id"
import { savePaidOrder } from "../../../../lib/blob-orders"

import { db } from "@/lib/db"
import { orders, webhookEvents } from "@/lib/db/schema"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { logger } from "@/lib/logger"
import { sendPurchaseToGA } from "@/lib/ga-server"

import type { CustomerInfo, OrderItem, PaidOrder } from "../../../../types/order"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string

if (!webhookSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET")
}

const WEBHOOK_STATUS = {
  PROCESSING: "processing",
  PROCESSED: "processed",
  IGNORED: "ignored",
  FAILED: "failed",
} as const

const STALE_PROCESSING_MS = 10 * 60 * 1000

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

function extractStripeSessionId(event: Stripe.Event): string | null {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    return session.id ?? null
  }

  return null
}

function isStaleProcessing(updatedAt: Date | null | undefined) {
  if (!updatedAt) return true
  return Date.now() - updatedAt.getTime() > STALE_PROCESSING_MS
}

type WebhookClaimResult =
  | { action: "process" }
  | { action: "skip"; reason: string; httpStatus?: number }

async function claimWebhookEvent(event: Stripe.Event): Promise<WebhookClaimResult> {
  const stripeSessionId = extractStripeSessionId(event)
  const now = new Date()

  try {
    await db.insert(webhookEvents).values({
      stripeEventId: event.id,
      eventType: event.type,
      stripeSessionId,
      status: WEBHOOK_STATUS.PROCESSING,
      errorMessage: null,
      payload: event as unknown as Record<string, unknown>,
      createdAt: now,
      updatedAt: now,
      processedAt: null,
    })

    logger.info("Webhook event claimed", {
      eventId: event.id,
      eventType: event.type,
      stripeSessionId,
    })

    return { action: "process" }
  } catch (error) {
    if (!isPostgresUniqueViolation(error)) {
      throw error
    }
  }

  const existingRows = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.stripeEventId, event.id))
    .limit(1)

  const existing = existingRows[0]

  if (!existing) {
    throw new Error(`Webhook event ${event.id} conflicted but could not be loaded.`)
  }

  if (existing.status === WEBHOOK_STATUS.PROCESSED) {
    return { action: "skip", reason: "event_already_processed" }
  }

  if (existing.status === WEBHOOK_STATUS.IGNORED) {
    return { action: "skip", reason: "event_already_ignored" }
  }

  if (existing.status === WEBHOOK_STATUS.FAILED || isStaleProcessing(existing.updatedAt)) {
    await db
      .update(webhookEvents)
      .set({
        status: WEBHOOK_STATUS.PROCESSING,
        errorMessage: null,
        stripeSessionId: extractStripeSessionId(event),
        payload: event as unknown as Record<string, unknown>,
        updatedAt: now,
      })
      .where(eq(webhookEvents.stripeEventId, event.id))

    logger.warn("Webhook event reclaimed", {
      eventId: event.id,
      previousStatus: existing.status,
    })

    return { action: "process" }
  }

  return {
    action: "skip",
    reason: "event_already_processing",
    httpStatus: 202,
  }
}

async function markWebhookEventProcessed(
  eventId: string,
  status: typeof WEBHOOK_STATUS.PROCESSED | typeof WEBHOOK_STATUS.IGNORED,
  errorMessage?: string | null
) {
  const now = new Date()

  await db
    .update(webhookEvents)
    .set({
      status,
      errorMessage: errorMessage ?? null,
      processedAt: now,
      updatedAt: now,
    })
    .where(eq(webhookEvents.stripeEventId, eventId))
}

async function markWebhookEventFailed(eventId: string, error: unknown) {
  const now = new Date()
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error"

  await db
    .update(webhookEvents)
    .set({
      status: WEBHOOK_STATUS.FAILED,
      errorMessage: message,
      updatedAt: now,
    })
    .where(eq(webhookEvents.stripeEventId, eventId))
}

async function getOrderByStripeSessionId(stripeSessionId: string) {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeSessionId, stripeSessionId))
    .limit(1)

  return rows[0] ?? null
}

async function archiveOrderToBlob(order: PaidOrder) {
  try {
    const savedPath = await savePaidOrder(order)

    logger.info("Order archived to Blob", {
      orderId: order.id,
      savedPath,
      stripeSessionId: order.stripeSessionId,
    })
  } catch (blobError) {
    logger.error("Blob archive failed", {
      orderId: order.id,
      stripeSessionId: order.stripeSessionId,
      error: blobError instanceof Error ? blobError.message : "unknown_error",
    })
  }
}

async function sendOrderEmail(order: PaidOrder) {
  try {
    await sendOrderConfirmationEmail(order)

    logger.info("Order confirmation email sent", {
      orderId: order.id,
      stripeSessionId: order.stripeSessionId,
      customerEmail: order.customer.email,
    })
  } catch (emailError) {
    logger.error("Order confirmation email failed", {
      orderId: order.id,
      stripeSessionId: order.stripeSessionId,
      customerEmail: order.customer.email,
      error: emailError instanceof Error ? emailError.message : "unknown_error",
    })
  }
}

async function buildPaidOrderFromSession(session: Stripe.Checkout.Session): Promise<PaidOrder> {
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

  return {
    id: createOrderId(),
    internalOrderId: null,
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
}

async function persistOrderToDatabase(order: PaidOrder) {
  try {
    const inserted = await db
      .insert(orders)
      .values({
        publicOrderNumber: order.id,
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
      .returning()

    logger.info("Order saved to Postgres", {
      orderId: inserted[0]?.id,
      stripeSessionId: order.stripeSessionId,
      total: order.total,
      customerEmail: order.customer.email,
      itemsCount: order.items.length,
    })

    return { inserted: true, dbOrder: inserted[0] ?? null }
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      logger.warn("Order insert skipped because session already exists", {
        stripeSessionId: order.stripeSessionId,
      })
      return { inserted: false, dbOrder: null }
    }

    throw error
  }
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
    logger.error("Stripe webhook signature verification failed", {
      error: error instanceof Error ? error.message : "unknown_error",
    })
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 })
  }

  try {
    const claim = await claimWebhookEvent(event)

    if (claim.action === "skip") {
      logger.warn("Webhook event skipped", {
        eventId: event.id,
        reason: claim.reason,
      })

      return NextResponse.json(
        { received: true, duplicate: true, reason: claim.reason },
        { status: claim.httpStatus ?? 200 }
      )
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.payment_status !== "paid") {
          logger.info("Session not paid, webhook ignored", {
            eventId: event.id,
            sessionId: session.id,
            paymentStatus: session.payment_status,
          })

          await markWebhookEventProcessed(
            event.id,
            WEBHOOK_STATUS.IGNORED,
            `Session payment_status is ${session.payment_status}`
          )

          return NextResponse.json({
            received: true,
            ignored: true,
            reason: "session_not_paid",
          })
        }

        const existingOrder = await getOrderByStripeSessionId(session.id)

        if (existingOrder) {
          logger.warn("Order already exists for session, skipping insert", {
            eventId: event.id,
            sessionId: session.id,
            orderId: existingOrder.id,
          })

          await markWebhookEventProcessed(
            event.id,
            WEBHOOK_STATUS.PROCESSED,
            "Order already existed for session."
          )

          return NextResponse.json({
            received: true,
            duplicate: true,
            reason: "session_already_exists",
          })
        }

        const order = await buildPaidOrderFromSession(session)
        const result = await persistOrderToDatabase(order)

        if (result.inserted) {
          await sendPurchaseToGA({
            clientId: session.client_reference_id || session.id,
            orderId: order.id,
            value: order.total,
            currency: order.currency,
            items: order.items.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
          })

          await archiveOrderToBlob(order)
          await sendOrderEmail({
            ...order,
            id: result.dbOrder?.publicOrderNumber ?? order.id,
            internalOrderId: result.dbOrder?.id ?? null,
          })
        } else {
          logger.warn("Skipping Blob archive and email because order was already inserted", {
            sessionId: order.stripeSessionId,
          })
        }

        await markWebhookEventProcessed(event.id, WEBHOOK_STATUS.PROCESSED)

        return NextResponse.json({ received: true })
      }

      default: {
        logger.info("Unhandled Stripe event type", {
          eventId: event.id,
          eventType: event.type,
        })

        await markWebhookEventProcessed(
          event.id,
          WEBHOOK_STATUS.IGNORED,
          `Unhandled Stripe event type: ${event.type}`
        )

        return NextResponse.json({ received: true, ignored: true })
      }
    }
  } catch (error) {
    logger.error("Stripe webhook handler failed", {
      eventId: event?.id,
      error: error instanceof Error ? error.message : "unknown_error",
    })

    try {
      await markWebhookEventFailed(
        event.id,
        error instanceof Error ? error : new Error("Webhook processing failed.")
      )
    } catch (markError) {
      logger.error("Failed to mark webhook event as failed", {
        eventId: event?.id,
        error: markError instanceof Error ? markError.message : "unknown_error",
      })
    }

    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 })
  }
}