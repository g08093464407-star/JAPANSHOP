import { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'

export const metadata: Metadata = {
  title: 'プライバシーポリシー | Sonyachna',
  description: 'Sonyachnaのプライバシーポリシー',
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="text-center">
              <h1 className="font-serif text-3xl tracking-tight md:text-4xl">
                プライバシーポリシー
              </h1>
            </div>

            <div className="mt-12 space-y-8 leading-relaxed text-muted-foreground">
              <section>
                <h2 className="text-lg font-medium text-foreground">1. 個人情報の収集</h2>
                <p className="mt-3">
                  当店では、商品のご注文、お問い合わせの対応のために、お客様の個人情報（お名前、ご住所、電話番号、メールアドレスなど）を収集いたします。
                </p>
              </section>

              <section>
                <h2 className="text-lg font-medium text-foreground">2. 個人情報の利用目的</h2>
                <p className="mt-3">
                  収集した個人情報は、以下の目的で利用いたします。
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>商品の発送</li>
                  <li>ご注文内容の確認</li>
                  <li>お問い合わせへの対応</li>
                  <li>サービス向上のための分析</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-medium text-foreground">3. 個人情報の第三者提供</h2>
                <p className="mt-3">
                  当店は、法令に基づく場合を除き、お客様の同意なく個人情報を第三者に提供することはありません。
                  ただし、配送業者への発送情報の提供など、サービス提供に必要な範囲での委託先への提供を行う場合があります。
                </p>
              </section>

              <section>
                <h2 className="text-lg font-medium text-foreground">4. 個人情報の管理</h2>
                <p className="mt-3">
                  当店は、お客様の個人情報を適切に管理し、不正アクセス、紛失、破壊、改ざん、漏洩などを防止するために必要な措置を講じます。
                </p>
              </section>

              <section>
                <h2 className="text-lg font-medium text-foreground">5. Cookieの使用</h2>
                <p className="mt-3">
                  当サイトでは、サービス向上のためにCookieを使用する場合があります。
                  Cookieの使用を希望されない場合は、ブラウザの設定で無効にすることができます。
                </p>
              </section>

              <section>
                <h2 className="text-lg font-medium text-foreground">6. プライバシーポリシーの変更</h2>
                <p className="mt-3">
                  当店は、必要に応じてプライバシーポリシーを変更することがあります。
                  変更後のプライバシーポリシーは、当サイトに掲載した時点から効力を生じるものとします。
                </p>
              </section>

              <section>
                <h2 className="text-lg font-medium text-foreground">7. お問い合わせ</h2>
                <p className="mt-3">
                  個人情報の取り扱いに関するお問い合わせは、お問い合わせフォームよりご連絡ください。
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
