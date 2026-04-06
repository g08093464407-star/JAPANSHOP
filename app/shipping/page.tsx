import { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'

export const metadata: Metadata = {
  title: '配送・返品について | Sonyachna',
  description: 'Sonyachnaの配送・返品ポリシーについてご案内します。',
}

export default function ShippingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                サポート
              </p>
              <h1 className="mt-4 font-serif text-3xl tracking-tight md:text-4xl">
                配送・返品について
              </h1>
            </div>

            <div className="mt-12 space-y-12">
              <section>
                <h2 className="text-xl font-medium">配送について</h2>
                <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    ご注文確定後、3〜5営業日以内に発送いたします。
                    発送後、追跡番号をメールにてお知らせいたします。
                  </p>
                  <p>
                    お届け日数は地域によって異なりますが、発送後2〜4日程度でお届けいたします。
                    北海道、沖縄、離島への配送は追加で1〜2日かかる場合がございます。
                  </p>
                </div>

                <h3 className="mt-6 font-medium">送料</h3>
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  <li>全国一律 500円（税込）</li>
                  <li>5,000円以上のご購入で送料無料</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-medium">返品・交換について</h2>
                <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    商品到着後7日以内であれば、未開封・未使用の商品に限り返品・交換を承ります。
                    返品をご希望の場合は、お問い合わせフォームよりご連絡ください。
                  </p>
                  <p>
                    食品のため、開封後の返品はお受けできませんのでご了承ください。
                    ただし、商品に不良があった場合は、開封後でも交換対応いたします。
                  </p>
                </div>

                <h3 className="mt-6 font-medium">返品・交換の対象外</h3>
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  <li>開封済みの商品（不良品を除く）</li>
                  <li>お客様のご都合による返品（イメージ違いなど）</li>
                  <li>商品到着後8日以上経過した商品</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-medium">返品時の送料</h2>
                <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    商品不良による返品の場合、送料は当店が負担いたします。
                    お客様のご都合による返品の場合、送料はお客様のご負担となります。
                  </p>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
