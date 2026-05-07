import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Coins,
  HeartHandshake,
  Leaf,
  LineChart,
  ShieldCheck,
  Sprout,
  SunMedium,
} from 'lucide-react'
import { Header, Footer } from '@/components/layout'
import { getCharityStats } from '@/lib/charity/get-charity-stats'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonyachna.com'

export const dynamic = 'force-dynamic'


const milestones = [
  {
    amount: 10000,
    title: '小さな循環の開始',
    text: '地域の清掃・植栽・小さな支援活動を始めるための最初の土台。',
  },
  {
    amount: 50000,
    title: '見える活動へ',
    text: '活動報告を公開し、支援先・用途・写真を残せる段階へ。',
  },
  {
    amount: 100000,
    title: '継続できる仕組みへ',
    text: '一度きりではなく、毎月小さく続く支援の仕組みを整えます。',
  },
]

const plans = [
  {
    icon: Leaf,
    title: '自然を整える活動',
    text: '植栽、清掃、土や水を守る小さな行動を、積み重ねられる形で支援します。',
  },
  {
    icon: HeartHandshake,
    title: '人の生活を支える活動',
    text: '食品・衛生・生活必需品など、日常を少し守るための支援に使います。',
  },
  {
    icon: Sprout,
    title: '次の世代への投資',
    text: '教育・文化・自然体験など、未来に残る小さな機会づくりを目指します。',
  },
]

function formatYen(value: number) {
  return `¥${value.toLocaleString('ja-JP')}`
}

