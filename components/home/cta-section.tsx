import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
        <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
          ウクライナの味を
          <br className="sm:hidden" />
          体験してみませんか
        </h2>
        <p className="mx-auto mt-6 max-w-xl leading-relaxed text-muted-foreground">
          厳選された商品をぜひご覧ください。
          ご質問やご要望がございましたら、お気軽にお問い合わせください。
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="min-w-[180px]">
            <Link href="/shop">
              商品を見る
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-w-[180px]">
            <Link href="/contact">お問い合わせ</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
