import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { Header, Footer } from '@/components/layout'
import { Button } from '@/components/ui/button'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://sonyachna.com'

export const metadata: Metadata = {
  title: '私たちについて',
  description:
    'Sonyachnaの背景。ウクライナと日本をつなぐストーリーと食品へのこだわり',

  openGraph: {
    title: '私たちについて | Sonyachna',
    description:
      'Sonyachnaの背景。ウクライナと日本をつなぐストーリーと食品へのこだわり',
    images: [
      {
        url: `${SITE_URL}/og/about.png`,
        width: 1200,
        height: 630,
        alt: '私たちについて | Sonyachna',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: '私たちについて | Sonyachna',
    description:
      'Sonyachnaの背景。ウクライナと日本をつなぐストーリーと食品へのこだわり',
    images: [`${SITE_URL}/og/about.png`],
  },

  alternates: {
    canonical: '/about',
  },
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="py-16 text-center md:py-24">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              私たちについて
            </p>
            <h1 className="mt-4 font-serif text-3xl tracking-tight md:text-4xl lg:text-5xl">
              ウクライナと日本を
              <br />
              つなぐ架け橋
            </h1>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                <Image
                  src="/images/founder.jpg"
                  alt="Founder"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              <div className="flex flex-col justify-center">
                <h2 className="font-serif text-2xl tracking-tight md:text-3xl">
                  創業者のストーリー
                </h2>

                <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    はじめまして。Sonyachnaオーナーのオレーナです。
                    私はウクライナのキーウで生まれ育ち、2014年に日本に移住しました。
                  </p>
                  <p>
                    日本での生活を始めてから、ウクライナの美味しい食品が手に入らないことに気づきました。
                    故郷の味が恋しくなり、自分で輸入を始めたのがこのショップの始まりです。
                  </p>
                  <p>
                    「Sonyachna」はウクライナ語で「太陽の」という意味です。
                    ウクライナの広大なひまわり畑に降り注ぐ太陽の光のように、
                    温かく明るい気持ちで商品をお届けしたいという想いを込めています。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="order-2 lg:order-1">
                <h2 className="font-serif text-2xl tracking-tight md:text-3xl">
                  ウクライナという国
                </h2>

                <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    ウクライナはヨーロッパ東部に位置する国で、「ヨーロッパのパンかご」と呼ばれるほど農業が盛んです。
                  </p>
                  <p>
                    国土の大部分が肥沃な黒土で覆われ、ひまわり油や蜂蜜などで世界的に知られています。
                  </p>
                  <p>
                    私たちは、その土地の力を持った食品を日本へ届けています。
                  </p>
                </div>
              </div>

              <div className="relative order-1 aspect-[4/3] overflow-hidden rounded-lg lg:order-2">
                <Image
                  src="/images/ukraine-field.jpg"
                  alt="ウクライナのひまわり畑"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fffaf2] px-6 pb-4 pt-10 lg:px-8">
          <div className="mx-auto max-w-5xl rounded-[28px] border border-[#eadfce] bg-white/80 px-6 py-6 shadow-sm">
            <div className="grid gap-5 text-center md:grid-cols-3">
              <div>
                <p className="text-xs tracking-[0.22em] text-neutral-500">
                  QUALITY
                </p>
                <p className="mt-2 text-sm font-medium text-neutral-900">
                  品質を確認した食品だけを扱います。
                </p>
              </div>

              <div>
                <p className="text-xs tracking-[0.22em] text-neutral-500">
                  HONESTY
                </p>
                <p className="mt-2 text-sm font-medium text-neutral-900">
                  原材料・保存方法・背景を正直に伝えます。
                </p>
              </div>

              <div>
                <p className="text-xs tracking-[0.22em] text-neutral-500">
                  CULTURE
                </p>
                <p className="mt-2 text-sm font-medium text-neutral-900">
                  食を通じてウクライナの文化を届けます。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24 pt-8">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[40px] border border-[#eadfce] bg-[linear-gradient(135deg,#fff4df_0%,#fffdf8_55%,#f3eadb_100%)] p-10 text-center shadow-[0_28px_80px_rgba(58,42,22,0.10)]">
              <div className="pointer-events-none absolute inset-x-10 top-8 h-px bg-gradient-to-r from-transparent via-[#d7c4a8] to-transparent" />

              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md">
                  <BookOpen className="h-6 w-6 text-neutral-800" />
                </div>
              </div>

              <p className="mt-6 text-xs tracking-[0.28em] text-neutral-500">
                STORY EXPERIENCE
              </p>

              <h2 className="mt-4 font-serif text-3xl tracking-tight text-neutral-950 md:text-4xl">
                商品ではなく、物語から入る。
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-neutral-600">
                Sonyachnaでは、食品をただの「商品」としてではなく、
                その背景にある土地・文化・記憶として届けています。
                まずはストーリーから、その価値を体験してください。
              </p>

              <div className="mt-8">
                <Button asChild size="lg" className="group">
                  <Link href="/stories">
                    ストーリーを見る
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}