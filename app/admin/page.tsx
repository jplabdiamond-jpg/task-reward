import { createServerClient } from '@supabase/ssr'
import { Users, MessageCircle, Wallet, Activity } from 'lucide-react'
import Link from 'next/link'

export const runtime = 'edge'

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

async function getStats() {
  const supabase = adminClient()
  const [users, inquiries, withdrawals, conversions] = await Promise.all([
    supabase.from('tr_users').select('id', { count: 'exact', head: true }),
    supabase.from('tr_contact_inquiries').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('tr_withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('tr_asp_conversions').select('id', { count: 'exact', head: true }),
  ])
  return {
    users: users.count ?? 0,
    openInquiries: inquiries.count ?? 0,
    pendingWithdrawals: withdrawals.count ?? 0,
    conversions: conversions.count ?? 0,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()
  const tiles = [
    { href: '/admin/users', label: 'ユーザー総数', value: stats.users, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { href: '/admin/inquiries', label: '未対応 問合せ', value: stats.openInquiries, icon: MessageCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { href: '/admin/withdrawals', label: '保留中 出金', value: stats.pendingWithdrawals, icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { href: '/admin/conversions', label: '累計 ASP成果', value: stats.conversions, icon: Activity, color: 'text-green-400', bg: 'bg-green-500/10' },
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map(t => (
          <Link key={t.href} href={t.href} className="card card-hover p-5">
            <div className={`w-10 h-10 rounded-xl ${t.bg} flex items-center justify-center mb-3`}>
              <t.icon size={18} className={t.color} />
            </div>
            <div className="text-xs text-[#6b7280] mb-1">{t.label}</div>
            <div className="text-2xl font-black">{t.value.toLocaleString()}</div>
          </Link>
        ))}
      </div>
      <div className="card p-6">
        <h2 className="font-bold text-base mb-3">運用上の注意</h2>
        <ul className="space-y-2 text-xs text-[#b8bcc8]">
          <li>• 管理画面の操作はすべて記録対象です（tr_admin_audit_logs）</li>
          <li>• 出金承認は確定残高ベースで判定されます。残高不一致時は無理に処理しないでください</li>
          <li>• ASPコンバージョン否認時はユーザーへ通知メールを必ず送信してください</li>
        </ul>
      </div>
    </div>
  )
}
