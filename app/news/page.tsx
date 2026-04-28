import Link from 'next/link'
import { ArrowLeft, Megaphone, Sparkles, Settings, Wrench, AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'お知らせ | Tas Money',
  description: 'Tas Moneyからの最新のお知らせ・キャンペーン・メンテナンス情報。',
}

export const revalidate = 60

const CATEGORY_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  important: { label: '重要', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  info:      { label: 'お知らせ', icon: Megaphone, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  update:    { label: '更新', icon: Sparkles, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  maintenance: { label: 'メンテナンス', icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  campaign:  { label: 'キャンペーン', icon: Settings, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
}

function formatDate(d: string | null): string {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

export default async function NewsListPage() {
  const supabase = await createClient()
  const { data: notices } = await supabase
    .from('tr_notices')
    .select('id,slug,title,category,excerpt,published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-[#0e1014]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="flex items-center gap-1.5 text-[#b8bcc8] hover:text-green-400 text-sm mb-8 transition-colors">
          <ArrowLeft size={14} />トップへ戻る
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black mb-3">お知らせ</h1>
          <p className="text-sm text-[#b8bcc8]">Tas Moneyからの最新情報をお届けします</p>
        </div>

        {!notices || notices.length === 0 ? (
          <div className="card p-12 text-center text-[#6b7280] text-sm">
            お知らせはまだありません
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map(n => {
              const meta = CATEGORY_META[n.category] || CATEGORY_META.info
              const Icon = meta.icon
              return (
                <Link
                  key={n.id}
                  href={`/news/${n.slug}`}
                  className="card card-hover p-5 block"
                >
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-10 h-10 rounded-xl border ${meta.bg} flex items-center justify-center`}>
                      <Icon size={18} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 text-xs">
                        <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                        <span className="text-[#6b7280]">·</span>
                        <span className="text-[#6b7280]">{formatDate(n.published_at)}</span>
                      </div>
                      <h2 className="font-bold mb-1 leading-snug">{n.title}</h2>
                      {n.excerpt && (
                        <p className="text-sm text-[#b8bcc8] leading-relaxed line-clamp-2">{n.excerpt}</p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
