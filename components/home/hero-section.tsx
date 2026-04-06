import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 py-24 text-center lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          ウクライナから日本へ
        </p>
        <h1 className="mt-6 font-serif text-4xl leading-tight tracking-tight md:text-5xl lg:text-6xl">
          <span className="text-balance">
            自然の恵みを、
            <br className="hidden sm:inline" />
            あなたの食卓へ
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          ウクライナの豊かな大地で育まれた、厳選された食品をお届けします。
          一つひとつ丁寧に選び抜いた、本物の味わいをご体験ください。
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="min-w-[180px]">
            <Link href="/shop">
              商品を見る
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-w-[180px]">
            <Link href="/about">私たちについて</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
