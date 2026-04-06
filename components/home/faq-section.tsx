import Link from 'next/link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { faqItems } from '@/data/products'

export function FAQSection() {
  const previewFaqs = faqItems.slice(0, 4)

  return (
    <section className="bg-card py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            FAQ
          </p>
          <h2 className="mt-4 font-serif text-3xl tracking-tight md:text-4xl">
            よくある質問
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-12">
          {previewFaqs.map((faq, index) => (
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

        <div className="mt-10 text-center">
          <Link
            href="/faq"
            className="border-b border-foreground pb-1 text-sm font-medium transition-colors hover:border-muted-foreground hover:text-muted-foreground"
          >
            すべてのFAQを見る
          </Link>
        </div>
      </div>
    </section>
  )
}
