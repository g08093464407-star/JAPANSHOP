import { Leaf, Package, Shield } from 'lucide-react'

const features = [
  {
    icon: Leaf,
    title: '自然の恵み',
    description:
      'ウクライナの肥沃な黒土で育てられた、添加物を使わない自然な食品をお届けします。',
  },
  {
    icon: Shield,
    title: '品質へのこだわり',
    description:
      '現地の生産者と直接取引し、品質管理を徹底。安心してお召し上がりいただけます。',
  },
  {
    icon: Package,
    title: '丁寧なお届け',
    description:
      '商品の鮮度を保つため、適切な温度管理と丁寧な梱包で日本へお届けします。',
  },
]

export function QualitySection() {
  return (
    <section className="bg-muted py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            品質
          </p>
          <h2 className="mt-4 font-serif text-3xl tracking-tight md:text-4xl">
            私たちのこだわり
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-medium">{feature.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
