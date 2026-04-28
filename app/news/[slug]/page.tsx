import Link from 'next/link'
import { ArrowLeft, Megaphone, Sparkles, Settings, Wrench, AlertCircle } from 'lucide-react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

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

// ごくシンプルなマークダウン -> HTML 変換（依存追加なし）
function renderMd(md: string): string {
  const escape = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
  let html = escape(md)
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-6 mb-2">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-6 mb-2">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-green-400 hover:underline" rel="noopener">$1</a>')
  // リスト
  html = html.replace(/(^- .+\n?)+/gm, m => {
    const items = m.trim().split(/\n/).map(l => `<li>${l.replace(/^- /, '')}</li>`).join('')
    return `<ul class="list-disc list-inside text-sm text-[#b8bcc8] space-y-1 my-3">${items}</ul>`
  })
  // 段落（空行区切り）
  html = html.split(/\n{2,}/).map(p => {
    if (/^<(h[1-6]|ul|ol|pre|blockquote|hr)/.test(p.trim())) return p
    return `<p class="text-sm text-[#b8bcc8] leading-relaxed my-3">${p.replace(/\n/g, '<br/>')}</p>`
  }).join('\n')
  return html
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('tr_notices')
    .select('title,excerpt')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (!data) return { title: 'お知らせ | Tas Money' }
  return {
    title: `${data.title} | Tas Money`,
    description: data.excerpt || data.title,
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: notice } = await supabase
    .from('tr_notices')
    .select('title,category,body_md,published_at')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (!notice) notFound()

  const meta = CATEGORY_META[notice.category] || CATEGORY_META.info
  const Icon = meta.icon

  return (
    <div className="min-h-screen bg-[#0e1014]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/news" className="flex items-center gap-1.5 text-[#b8bcc8] hover:text-green-400 text-sm mb-8 transition-colors">
          <ArrowLeft size={14} />お知らせ一覧へ戻る
        </Link>

        <article className="card p-6 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl border ${meta.bg} flex items-center justify-center`}>
              <Icon size={18} className={meta.color} />
            </div>
            <div>
              <div className={`text-xs font-semibold ${meta.color}`}>{meta.label}</div>
              <div className="text-xs text-[#6b7280]">{formatDate(notice.published_at)}</div>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black mb-6 leading-tight">{notice.title}</h1>

          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMd(notice.body_md) }}
          />
        </article>

        <div className="mt-8 text-center">
          <Link href="/news" className="btn-secondary inline-block">
            お知らせ一覧へ戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
