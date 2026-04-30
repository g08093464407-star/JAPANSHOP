import type { Metadata } from 'next'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://sonyachna.com'

export const metadata: Metadata = {
  title: 'ストーリー',
  description:
    '商品ではなく、物語から入る。ウクライナの食文化を体験する。',

  openGraph: {
    images: [`${SITE_URL}/og/stories.png`],
  },

  twitter: {
    images: [`${SITE_URL}/og/stories.png`],
  },
}

export default function StoriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}