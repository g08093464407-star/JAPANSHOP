import { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'

export const metadata: Metadata = {
  title: '利用規約 | Sonyachna',
  description: 'Sonyachnaの利用規約',
}

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="text-center">
              <h1 className="font-serif text-3xl tracking-tight md:text-4xl">
                利用規約
              </h1>
            </div>

            <div className="mt-12 space-y-8 leading-relaxed text-muted-foreground">
              <section>
                <h2 className="text-lg font-medium text-foreground">第1条（適用）</h2>
                <p className="mt-3">
                  本規約は、当店が提供するサービスの利用条件を定めるものです。
                  お客様は、本規約に同意いただいた上でサービスをご利用ください。
                </p>
              </section>

              <section>
                <h2 className="text-lg font-medium text-foreground">第2条（商品の購入）</h2>
                <p className="mt-3">
                  商品のご購入は、お客様が注文を行い、当店が注文を承諾した時点で契約が成立するものとします。
                  在庫状況等により、ご注文をお断りする場合がございます。
                </p>
              </section>

              <section>
                <h2 className="text-lg font-medium text-foreground">第3条（支払い）</h2>
                <p className="mt-3">
                  商品代金のお支払いは、当店が定める方法によるものとします。
                  銀行振込の場合、ご注文後7日以内にお振込みをお願いいたします。
                  期日までにお振込みが確認できない場合、ご注文はキャンセルとなります。
                </p>
              </section>

              <section>
                <h2 className="text-lg font-medium text-foreground">第4条（配送）</h2>
                <p className="mt-3">
                  商品の配送は、当店が指定する方法によるものとします。
                  配送中の事故等による商品の破損・紛失については、当店が責任を負います。
                </p>
              </section>

              <section>
                <h2 className="text-lg font-medium text-foreground">第5条（返品・交換）</h2>
                <p className="mt-3">
                  商品の返品・交換については、配送・返品ページに定める条件に従うものとします。
                </p>
              </section>

              <section>
                <h2 className="text-lg font-medium text-foreground">第6条（禁止事項）</h2>
                <p className="mt-3">
                  お客様は、以下の行為を行ってはなりません。
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>虚偽の情報を登録する行為</li>
                  <li>当店または第三者の権利を侵害する行為</li>
                  <li>法令に違反する行為</li>
                  <li>その他、当店が不適切と判断する行為</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-medium text-foreground">第7条（免責事項）</h2>
                <p className="mt-3">
                  当店は、本サービスの提供に関して、お客様に生じた損害について、
                  当店に故意または重大な過失がある場合を除き、責任を負いません。
                </p>
              </section>

              <section>
                <h2 className="text-lg font-medium text-foreground">第8条（規約の変更）</h2>
                <p className="mt-3">
                  当店は、必要に応じて本規約を変更することがあります。
                  変更後の規約は、当サイトに掲載した時点から効力を生じるものとします。
                </p>
              </section>

              <section>
                <h2 className="text-lg font-medium text-foreground">第9条（準拠法・管轄裁判所）</h2>
                <p className="mt-3">
                  本規約の解釈には日本法が適用されます。
                  本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
