import { Check } from 'lucide-react'

const trustPoints = [
  {
    title: '正規輸入品',
    description: 'すべての商品は正規の輸入手続きを経て日本に届けられています。',
  },
  {
    title: '日本語サポート',
    description: 'ご質問やご相談は日本語で対応いたします。お気軽にお問い合わせください。',
  },
  {
    title: '安心の返品保証',
    description: '商品に問題があった場合は、返品・交換に対応いたします。',
  },
  {
    title: '迅速な発送',
    description: 'ご注文確定後、3〜5営業日以内に発送いたします。',
  },
]

export function TrustSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              安心してお買い物
            </p>
            <h2 className="mt-4 font-serif text-3xl tracking-tight md:text-4xl">
              選ばれる理由
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              Sonyachnaは、ウクライナと日本の架け橋となり、
              本物の味と品質をお届けすることをお約束します。
              小さなショップだからこそできる、丁寧なサービスを心がけています。
            </p>
          </div>

          <div className="space-y-6">
            {trustPoints.map((point) => (
              <div key={point.title} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">{point.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
