'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Placeholder for form submission
    setSubmitted(true)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-2xl px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                お問い合わせ
              </p>
              <h1 className="mt-4 font-serif text-3xl tracking-tight md:text-4xl">
                ご連絡ください
              </h1>
              <p className="mt-4 text-muted-foreground">
                ご質問やご要望がございましたら、お気軽にお問い合わせください。
                通常2営業日以内にご返信いたします。
              </p>
            </div>

            {submitted ? (
              <div className="mt-12 rounded-lg bg-muted p-8 text-center">
                <h2 className="text-lg font-medium">
                  お問い合わせありがとうございます
                </h2>
                <p className="mt-2 text-muted-foreground">
                  内容を確認次第、ご連絡いたします。
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-12 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">お名前</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    placeholder="山田 太郎"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="example@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">件名</Label>
                  <Input
                    id="subject"
                    type="text"
                    required
                    placeholder="商品について"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">メッセージ</Label>
                  <Textarea
                    id="message"
                    required
                    rows={6}
                    placeholder="お問い合わせ内容をご記入ください"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  送信する
                </Button>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
