export type ResolvableAdminProduct = {
  id: string
  legacyId: string | null
  slug: string
  name: string
  image: string | null
  category?: string | null
}

export function resolveAdminProduct(
  productReference: string,
  products: ResolvableAdminProduct[]
): ResolvableAdminProduct | null {
  const reference = productReference.trim()

  if (!reference) return null

  return (
    products.find((product) => product.id === reference) ??
    products.find((product) => product.legacyId === reference) ??
    products.find((product) => product.slug === reference) ??
    null
  )
}
