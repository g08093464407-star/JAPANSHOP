import { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記 | Sonyachna',
  description: '特定商取引法に基づく表記',
}

export default function LegalPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="text-center">
              <h1 className="font-serif text-3xl tracking-tight md:text-4xl">
                特定商取引法に基づく表記
              </h1>
            </div>

            <div className="mt-12">
              <dl className="divide-y divide-border">
                <div className="py-4 md:grid md:grid-cols-3 md:gap-4">
                  <dt className="font-medium">販売業者</dt>
                  <dd className="mt-1 text-muted-foreground md:col-span-2 md:mt-0">
                    Sonyachna
                  </dd>
                </div>
                <div className="py-4 md:grid md:grid-cols-3 md:gap-4">
                  <dt className="font-medium">運営責任者</dt>
                  <dd className="mt-1 text-muted-foreground md:col-span-2 md:mt-0">
                    [お名前]
                  </dd>
                </div>
                <div className="py-4 md:grid md:grid-cols-3 md:gap-4">
                  <dt className="font-medium">所在地</dt>
                  <dd className="mt-1 text-muted-foreground md:col-span-2 md:mt-0">
                    [住所を入力してください]
                  </dd>
                </div>
                <div className="py-4 md:grid md:grid-cols-3 md:gap-4">
                  <dt className="font-medium">電話番号</dt>
                  <dd className="mt-1 text-muted-foreground md:col-span-2 md:mt-0">
                    [電話番号を入力してください]
                  </dd>
                </div>
                <div className="py-4 md:grid md:grid-cols-3 md:gap-4">
                  <dt className="font-medium">メールアドレス</dt>
                  <dd className="mt-1 text-muted-foreground md:col-span-2 md:mt-0">
                    [メールアドレスを入力してください]
                  </dd>
                </div>
                <div className="py-4 md:grid md:grid-cols-3 md:gap-4">
                  <dt className="font-medium">商品代金以外の必要料金</dt>
                  <dd className="mt-1 text-muted-foreground md:col-span-2 md:mt-0">
                    送料：全国一律500円（税込）、5,000円以上のご購入で送料無料
                  </dd>
                </div>
                <div className="py-4 md:grid md:grid-cols-3 md:gap-4">
                  <dt className="font-medium">支払方法</dt>
                  <dd className="mt-1 text-muted-foreground md:col-span-2 md:mt-0">
                    クレジットカード（VISA、Mastercard、JCB、American Express）、PayPay、銀行振込
                  </dd>
                </div>
                <div className="py-4 md:grid md:grid-cols-3 md:gap-4">
                  <dt className="font-medium">支払時期</dt>
                  <dd className="mt-1 text-muted-foreground md:col-span-2 md:mt-0">
                    クレジットカード：ご注文時、銀行振込：ご注文後7日以内
                  </dd>
                </div>
                <div className="py-4 md:grid md:grid-cols-3 md:gap-4">
                  <dt className="font-medium">商品の引き渡し時期</dt>
                  <dd className="mt-1 text-muted-foreground md:col-span-2 md:mt-0">
                    ご注文確定後、3〜5営業日以内に発送いたします
                  </dd>
                </div>
                <div className="py-4 md:grid md:grid-cols-3 md:gap-4">
                  <dt className="font-medium">返品・交換について</dt>
                  <dd className="mt-1 text-muted-foreground md:col-span-2 md:mt-0">
                    商品到着後7日以内であれば、未開封・未使用の商品に限り返品・交換を承ります。
                    商品に不良があった場合は、送料当店負担にて交換いたします。
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
