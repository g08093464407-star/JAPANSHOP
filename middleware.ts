import { NextRequest, NextResponse } from "next/server"

function unauthorizedResponse() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Sonyachna Admin", charset="UTF-8"',
    },
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
    console.error("Missing ADMIN_USERNAME or ADMIN_PASSWORD")
    return new NextResponse("Admin auth is not configured.", { status: 500 })
  }

  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorizedResponse()
  }

  const base64Credentials = authHeader.split(" ")[1]

  if (!base64Credentials) {
    return unauthorizedResponse()
  }

  const decoded = safeDecodeBase64(base64Credentials)

  if (!decoded) {
    return unauthorizedResponse()
  }

  const separatorIndex = decoded.indexOf(":")

  if (separatorIndex === -1) {
    return unauthorizedResponse()
  }

  const username = decoded.slice(0, separatorIndex)
  const password = decoded.slice(separatorIndex + 1)

  if (username !== adminUsername || password !== adminPassword) {
    return unauthorizedResponse()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}