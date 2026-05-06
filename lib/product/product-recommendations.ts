import { products } from '@/data/products'
import type { Product } from '@/types/product'

function uniqueProducts(candidates: Product[]): Product[] {
  const seen = new Set<string>()

  return candidates.filter((product) => {
    if (seen.has(product.id)) return false
    seen.add(product.id)
    return true
  })
}

function excludeCurrent(currentProduct: Product) {
  return products.filter((candidate) => candidate.id !== currentProduct.id)
}

function getComplementaryCategories(category: string) {
  if (category.includes('蜂蜜')) return ['お茶', 'お菓子', 'ドライフルーツ']
  if (category.includes('お菓子')) return ['お茶', '蜂蜜', 'ドライフルーツ']
  if (category.includes('お茶')) return ['お菓子', '蜂蜜', 'ドライフルーツ']
  if (category.includes('食用油')) return ['蜂蜜', 'ドライフルーツ', 'お茶']
  if (category.includes('ドライフルーツ')) return ['お茶', '蜂蜜', 'お菓子']

  return []
}

export function getRelatedProducts(currentProduct: Product): Product[] {
  const category = currentProduct.category ?? ''
  const complementaryCategories = getComplementaryCategories(category)
  const candidates = excludeCurrent(currentProduct)

  return uniqueProducts([
    ...candidates.filter((candidate) => candidate.category === currentProduct.category),
    ...candidates.filter((candidate) =>
      complementaryCategories.some((relatedCategory) =>
        candidate.category?.includes(relatedCategory)
      )
    ),
    ...candidates.filter((candidate) => candidate.tag === '人気商品'),
    ...candidates,
  ]).slice(0, 4)
}

export function getBestsellerProducts(currentProduct: Product): Product[] {
  const candidates = excludeCurrent(currentProduct)

  return uniqueProducts([
    ...candidates.filter((candidate) => candidate.tag === '人気商品'),
    ...candidates.filter((candidate) => candidate.stockStatus === 'limited'),
    ...candidates.filter((candidate) => candidate.category === currentProduct.category),
    ...candidates,
  ]).slice(0, 4)
}

export function getRecommendedProducts(currentProduct: Product): Product[] {
  const category = currentProduct.category ?? ''
  const complementaryCategories = getComplementaryCategories(category)
  const candidates = excludeCurrent(currentProduct)

  return uniqueProducts([
    ...candidates.filter(
      (candidate) => candidate.tag === '新商品' || candidate.stockStatus === 'limited'
    ),
    ...candidates.filter((candidate) =>
      complementaryCategories.some((relatedCategory) =>
        candidate.category?.includes(relatedCategory)
      )
    ),
    ...candidates.filter((candidate) => candidate.tag === '人気商品'),
    ...candidates,
  ]).slice(0, 4)
}
