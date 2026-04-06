import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Header, Footer } from '@/components/layout'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '私たちについて | Sonyachna',
  description: 'Sonyachnaは、ウクライナの厳選食品を日本にお届けするオンラインショップです。創業者のストーリーとウクライナへの想いをご紹介します。',
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
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

        {/* Founder Story */}
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
                    日本での生活を始めてから、ウクライナの美味しい食品が手に入らないことに
                    気づきました。故郷の味が恋しくなり、自分で輸入を始めたのがこのショップの
                    始まりです。
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

        {/* Ukraine Section */}
        <section className="bg-muted py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="order-2 lg:order-1">
                <h2 className="font-serif text-2xl tracking-tight md:text-3xl">
                  ウクライナという国
                </h2>
                <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    ウクライナはヨーロッパ東部に位置する国で、
                    「ヨーロッパのパンかご」と呼ばれるほど農業が盛んです。
                    国土の大部分が肥沃な黒土（チェルノーゼム）で覆われ、
                    小麦、ひまわり、蜂蜜などの生産で世界的に知られています。
                  </p>
                  <p>
                    特にひまわり油の生産量は世界一を誇り、
                    蜂蜜の生産量もヨーロッパで最大級です。
                    豊かな自然環境で育まれた食品は、その品質の高さで評価されています。
                  </p>
                  <p>
                    私たちは、そんなウクライナの素晴らしい食品を
                    日本の皆様にお届けしたいと考えています。
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

        {/* Values Section */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-serif text-2xl tracking-tight md:text-3xl">
                私たちの約束
              </h2>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <h3 className="text-lg font-medium">品質第一</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  現地の生産者と直接取引し、品質を徹底的に確認した商品のみを取り扱います。
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium">正直な商売</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  商品の情報を正確にお伝えし、信頼いただけるショップを目指します。
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium">文化の橋渡し</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  食を通じて、ウクライナの文化や人々の温かさをお伝えします。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-card py-24">
          <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
            <h2 className="font-serif text-2xl tracking-tight md:text-3xl">
              商品をご覧ください
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
              ウクライナの美味しい食品を、ぜひお試しください。
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/shop">
                商品一覧へ
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
