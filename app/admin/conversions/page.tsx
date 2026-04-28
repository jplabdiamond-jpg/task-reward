import { createServerClient } from '@supabase/ssr'

export const runtime = 'edge'

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

interface ConversionRow {
  id: string
  asp_provider: string
  asp_order_id: string
  status: string
  reward_amount_jpy: number | null
  matched_user_id: string | null
  created_at: string
}

async function getConversions(): Promise<ConversionRow[]> {
  const supabase = adminClient()
  const { data } = await supabase
    .from('tr_asp_conversions')
    .select('id,asp_provider,asp_order_id,status,reward_amount_jpy,matched_user_id,created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  return (data ?? []) as ConversionRow[]
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400',
  approved: 'bg-green-500/10 text-green-400',
  rejected: 'bg-red-500/10 text-red-400',
  cancelled: 'bg-[#0e1014] text-[#6b7280]',
}

export default async function AdminConversionsPage() {
  const conversions = await getConversions()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ASPコンバージョン一覧</h1>
        <span className="text-xs text-[#6b7280]">直近 {conversions.length} 件</span>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#0e1014] border-b border-[#1a1d24]">
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold text-[#6b7280]">受信日</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">ASP</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">注文ID</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280] text-right">報酬</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">紐付UID</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1d24]">
            {conversions.map(c => (
              <tr key={c.id} className="hover:bg-[#1a1d24]">
                <td className="px-3 py-2 text-[#b8bcc8]">{new Date(c.created_at).toLocaleString('ja-JP')}</td>
                <td className="px-3 py-2 font-mono">{c.asp_provider}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-[#6b7280]">{c.asp_order_id}</td>
                <td className="px-3 py-2 text-right font-mono text-green-400">¥{(c.reward_amount_jpy ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-[#6b7280]">{c.matched_user_id ? c.matched_user_id.slice(0,8) + '…' : <span className="text-orange-400">未紐付</span>}</td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-pill ${statusColors[c.status] || 'bg-[#0e1014] text-[#6b7280]'}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
            {conversions.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-12 text-center text-[#6b7280]">コンバージョンはありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
