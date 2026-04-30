import type { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import {
  HeroSection,
  FounderSection,
  FeaturedProducts,
  QualitySection,
  TrustSection,
  FAQSection,
  CTASection,
} from '@/components/home'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://sonyachna.com'

export const metadata: Metadata = {
  title: 'ホーム',
  description:
    'ウクライナの厳選食品を日本へ。蜂蜜・ひまわり油・ハーブティーなど、背景のある食品をお届けします。',

  openGraph: {
    title: 'Sonyachna | ウクライナの厳選食品',
    description:
      'ウクライナの厳選食品を日本へ。蜂蜜・ひまわり油・ハーブティーなど、背景のある食品をお届けします。',
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
      'ウクライナの厳選食品を日本へ。蜂蜜・ひまわり油・ハーブティーなど、背景のある食品をお届けします。',
    images: [`${SITE_URL}/og/home.png`],
  },

  alternates: {
    canonical: '/',
  },
}

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FounderSection />
        <FeaturedProducts />
        <QualitySection />
        <TrustSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}