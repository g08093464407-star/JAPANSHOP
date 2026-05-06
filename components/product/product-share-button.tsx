'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Share2 } from 'lucide-react'

type ProductShareButtonProps = {
  productName: string
  productSlug: string
}

function getShareUrl(productSlug: string) {
  if (typeof window === 'undefined') {
    return `/product/${productSlug}`
  }

  return `${window.location.origin}/product/${productSlug}`
}

export default function ProductShareButton({
  productName,
  productSlug,
}: ProductShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  const shareTitle = useMemo(() => `${productName} | Sonyachna`, [productName])

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && 'share' in navigator)
  }, [])

  async function handleShare() {
    const url = getShareUrl(productSlug)

    try {
      if (canNativeShare && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: productName,
          url,
        })
        return
      }

      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1800)
      } catch {
        setCopied(false)
      }
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-[#d6b278] bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#9b6d24] hover:bg-[#fff7e8] hover:shadow-[0_12px_30px_rgba(58,42,22,0.10)]"
      aria-label="商品をシェアする"
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,161,68,0.22),transparent_58%)] opacity-0 transition duration-300 group-hover:opacity-100" />
      {copied ? (
        <Check className="relative h-3.5 w-3.5 text-[#3f6d52]" />
      ) : (
        <Share2 className="relative h-3.5 w-3.5 text-[#9b6d24] transition duration-300 group-hover:rotate-6" />
      )}
      <span className="relative">{copied ? 'コピーしました' : 'シェア'}</span>
    </button>
  )
}
