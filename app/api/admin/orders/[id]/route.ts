import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { donationContributions, orders } from "@/lib/db/schema"
import { sendOrderShippedEmail } from "@/lib/email"
import { logger } from "@/lib/logger"
import type { OrderItem, OrderShippingSnapshot } from "@/types/order"

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

type AdminOrderRow = typeof orders.$inferSelect

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

function normalizeDate(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return new Date(value).toISOString()
  return new Date().toISOString()
}

function parseJsonLike(value: unknown): unknown {
  if (typeof value !== "string") return value

  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value

  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeItems(value: unknown): OrderItem[] {
  const parsed = parseJsonLike(value)

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed.map((item) => {
    const record = item as Record<string, unknown>

    return {
      id: typeof record.id === "string" ? record.id : "",
      slug: typeof record.slug === "string" ? record.slug : "",
      name: typeof record.name === "string" ? record.name : "",
      price: normalizeNumber(record.price),
      image: typeof record.image === "string" ? record.image : "",
      quantity: normalizeNumber(record.quantity),
      lengthCm: normalizeOptionalNumber(record.lengthCm),
      widthCm: normalizeOptionalNumber(record.widthCm),
      heightCm: normalizeOptionalNumber(record.heightCm),
      volumeCm3: normalizeOptionalNumber(record.volumeCm3),
      weightGrams: normalizeOptionalNumber(record.weightGrams),
    }
  })
}

function normalizeShippingSnapshot(value: unknown): OrderShippingSnapshot | null {
  const parsed = parseJsonLike(value)

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null
  }

  const record = parsed as Record<string, unknown>

  return {
    carrier: typeof record.carrier === "string" ? record.carrier : "",
    service: typeof record.service === "string" ? record.service : "",
    originPrefecture:
      typeof record.originPrefecture === "string" ? record.originPrefecture : "",
    destinationPrefecture:
      typeof record.destinationPrefecture === "string"
        ? record.destinationPrefecture
        : "",
    zone: typeof record.zone === "string" ? record.zone : "",
    shippingSize: normalizeNumber(record.shippingSize),
    boxType: normalizeOptionalNumber(record.boxType),
    boxLabel: typeof record.boxLabel === "string" ? record.boxLabel : "",
    boxInnerVolumeCm3: normalizeOptionalNumber(record.boxInnerVolumeCm3),
    boxUsableVolumeCm3: normalizeOptionalNumber(record.boxUsableVolumeCm3),
    totalVolumeCm3: normalizeOptionalNumber(record.totalVolumeCm3),
    remainingVolumeCm3: normalizeOptionalNumber(record.remainingVolumeCm3),
    fillPercent: normalizeOptionalNumber(record.fillPercent),
    totalWeightGrams: normalizeOptionalNumber(record.totalWeightGrams),
  }
}

function mapOrder(row: AdminOrderRow) {
  return {
    id: row.id,
    publicOrderNumber: row.publicOrderNumber,
    stripeSessionId: row.stripeSessionId,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPostalCode: row.customerPostalCode,
    customerPrefecture: row.customerPrefecture,
    customerCity: row.customerCity,
    customerAddressLine1: row.customerAddressLine1,
    customerAddressLine2: row.customerAddressLine2,
    totalAmount: row.totalAmount,
    itemsSubtotal: row.itemsSubtotal,
    shippingAmount: row.shippingAmount,
    items: normalizeItems(row.items),
    shippingSnapshot: normalizeShippingSnapshot(row.shippingSnapshot),
    status: row.status,
    shippingCarrier: row.shippingCarrier,
    trackingNumber: row.trackingNumber,
    shippingNote: row.shippingNote,
    createdAt: normalizeDate(row.createdAt),
  }
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
    const hasShippingCarrierField = Object.prototype.hasOwnProperty.call(
      body,
      "shippingCarrier"
    )
    const hasTrackingNumberField = Object.prototype.hasOwnProperty.call(
      body,
      "trackingNumber"
    )
    const hasShippingNoteField = Object.prototype.hasOwnProperty.call(
      body,
      "shippingNote"
    )

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

    if (
      existingOrder.status !== updatedOrder.status &&
      updatedOrder.status === "shipped"
    ) {
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

    return NextResponse.json({ order: mapOrder(updatedOrder) })
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

    await db.delete(donationContributions).where(eq(donationContributions.orderId, id))

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
