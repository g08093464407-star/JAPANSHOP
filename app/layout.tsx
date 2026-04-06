import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP, Cormorant_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/components/cart/cart-provider'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sonyachna | ウクライナの厳選食品',
  description:
    'ウクライナの豊かな自然から届く、厳選された食品をお届けします。蜂蜜、ひまわり油、ハーブティーなど、品質にこだわった商品をご用意しています。',
  keywords: [
    'ウクライナ',
    '食品',
    '蜂蜜',
    'ひまわり油',
    '輸入食品',
    'オンラインショップ',
  ],
  authors: [{ name: 'Sonyachna' }],
}

export const viewport: Viewport = {
  themeColor: '#f8f6f3',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${cormorant.variable}`}>
      <body className="font-sans antialiased">
        <CartProvider>
          {children}
          <Analytics />
        </CartProvider>
      </body>
    </html>
  )
}
