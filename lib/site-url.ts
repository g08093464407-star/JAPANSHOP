export function getSiteUrl(fallback?: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (siteUrl) {
    return siteUrl.replace(/\/$/, "")
  }

  if (fallback) {
    return fallback.replace(/\/$/, "")
  }

  return "http://localhost:3000"
}

export function toAbsoluteUrl(pathOrUrl: string, siteUrl?: string) {
  if (!pathOrUrl) return ""

  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl
  }

  const base = getSiteUrl(siteUrl)

  if (pathOrUrl.startsWith("/")) {
    return `${base}${pathOrUrl}`
  }

  return `${base}/${pathOrUrl}`
}
