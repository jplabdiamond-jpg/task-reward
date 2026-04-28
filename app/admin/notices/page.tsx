import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'

export const runtime = 'edge'

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

interface NoticeRow {
  id: string
  slug: string
  title: string
  category: string | null
  is_published: boolean
  published_at: string | null
  created_at: string
}

async function getNotices(): Promise<NoticeRow[]> {
  const supabase = adminClient()
  const { data } = await supabase
    .from('tr_notices')
    .select('id,slug,title,category,is_published,published_at,created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  return (data ?? []) as NoticeRow[]
}

export default async function AdminNoticesPage() {
  const notices = await getNotices()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">お知らせ一覧</h1>
        <span className="text-xs text-[#6b7280]">直近 {notices.length} 件 / 投稿はSupabaseダッシュボードから</span>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#0e1014] border-b border-[#1a1d24]">
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold text-[#6b7280]">公開日</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">カテゴリ</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">タイトル</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">slug</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">公開</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1d24]">
            {notices.map(n => (
              <tr key={n.id} className="hover:bg-[#1a1d24]">
                <td className="px-3 py-2 text-[#b8bcc8]">{n.published_at ? new Date(n.published_at).toLocaleDateString('ja-JP') : '-'}</td>
                <td className="px-3 py-2"><span className="px-1.5 py-0.5 rounded-pill bg-[#0e1014]">{n.category || '-'}</span></td>
                <td className="px-3 py-2"><Link href={`/news/${n.slug}`} className="hover:text-green-400">{n.title}</Link></td>
                <td className="px-3 py-2 font-mono text-[10px] text-[#6b7280]">{n.slug}</td>
                <td className="px-3 py-2">
                  {n.is_published
                    ? <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-green-500/10 text-green-400">published</span>
                    : <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-[#0e1014] text-[#6b7280]">draft</span>}
                </td>
              </tr>
            ))}
            {notices.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-12 text-center text-[#6b7280]">お知らせはありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
