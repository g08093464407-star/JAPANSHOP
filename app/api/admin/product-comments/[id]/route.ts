import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { productComments } from "@/lib/db/schema"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_COMMENT_LENGTH = 220

type UpdateCommentBody = {
  rating?: unknown
  comment?: unknown
  authorName?: unknown
}

function normalizeRating(value: unknown) {
  const rating = Number(value)

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null
  }

  return rating
}

function normalizeComment(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, MAX_COMMENT_LENGTH) : ""
}

function normalizeAuthorName(value: unknown) {
  const next = typeof value === "string" ? value.trim() : ""
  return next ? next.slice(0, 40) : "匿名"
}

function mapComment(row: typeof productComments.$inferSelect) {
  return {
    id: row.id,
    productId: row.productId,
    rating: row.rating,
    comment: row.comment,
    authorName: row.authorName,
    voterHash: row.voterHash,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString(),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : new Date(row.updatedAt).toISOString(),
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as UpdateCommentBody

    if (!id) {
      return NextResponse.json({ error: "Missing comment id" }, { status: 400 })
    }

    const rating = normalizeRating(body.rating)
    const comment = normalizeComment(body.comment)
    const authorName = normalizeAuthorName(body.authorName)

    if (!rating) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    if (!comment) {
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 }
      )
    }

    const updated = await db
      .update(productComments)
      .set({
        rating,
        comment,
        authorName,
        updatedAt: new Date(),
      })
      .where(eq(productComments.id, id))
      .returning()

    const updatedComment = updated[0]

    if (!updatedComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    return NextResponse.json({ comment: mapComment(updatedComment) })
  } catch (error) {
    logger.error("Failed to update product comment", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to update product comment" },
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
      return NextResponse.json({ error: "Missing comment id" }, { status: 400 })
    }

    const deleted = await db
      .delete(productComments)
      .where(eq(productComments.id, id))
      .returning()

    if (!deleted[0]) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("Failed to delete product comment", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to delete product comment" },
      { status: 500 }
    )
  }
}
