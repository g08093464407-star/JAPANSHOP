import { NextResponse } from "next/server"
import { asc, desc, lte, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { productVotes } from "@/lib/db/schema"
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
        productsWithVotes: sql<number>`count(distinct ${productVotes.productId})::int`,
      })
      .from(productVotes)

    const mostVotedRows = await db
      .select({
        productId: productVotes.productId,
        voteCount: sql<number>`count(*)::int`,
        averageRating: sql<number>`round(avg(${productVotes.rating})::numeric, 1)::float`,
        lowRatingCount: sql<number>`sum(case when ${productVotes.rating} <= 3 then 1 else 0 end)::int`,
        lastVoteAt: sql<Date>`max(${productVotes.createdAt})`,
      })
      .from(productVotes)
      .groupBy(productVotes.productId)
      .orderBy(
        desc(sql`count(*)`),
        desc(sql`max(${productVotes.createdAt})`)
      )
      .limit(10)

    const [attentionSummaryRow] = await db
      .select({
        attentionProductsCount: sql<number>`count(distinct ${productVotes.productId})::int`,
        lowRatingTotal: sql<number>`count(*)::int`,
      })
      .from(productVotes)
      .where(lte(productVotes.rating, 3))

    const attentionRows = await db
      .select({
        productId: productVotes.productId,
        voteCount: sql<number>`count(*)::int`,
        averageRating: sql<number>`round(avg(${productVotes.rating})::numeric, 1)::float`,
        lowRatingCount: sql<number>`sum(case when ${productVotes.rating} <= 3 then 1 else 0 end)::int`,
        lastLowRatingAt: sql<Date>`max(case when ${productVotes.rating} <= 3 then ${productVotes.createdAt} else null end)`,
      })
      .from(productVotes)
      .groupBy(productVotes.productId)
      .having(sql`sum(case when ${productVotes.rating} <= 3 then 1 else 0 end) > 0`)
      .orderBy(
        desc(sql`sum(case when ${productVotes.rating} <= 3 then 1 else 0 end)`),
        asc(sql`avg(${productVotes.rating})`),
        desc(sql`max(case when ${productVotes.rating} <= 3 then ${productVotes.createdAt} else null end)`)
      )
      .limit(10)

    return NextResponse.json({
      summary: {
        productsWithVotes: toNumber(summaryRow?.productsWithVotes),
        mostVotedProducts: mostVotedRows.map((row) => ({
          productId: row.productId,
          voteCount: toNumber(row.voteCount),
          averageRating:
            row.averageRating === null || row.averageRating === undefined
              ? null
              : toNumber(row.averageRating),
          lowRatingCount: toNumber(row.lowRatingCount),
          lastVoteAt: normalizeDate(row.lastVoteAt),
        })),
        attentionProductsCount: toNumber(
          attentionSummaryRow?.attentionProductsCount
        ),
        lowRatingTotal: toNumber(attentionSummaryRow?.lowRatingTotal),
        attentionProducts: attentionRows.map((row) => ({
          productId: row.productId,
          voteCount: toNumber(row.voteCount),
          averageRating:
            row.averageRating === null || row.averageRating === undefined
              ? null
              : toNumber(row.averageRating),
          lowRatingCount: toNumber(row.lowRatingCount),
          lastLowRatingAt: normalizeDate(row.lastLowRatingAt),
        })),
      },
    })
  } catch (error) {
    logger.error("Failed to fetch admin product votes summary", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to fetch product votes summary" },
      { status: 500 }
    )
  }
}
