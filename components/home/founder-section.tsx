import Image from 'next/image'
import Link from 'next/link'

export function FounderSection() {
  return (
    <section className="bg-card py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
            <Image
              src="/images/founder.jpg"
              alt="Founder"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              ストーリー
            </p>
            <h2 className="mt-4 font-serif text-3xl tracking-tight md:text-4xl">
              ウクライナの味を
              <br />
              日本へ届ける想い
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              私はウクライナで生まれ育ち、日本に移住して10年になります。
              故郷の美味しい食品を日本の皆様にも知っていただきたい、
              その一心でこのショップを始めました。
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              ウクライナは肥沃な黒土に恵まれ、「ヨーロッパのパンかご」と呼ばれる農業大国です。
              特に蜂蜜やひまわり油は世界的にも高い品質を誇ります。
            </p>
            <Link
              href="/about"
              className="mt-8 inline-block border-b border-foreground pb-1 text-sm font-medium transition-colors hover:border-muted-foreground hover:text-muted-foreground"
            >
              もっと詳しく
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
