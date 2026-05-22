import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Noto_Sans, Noto_Sans_JP, Cormorant_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/components/cart/cart-provider'
import CartFeedback from '@/components/cart/cart-feedback'
import MiniCartDrawer from '@/components/cart/mini-cart-drawer'
import DonationJar from '@/components/charity/donation-jar'
import './globals.css'

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? ''

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://sonyachna.com'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const notoSansAdmin = Noto_Sans({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-admin',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'Sonyachna | ウクライナの厳選食品',
    template: '%s | Sonyachna',
  },

  description:
    'ウクライナの豊かな自然から届く厳選食品。蜂蜜・ひまわり油・ハーブティーなど、日本の食卓に新しい背景を届けます。',

  keywords: [
    'ウクライナ食品',
    '蜂蜜',
    'ひまわり油',
    '輸入食品',
    'ギフト',
  ],

  authors: [{ name: 'Sonyachna' }],

  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: SITE_URL,
    siteName: 'Sonyachna',
    title: 'Sonyachna | ウクライナの厳選食品',
    description:
      '商品ではなく、物語を届ける。ウクライナの食文化を日本へ。',
    images: [
      {
        url: `${SITE_URL}/og/home.png`,
        width: 1200,
        height: 630,
        alt: 'Sonyachna | ウクライナの厳選食品',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Sonyachna | ウクライナの厳選食品',
    description:
      'ウクライナの食文化を日本へ。ストーリーから選ぶ食品。',
    images: [`${SITE_URL}/og/home.png`],
  },

  alternates: {
    canonical: '/',
  },

  icons: {
    icon: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#f8f6f3',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${notoSansAdmin.variable} ${cormorant.variable}`}>
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
          <DonationJar />
          <MiniCartDrawer />
          <Analytics />
        </CartProvider>
      </body>
    </html>
  )
}