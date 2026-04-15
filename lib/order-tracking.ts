import { createHmac, timingSafeEqual } from "crypto"

function getTrackingSecret() {
  const secret = process.env.TRACKING_TOKEN_SECRET

  if (!secret) {
    throw new Error("Missing TRACKING_TOKEN_SECRET")
  }

  return secret
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function createSignature(orderId: string, email: string) {
  return createHmac("sha256", getTrackingSecret())
    .update(`${orderId}:${normalizeEmail(email)}`)
    .digest("hex")
}

function getSiteUrl() {
  const value =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"

  return value.replace(/\/+$/, "")
}

export function createTrackingToken(orderId: string, email: string) {
  return `${orderId}.${createSignature(orderId, email)}`
}

export function parseTrackingToken(token: string) {
  const trimmed = token.trim()
  const lastDotIndex = trimmed.lastIndexOf(".")

  if (lastDotIndex <= 0) {
    return null
  }

  const orderId = trimmed.slice(0, lastDotIndex)
  const signature = trimmed.slice(lastDotIndex + 1)

  if (!orderId || !signature) {
    return null
  }

  return { orderId, signature }
}

export function verifyTrackingToken(token: string, email: string) {
  const parsed = parseTrackingToken(token)

  if (!parsed) {
    return false
  }

  const expected = createSignature(parsed.orderId, email)

  const providedBuffer = Buffer.from(parsed.signature, "utf8")
  const expectedBuffer = Buffer.from(expected, "utf8")

  if (providedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(providedBuffer, expectedBuffer)
}

export function buildTrackingUrlFromToken(token: string) {
  return `${getSiteUrl()}/orders/track?token=${encodeURIComponent(token)}`
}

export function buildTrackingUrl(orderId: string, email: string) {
  return buildTrackingUrlFromToken(createTrackingToken(orderId, email))
}

export function normalizeTrackingLookupEmail(email: string) {
  return normalizeEmail(email)
}