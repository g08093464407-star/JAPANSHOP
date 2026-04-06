import Link from 'next/link'

const footerLinks = {
  shop: {
    title: 'ショップ',
    links: [
      { name: '商品一覧', href: '/shop' },
      { name: '新着商品', href: '/shop' },
    ],
  },
  about: {
    title: '私たちについて',
    links: [
      { name: 'ストーリー', href: '/about' },
      { name: 'お問い合わせ', href: '/contact' },
    ],
  },
  support: {
    title: 'サポート',
    links: [
      { name: 'よくある質問', href: '/faq' },
      { name: '配送・返品について', href: '/shipping' },
    ],
  },
  legal: {
    title: '法的情報',
    links: [
      { name: '特定商取引法に基づく表記', href: '/legal' },
      { name: 'プライバシーポリシー', href: '/privacy' },
      { name: '利用規約', href: '/terms' },
    ],
  },
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-sm font-medium tracking-wide text-foreground">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 md:flex-row">
          <Link href="/" className="font-serif text-xl tracking-wide">
            Sonyachna
          </Link>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Sonyachna. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
