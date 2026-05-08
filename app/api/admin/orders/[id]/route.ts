import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { donationContributions, orders } from "@/lib/db/schema"
import { sendOrderShippedEmail } from "@/lib/email"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const allowedStatuses = ["paid", "processing", "shipped", "delivered"] as const
type AllowedStatus = (typeof allowedStatuses)[number]

type UpdateOrderBody = {
  status?: string
  shippingCarrier?: string | null
  trackingNumber?: string | null
  shippingNote?: string | null
}

function isAllowedStatus(value: string): value is AllowedStatus {
  return allowedStatuses.includes(value as AllowedStatus)
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as UpdateOrderBody

    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 })
    }

    const hasStatusField = Object.prototype.hasOwnProperty.call(body, "status")
    const hasShippingCarrierField = Object.prototype.hasOwnProperty.call(body, "shippingCarrier")
    const hasTrackingNumberField = Object.prototype.hasOwnProperty.call(body, "trackingNumber")
    const hasShippingNoteField = Object.prototype.hasOwnProperty.call(body, "shippingNote")

    if (
      !hasStatusField &&
      !hasShippingCarrierField &&
      !hasTrackingNumberField &&
      !hasShippingNoteField
    ) {
      return NextResponse.json(
        { error: "No fields provided for update" },
        { status: 400 }
      )
    }

    const status =
      typeof body.status === "string" ? body.status.trim() : undefined

    if (hasStatusField && (!status || !isAllowedStatus(status))) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const existing = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1)

    const existingOrder = existing[0]

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const nextStatus = status ?? existingOrder.status
    const nextShippingCarrier = hasShippingCarrierField
      ? normalizeOptionalText(body.shippingCarrier)
      : existingOrder.shippingCarrier
    const nextTrackingNumber = hasTrackingNumberField
      ? normalizeOptionalText(body.trackingNumber)
      : existingOrder.trackingNumber
    const nextShippingNote = hasShippingNoteField
      ? normalizeOptionalText(body.shippingNote)
      : existingOrder.shippingNote

    if (nextStatus === "shipped") {
      if (!nextShippingCarrier || !nextTrackingNumber) {
        return NextResponse.json(
          {
            error:
              "shippingCarrier and trackingNumber are required when status is shipped",
          },
          { status: 400 }
        )
      }
    }

    const updateData: Partial<typeof orders.$inferInsert> = {}

    if (hasStatusField && status) {
      updateData.status = status
    }

    if (hasShippingCarrierField) {
      updateData.shippingCarrier = nextShippingCarrier
    }

    if (hasTrackingNumberField) {
      updateData.trackingNumber = nextTrackingNumber
    }

    if (hasShippingNoteField) {
      updateData.shippingNote = nextShippingNote
    }

    const updated = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning()

    const updatedOrder = updated[0]

    if (!updatedOrder) {
      throw new Error("Failed to update order")
    }

    logger.info("Order updated", {
      orderId: updatedOrder.id,
      prevStatus: existingOrder.status,
      newStatus: updatedOrder.status,
      shippingCarrier: updatedOrder.shippingCarrier,
      trackingNumber: updatedOrder.trackingNumber,
    })

    if (existingOrder.status !== updatedOrder.status && updatedOrder.status === "shipped") {
      try {
        await sendOrderShippedEmail({
          internalOrderId: updatedOrder.id,
          publicOrderNumber: updatedOrder.publicOrderNumber ?? updatedOrder.id,
          customerEmail: updatedOrder.customerEmail,
          customerName: updatedOrder.customerName,
          shippingCarrier: updatedOrder.shippingCarrier,
          trackingNumber: updatedOrder.trackingNumber,
          shippingNote: updatedOrder.shippingNote,
        })

        logger.info("Shipped email sent", {
          orderId: updatedOrder.id,
          email: updatedOrder.customerEmail,
          shippingCarrier: updatedOrder.shippingCarrier,
          trackingNumber: updatedOrder.trackingNumber,
        })
      } catch (emailError) {
        logger.error("Failed to send shipped email", {
          orderId: updatedOrder.id,
          error:
            emailError instanceof Error
              ? emailError.message
              : "unknown_error",
        })
      }
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    logger.error("Update order failed", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 })
    }

    const existing = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1)

    const existingOrder = existing[0]

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    await db
      .delete(donationContributions)
      .where(eq(donationContributions.orderId, id))

    const deleted = await db.delete(orders).where(eq(orders.id, id)).returning()

    if (!deleted[0]) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    logger.info("Order deleted from admin", {
      orderId: id,
      publicOrderNumber: existingOrder.publicOrderNumber,
      stripeSessionId: existingOrder.stripeSessionId,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("Delete order failed", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    )
  }
}
