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
