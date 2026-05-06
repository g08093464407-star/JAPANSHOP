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
      className="group relative flex h-14 min-h-[56px] w-14 shrink-0 items-center justify-center self-stretch overflow-hidden rounded-l-[14px] rounded-r-2xl border border-neutral-950 bg-neutral-950 text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
      aria-label="商品をシェアする"
      title={copied ? 'コピーしました' : 'シェア'}
    >
      <span className="pointer-events-none absolute inset-y-2 left-0 w-px bg-white/20" />
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(255,255,255,0.26),transparent_54%)] opacity-0 transition duration-300 group-hover:opacity-100" />

      {copied ? (
        <Check className="relative h-[18px] w-[18px] text-white" />
      ) : (
        <Share2 className="relative h-[18px] w-[18px] text-white transition duration-300 group-hover:rotate-6 group-hover:scale-105" />
      )}

      {copied ? (
        <span className="pointer-events-none absolute -bottom-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-[#eadfce] bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-800 shadow-sm sm:block">
          コピーしました
        </span>
      ) : null}
    </button>
  )
}
