import { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { faqItems } from '@/data/products'

export const metadata: Metadata = {
  title: 'よくある質問 | Sonyachna',
  description: 'Sonyachnaに関するよくある質問をご覧ください。配送、返品、支払い方法などについてお答えします。',
}

export default function FAQPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                FAQ
              </p>
              <h1 className="mt-4 font-serif text-3xl tracking-tight md:text-4xl">
                よくある質問
              </h1>
              <p className="mt-4 text-muted-foreground">
                ご不明な点がございましたら、お気軽にお問い合わせください。
              </p>
            </div>

            <Accordion type="single" collapsible className="mt-12">
              {faqItems.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
