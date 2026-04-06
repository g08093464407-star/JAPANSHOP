import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

import { stripe } from "../../../../lib/stripe"
import { createOrderId } from "../../../../lib/order-id"
import { savePaidOrder } from "../../../../lib/blob-orders"
import type { CustomerInfo, OrderItem, PaidOrder } from "../../../../types/order"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string

if (!webhookSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET")
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
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.payment_status !== "paid") {
          console.log("checkout.session.completed received, but payment_status is not paid")
          break
        }

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

        let receiptUrl: string | null = null
        let stripePaymentIntentId: string | null = null

        if (typeof session.payment_intent === "string") {
          stripePaymentIntentId = session.payment_intent

          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent, {
            expand: ["latest_charge"],
          })

          if (
            paymentIntent.latest_charge &&
            typeof paymentIntent.latest_charge !== "string"
          ) {
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

        const items: OrderItem[] = lineItems.data.map(
          (item: Stripe.LineItem, index: number): OrderItem => {
            const quantity = item.quantity ?? 1
            const amountTotal = item.amount_total ?? 0
            const price = quantity > 0 ? Math.round(amountTotal / quantity) : 0

            return {
              id: `${session.id}-${index}`,
              slug: "",
              name: item.description ?? "Item",
              price,
              image: "",
              quantity,
            }
          }
        )

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

        console.log("PAID ORDER SAVED:")
        console.log({
          orderId: order.id,
          savedPath,
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