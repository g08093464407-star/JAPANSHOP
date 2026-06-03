import { NextResponse } from "next/server"
import { desc, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { productComments } from "@/lib/db/schema"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalizeDate(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return new Date(value).toISOString()
  return new Date().toISOString()
}

function toNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

export async function GET() {
  try {
    const [summaryRow] = await db
      .select({
        productsWithComments: sql<number>`count(distinct ${productComments.productId})::int`,
      })
      .from(productComments)

    const topRows = await db
      .select({
        productId: productComments.productId,
        commentCount: sql<number>`count(*)::int`,
        averageRating: sql<number>`round(avg(${productComments.rating})::numeric, 1)::float`,
        lowRatingCount: sql<number>`sum(case when ${productComments.rating} <= 3 then 1 else 0 end)::int`,
        lastCommentAt: sql<Date>`max(${productComments.createdAt})`,
      })
      .from(productComments)
      .groupBy(productComments.productId)
      .orderBy(
        desc(sql`count(*)`),
        desc(sql`max(${productComments.createdAt})`)
      )
      .limit(10)

    return NextResponse.json({
      summary: {
        productsWithComments: toNumber(summaryRow?.productsWithComments),
        topProducts: topRows.map((row) => ({
          productId: row.productId,
          commentCount: toNumber(row.commentCount),
          averageRating:
            row.averageRating === null || row.averageRating === undefined
              ? null
              : toNumber(row.averageRating),
          lowRatingCount: toNumber(row.lowRatingCount),
          lastCommentAt: normalizeDate(row.lastCommentAt),
        })),
      },
    })
  } catch (error) {
    logger.error("Failed to fetch admin product comments summary", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to fetch product comments summary" },
      { status: 500 }
    )
  }
}
