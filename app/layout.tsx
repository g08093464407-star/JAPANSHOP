import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Noto_Sans_JP, Cormorant_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/components/cart/cart-provider'
import CartFeedback from '@/components/cart/cart-feedback'
import MiniCartDrawer from '@/components/cart/mini-cart-drawer'
import './globals.css'

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? ''

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
        {GA_MEASUREMENT_ID ? (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){window.dataLayer.push(arguments);}
                  window.gtag = gtag;
                  gtag('js', new Date());
                  gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)}, {
                    send_page_view: true
                  });
                `,
              }}
            />
          </>
        ) : null}

        <CartProvider>
          {children}
          <CartFeedback />
          <MiniCartDrawer />
          <Analytics />
        </CartProvider>
      </body>
    </html>
  )
}