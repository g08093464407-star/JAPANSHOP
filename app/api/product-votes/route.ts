import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { and, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { productVotes } from "@/lib/db/schema"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown_ip"
  )
}

function getVoterHash(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "unknown_agent"
  const ip = getClientIp(request)

  return createHash("sha256")
    .update(`${ip}:${userAgent}`)
    .digest("hex")
}

function normalizeRating(value: unknown) {
  const rating = Number(value)

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null
  }

  return rating
}

function normalizeProductId(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 120) : ""
}

function summarizeVotes(rows: { rating: number }[]) {
  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  } as Record<1 | 2 | 3 | 4 | 5, number>

  let sum = 0

  for (const row of rows) {
    const rating = Math.max(1, Math.min(5, Math.round(row.rating))) as
      | 1
      | 2
      | 3
      | 4
      | 5

    distribution[rating] += 1
    sum += rating
  }

  const total = rows.length

  return {
    average: total > 0 ? Number((sum / total).toFixed(1)) : 0,
    total,
    distribution,
  }
}

async function getSummary(productId: string) {
  const rows = await db
    .select({ rating: productVotes.rating })
    .from(productVotes)
    .where(eq(productVotes.productId, productId))

  return summarizeVotes(rows)
}

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get("productId")?.trim()

    if (!productId) {
      return NextResponse.json(
        { error: "Missing productId." },
        { status: 400 }
      )
    }

    const summary = await getSummary(productId)

    return NextResponse.json({ summary })
  } catch (error) {
    logger.error("Failed to fetch product votes", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to fetch votes." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const productId = normalizeProductId(body.productId)
    const rating = normalizeRating(body.rating)
    const voterHash = getVoterHash(request)

    if (!productId) {
      return NextResponse.json(
        { error: "Missing productId." },
        { status: 400 }
      )
    }

    if (!rating) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5." },
        { status: 400 }
      )
    }

    const existingVotes = await db
      .select()
      .from(productVotes)
      .where(
        and(
          eq(productVotes.productId, productId),
          eq(productVotes.voterHash, voterHash)
        )
      )
      .orderBy(desc(productVotes.createdAt))
      .limit(1)

    const existingVote = existingVotes[0]

    if (existingVote) {
      await db
        .update(productVotes)
        .set({
          rating,
          createdAt: new Date(),
        })
        .where(eq(productVotes.id, existingVote.id))
    } else {
      await db.insert(productVotes).values({
        productId,
        rating,
        voterHash,
      })
    }

    const summary = await getSummary(productId)

    return NextResponse.json({
      summary,
      status: existingVote ? "updated" : "created",
    })
  } catch (error) {
    logger.error("Failed to save product vote", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to save vote." },
      { status: 500 }
    )
  }
}
