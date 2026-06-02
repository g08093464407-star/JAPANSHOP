import { NextResponse } from "next/server"
import { desc, isNotNull } from "drizzle-orm"

import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type OrderRow = typeof orders.$inferSelect

const csvColumns = [
  "order_id",
  "public_order_number",
  "created_at",
  "archived_at",
  "status",
  "customer_name",
  "customer_email",
  "postal_code",
  "prefecture",
  "city",
  "address_line_1",
  "address_line_2",
  "items_subtotal",
  "shipping_amount",
  "total_amount",
  "shipping_carrier",
  "tracking_number",
  "shipping_note",
  "box_type",
  "shipping_size",
  "origin_prefecture",
  "destination_prefecture",
  "zone",
  "total_volume_cm3",
  "remaining_volume_cm3",
  "fill_percent",
  "total_weight_grams",
  "items_count",
  "items_summary",
  "stripe_session_id",
] as const

function parseJsonLike(value: unknown): unknown {
  if (typeof value !== "string") return value

  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return new Date(value).toISOString()
  return ""
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value

  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return ""

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : ""
}

function normalizeItems(value: unknown) {
  const parsed = parseJsonLike(value)

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed.map((item) => {
    const record = item as Record<string, unknown>

    return {
      id: typeof record.id === "string" ? record.id : "",
      productId: typeof record.productId === "string" ? record.productId : "",
      name: typeof record.name === "string" ? record.name : "",
      quantity: normalizeNumber(record.quantity),
    }
  })
}

function normalizeShippingSnapshot(value: unknown) {
  const parsed = parseJsonLike(value)

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null
  }

  const record = parsed as Record<string, unknown>

  return {
    boxType: normalizeOptionalNumber(record.boxType),
    shippingSize: normalizeOptionalNumber(record.shippingSize),
    originPrefecture:
      typeof record.originPrefecture === "string" ? record.originPrefecture : "",
    destinationPrefecture:
      typeof record.destinationPrefecture === "string"
        ? record.destinationPrefecture
        : "",
    zone: typeof record.zone === "string" ? record.zone : "",
    totalVolumeCm3: normalizeOptionalNumber(record.totalVolumeCm3),
    remainingVolumeCm3: normalizeOptionalNumber(record.remainingVolumeCm3),
    fillPercent: normalizeOptionalNumber(record.fillPercent),
    totalWeightGrams: normalizeOptionalNumber(record.totalWeightGrams),
  }
}

function getItemsSummary(items: ReturnType<typeof normalizeItems>) {
  return items
    .map(
      (item) =>
        `${item.name || item.productId || item.id || "item"} x ${item.quantity}`
    )
    .join("; ")
}

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) return ""

  const stringValue = String(value)
  const escaped = stringValue.replaceAll("\"", "\"\"")

  if (
    escaped.includes(",") ||
    escaped.includes("\"") ||
    escaped.includes("\n") ||
    escaped.includes("\r")
  ) {
    return `"${escaped}"`
  }

  return escaped
}

function mapCsvRow(order: OrderRow) {
  const items = normalizeItems(order.items)
  const shippingSnapshot = normalizeShippingSnapshot(order.shippingSnapshot)

  return [
    order.id,
    order.publicOrderNumber,
    normalizeDate(order.createdAt),
    normalizeDate(order.archivedAt),
    order.status,
    order.customerName,
    order.customerEmail,
    order.customerPostalCode,
    order.customerPrefecture,
    order.customerCity,
    order.customerAddressLine1,
    order.customerAddressLine2,
    order.itemsSubtotal,
    order.shippingAmount,
    order.totalAmount,
    order.shippingCarrier,
    order.trackingNumber,
    order.shippingNote,
    shippingSnapshot?.boxType ?? "",
    shippingSnapshot?.shippingSize ?? "",
    shippingSnapshot?.originPrefecture ?? "",
    shippingSnapshot?.destinationPrefecture ?? "",
    shippingSnapshot?.zone ?? "",
    shippingSnapshot?.totalVolumeCm3 ?? "",
    shippingSnapshot?.remainingVolumeCm3 ?? "",
    shippingSnapshot?.fillPercent ?? "",
    shippingSnapshot?.totalWeightGrams ?? "",
    items.reduce((sum, item) => sum + item.quantity, 0),
    getItemsSummary(items),
    order.stripeSessionId,
  ]
}

function getExportFilename() {
  const date = new Date().toISOString().slice(0, 10)
  return `sonyachna-archived-orders-${date}.csv`
}

export async function GET() {
  try {
    const archivedOrders = await db
      .select()
      .from(orders)
      .where(isNotNull(orders.archivedAt))
      .orderBy(desc(orders.archivedAt), desc(orders.createdAt))

    const csvRows = [
      csvColumns.map(escapeCsvValue).join(","),
      ...archivedOrders.map((order) =>
        mapCsvRow(order).map(escapeCsvValue).join(",")
      ),
    ]

    return new NextResponse(`\uFEFF${csvRows.join("\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${getExportFilename()}"`,
      },
    })
  } catch (error) {
    logger.error("Failed to export archived orders", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to export archived orders" },
      { status: 500 }
    )
  }
}