export const metadata: Metadata = {
  title: 'やさしい循環',
  description:
    'Sonyachnaのチャリティー活動。購入金額の5%を、自然と人の暮らしを支える活動へ。',
  openGraph: {
    title: 'やさしい循環 | Sonyachna',
    description:
      '一つの買い物から、自然と人の暮らしへ。Sonyachnaのチャリティー活動。',
    url: `${SITE_URL}/charity`,
    images: [
      {
        url: `${SITE_URL}/og/home.png`,
        width: 1200,
        height: 630,
        alt: 'やさしい循環 | Sonyachna',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'やさしい循環 | Sonyachna',
    description: '購入金額の5%を、自然と人の暮らしを支える活動へ。',
    images: [`${SITE_URL}/og/home.png`],
  },
  alternates: {
    canonical: '/charity',
  },
}

export default async function CharityPage() {
  const charityStats = await getCharityStats()
  const confirmedTotal = charityStats.confirmedTotal
  const confirmedOrders = charityStats.confirmedOrders
  const firstTarget = charityStats.firstTarget
  const donationRate = charityStats.donationRate
  const progress = charityStats.progress

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fffaf2] text-neutral-950">
        <section className="relative overflow-hidden px-6 py-16 sm:py-20 lg:px-8">
          <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[#ffe2a2]/30 blur-3xl" />
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-[#eadfce] bg-white/82 px-4 py-2 text-xs tracking-[0.22em] text-neutral-600 shadow-sm">
                  <SunMedium className="h-4 w-4 text-[#b9852b]" />
                  5% FOR GOOD
                </p>

                <h1 className="mt-6 font-serif text-4xl leading-tight tracking-tight text-neutral-950 sm:text-6xl">
                  ひとつの買い物から、
                  <br />
                  やさしい循環をつくる。
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-650 sm:text-lg">
                  Sonyachnaでは、決済が完了した注文の売上から{donationRate}%を、自然と人の暮らしを支える活動資金として積み立てます。
                  たとえ小さな金額でも、積み重なれば土を守り、生活を支え、未来の選択肢を増やす力になります。
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/shop"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-6 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
                  >
                    商品を見る
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <a
                    href="#transparency"
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#d8c5aa] bg-white px-6 text-sm font-medium text-neutral-850 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fffaf2]"
                  >
                    仕組みを見る
                  </a>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[38px] border border-[#eadfce] bg-white/90 p-6 shadow-[0_30px_90px_rgba(58,42,22,0.12)] backdrop-blur">
                <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#ffe2a2]/42 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-emerald-100/60 blur-3xl" />

                <div className="relative flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-[0.24em] text-neutral-500">CURRENT IMPACT</p>
                    <h2 className="mt-2 font-serif text-3xl tracking-tight text-neutral-950">
                      公開集計
                    </h2>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#eadfce] bg-[#fffaf2] shadow-sm">
                    <Coins className="h-6 w-6 text-[#9b6d24]" />
                  </div>
                </div>

                <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl border border-[#eadfce] bg-[#fffaf2]/78 p-4">
                    <p className="text-[11px] tracking-[0.2em] text-neutral-500">TOTAL</p>
                    <p className="mt-2 font-serif text-3xl font-semibold text-neutral-950">
                      {formatYen(confirmedTotal)}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-[#eadfce] bg-[#fffaf2]/78 p-4">
                    <p className="text-[11px] tracking-[0.2em] text-neutral-500">ORDERS</p>
                    <p className="mt-2 font-serif text-3xl font-semibold text-neutral-950">
                      {confirmedOrders}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-[#eadfce] bg-[#fffaf2]/78 p-4">
                    <p className="text-[11px] tracking-[0.2em] text-neutral-500">RATE</p>
                    <p className="mt-2 font-serif text-3xl font-semibold text-neutral-950">
                      {donationRate}%
                    </p>
                  </div>
                </div>

                <div className="relative mt-6 rounded-3xl border border-[#eadfce] bg-white/78 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs tracking-[0.22em] text-neutral-500">FIRST TARGET</p>
                      <p className="mt-1 text-sm text-neutral-600">最初の公開活動資金</p>
                    </div>
                    <p className="font-serif text-2xl font-semibold text-neutral-950">
                      {formatYen(firstTarget)}
                    </p>
                  </div>

                  <div className="mt-4 h-4 overflow-hidden rounded-full border border-[#eadfce] bg-[#fffaf2]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#d6a144_0%,#f3cf77_52%,#6f8a53_100%)] transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="mt-3 text-xs leading-6 text-neutral-500">
                    この数値は、Stripeで決済が完了した注文のみを対象に自動集計しています。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="transparency" className="border-y border-[#eadfce] bg-white px-6 py-14 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            <div className="rounded-[30px] border border-[#eadfce] bg-[#fffaf2] p-6 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-[#7c5318]" />
              <h3 className="mt-4 font-serif text-2xl text-neutral-950">購入時は見込み表示</h3>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                カートに入った商品の合計金額から、5%分の見込み寄付額を表示します。
              </p>
            </div>

            <div className="rounded-[30px] border border-[#eadfce] bg-[#fffaf2] p-6 shadow-sm">
              <LineChart className="h-5 w-5 text-[#7c5318]" />
              <h3 className="mt-4 font-serif text-2xl text-neutral-950">決済後に確定</h3>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                統計に入るのは、Stripeで決済が完了した注文だけです。未購入のカートは集計しません。
              </p>
            </div>

            <div className="rounded-[30px] border border-[#eadfce] bg-[#fffaf2] p-6 shadow-sm">
              <HeartHandshake className="h-5 w-5 text-[#7c5318]" />
              <h3 className="mt-4 font-serif text-2xl text-neutral-950">活動報告へ</h3>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                集計が動き始めた後、用途・写真・活動報告をこのページで公開していきます。
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <p className="text-xs tracking-[0.24em] text-neutral-500">FUTURE PLANS</p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight text-neutral-950 sm:text-4xl">
                何に使うのか
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
                支援は大きな言葉ではなく、小さくても実行できる活動に使います。
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {plans.map((plan) => {
                const Icon = plan.icon
                return (
                  <div
                    key={plan.title}
                    className="group relative overflow-hidden rounded-[32px] border border-[#eadfce] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(58,42,22,0.10)]"
                  >
                    <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#ffe2a2]/28 blur-3xl transition group-hover:scale-125" />
                    <Icon className="relative h-6 w-6 text-[#6f8a53]" />
                    <h3 className="relative mt-5 font-serif text-2xl text-neutral-950">{plan.title}</h3>
                    <p className="relative mt-3 text-sm leading-7 text-neutral-600">{plan.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#fff7e8] px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs tracking-[0.24em] text-neutral-500">MILESTONES</p>
                <h2 className="mt-3 font-serif text-3xl tracking-tight text-neutral-950">
                  金額ごとの行動イメージ
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-neutral-600">
                金額は目的ではありません。どの段階で何ができるかを見える形にするための目安です。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {milestones.map((milestone) => (
                <div key={milestone.amount} className="rounded-[30px] border border-[#e2cfb2] bg-white/84 p-6 shadow-sm">
                  <p className="font-serif text-3xl font-semibold text-neutral-950">{formatYen(milestone.amount)}</p>
                  <h3 className="mt-4 text-base font-semibold text-neutral-950">{milestone.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">{milestone.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
