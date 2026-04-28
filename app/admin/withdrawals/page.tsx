import { createServerClient } from '@supabase/ssr'

export const runtime = 'edge'

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

interface WithdrawalRow {
  id: string
  user_id: string
  amount: number
  method: string
  status: string
  created_at: string
}

async function getWithdrawals(): Promise<WithdrawalRow[]> {
  const supabase = adminClient()
  const { data } = await supabase
    .from('tr_withdrawals')
    .select('id,user_id,amount,method,status,created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  return (data ?? []) as WithdrawalRow[]
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400',
  processing: 'bg-blue-500/10 text-blue-400',
  completed: 'bg-green-500/10 text-green-400',
  failed: 'bg-red-500/10 text-red-400',
  cancelled: 'bg-[#0e1014] text-[#6b7280]',
}

export default async function AdminWithdrawalsPage() {
  const withdrawals = await getWithdrawals()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">出金一覧</h1>
        <span className="text-xs text-[#6b7280]">直近 {withdrawals.length} 件</span>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#0e1014] border-b border-[#1a1d24]">
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold text-[#6b7280]">申請日</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">ユーザーID</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280] text-right">金額</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">手段</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1d24]">
            {withdrawals.map(w => (
              <tr key={w.id} className="hover:bg-[#1a1d24]">
                <td className="px-3 py-2 text-[#b8bcc8]">{new Date(w.created_at).toLocaleString('ja-JP')}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-[#6b7280]">{w.user_id.slice(0,8)}…</td>
                <td className="px-3 py-2 text-right font-mono text-green-400">¥{w.amount.toLocaleString()}</td>
                <td className="px-3 py-2">{w.method}</td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-pill ${statusColors[w.status] || 'bg-[#0e1014] text-[#6b7280]'}`}>
                    {w.status}
                  </span>
                </td>
              </tr>
            ))}
            {withdrawals.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-12 text-center text-[#6b7280]">出金申請はありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
