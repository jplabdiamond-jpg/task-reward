import { createServerClient } from '@supabase/ssr'

export const runtime = 'edge'

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

interface UserRow {
  id: string
  email: string
  nickname: string | null
  rank: string | null
  balance: number | null
  confirmed_balance: number | null
  pending_balance: number | null
  total_earned: number | null
  is_banned: boolean | null
  ban_reason: string | null
  created_at: string
  ip_address: string | null
}

async function getUsers(): Promise<UserRow[]> {
  const supabase = adminClient()
  const { data } = await supabase
    .from('tr_users')
    .select('id,email,nickname,rank,balance,confirmed_balance,pending_balance,total_earned,is_banned,ban_reason,created_at,ip_address')
    .order('created_at', { ascending: false })
    .limit(100)
  return (data ?? []) as UserRow[]
}

export default async function AdminUsersPage() {
  const users = await getUsers()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ユーザー一覧</h1>
        <span className="text-xs text-[#6b7280]">直近 {users.length} 件</span>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#0e1014] border-b border-[#1a1d24]">
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold text-[#6b7280]">登録日</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">Email</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">ニックネーム</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">ランク</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280] text-right">確定残高</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280] text-right">未確定</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280] text-right">累計獲得</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">状態</th>
              <th className="px-3 py-2 font-semibold text-[#6b7280]">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1d24]">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-[#1a1d24]">
                <td className="px-3 py-2 text-[#b8bcc8]">{new Date(u.created_at).toLocaleDateString('ja-JP')}</td>
                <td className="px-3 py-2 break-all">{u.email}</td>
                <td className="px-3 py-2">{u.nickname || '-'}</td>
                <td className="px-3 py-2">
                  <span className="px-1.5 py-0.5 rounded-pill bg-[#0e1014] text-[#b8bcc8]">{u.rank || 'beginner'}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-green-400">¥{(u.confirmed_balance ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono text-amber-400">¥{(u.pending_balance ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono">¥{(u.total_earned ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2">
                  {u.is_banned ? (
                    <span className="px-1.5 py-0.5 rounded-pill bg-red-500/10 text-red-400" title={u.ban_reason || ''}>BAN</span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-pill bg-green-500/10 text-green-400">active</span>
                  )}
                </td>
                <td className="px-3 py-2 text-[#6b7280] font-mono text-[10px]">{u.ip_address || '-'}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-12 text-center text-[#6b7280]">ユーザーがいません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
