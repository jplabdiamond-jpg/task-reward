import Link from 'next/link'
import { ArrowLeft, Mail, MessageCircle, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import ContactForm from './ContactForm'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'お問い合わせ | Tas Money',
  description: 'Tas Moneyへのお問い合わせ。ご質問・ご要望・不具合報告等を受け付けています。',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0e1014]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="flex items-center gap-1.5 text-[#b8bcc8] hover:text-green-400 text-sm mb-8 transition-colors">
          <ArrowLeft size={14} />トップへ戻る
        </Link>

        <div className="card p-6 md:p-8 mb-6">
          <h1 className="text-2xl font-bold mb-2">お問い合わせ</h1>
          <p className="text-sm text-[#b8bcc8] mb-6">
            ご質問・ご要望・不具合報告などお気軽にご連絡ください。3営業日以内にご返信いたします。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="flex items-start gap-3 p-3 bg-[#0e1014] rounded-xl">
              <Mail size={18} className="text-green-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-[#6b7280]">メール</div>
                <div className="text-xs font-semibold break-all">support@task-money.net</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[#0e1014] rounded-xl">
              <Clock size={18} className="text-blue-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-[#6b7280]">返信目安</div>
                <div className="text-xs font-semibold">3営業日以内</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[#0e1014] rounded-xl">
              <MessageCircle size={18} className="text-purple-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-[#6b7280]">先に</div>
                <Link href="/faq" className="text-xs font-semibold text-purple-400 hover:underline">
                  FAQを確認
                </Link>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </div>
    </div>
  )
}
