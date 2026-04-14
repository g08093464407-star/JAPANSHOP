import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"

function buildNoStoreHeaders(extraHeaders?: Record<string, string>) {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    ...extraHeaders,
  }
}

function unauthorizedResponse(request: NextRequest, reason: string) {
  logger.warn("Admin auth failed", {
    path: request.nextUrl.pathname,
    method: request.method,
    reason,
    ip:
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown",
    userAgent: request.headers.get("user-agent") ?? "unknown",
  })

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: buildNoStoreHeaders({
      "WWW-Authenticate": 'Basic realm="Sonyachna Admin", charset="UTF-8"',
    }),
  })
}

function serverErrorResponse() {
  return new NextResponse("Admin auth is not configured.", {
    status: 500,
    headers: buildNoStoreHeaders(),
  })
}

function safeDecodeBase64(value: string) {
  try {
    return atob(value)
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const adminUsername = process.env.ADMIN_USERNAME
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminUsername || !adminPassword) {
    logger.error("Admin auth env is missing", {
      hasUsername: Boolean(adminUsername),
      hasPassword: Boolean(adminPassword),
    })

    return serverErrorResponse()
  }

  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorizedResponse(request, "missing_or_invalid_authorization_header")
  }

  const base64Credentials = authHeader.split(" ")[1]

  if (!base64Credentials) {
    return unauthorizedResponse(request, "missing_base64_credentials")
  }

  const decoded = safeDecodeBase64(base64Credentials)

  if (!decoded) {
    return unauthorizedResponse(request, "invalid_base64_credentials")
  }

  const separatorIndex = decoded.indexOf(":")

  if (separatorIndex === -1) {
    return unauthorizedResponse(request, "invalid_credentials_format")
  }

  const username = decoded.slice(0, separatorIndex)
  const password = decoded.slice(separatorIndex + 1)

  if (username !== adminUsername || password !== adminPassword) {
    return unauthorizedResponse(request, "invalid_username_or_password")
  }

  logger.info("Admin auth passed", {
    path: request.nextUrl.pathname,
    method: request.method,
  })

  const response = NextResponse.next()
  const headers = buildNoStoreHeaders()

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}