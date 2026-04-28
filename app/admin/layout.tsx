import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { Shield, Users, MessageCircle, Wallet, Activity, FileText } from 'lucide-react'

export const runtime = 'edge'

const NAV = [
  { href: '/admin', label: 'ダッシュボード', icon: Shield },
  { href: '/admin/users', label: 'ユーザー', icon: Users },
  { href: '/admin/inquiries', label: '問い合わせ', icon: MessageCircle },
  { href: '/admin/withdrawals', label: '出金', icon: Wallet },
  { href: '/admin/conversions', label: 'ASPコンバージョン', icon: Activity },
  { href: '/admin/notices', label: 'お知らせ', icon: FileText },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  return (
    <div className="min-h-screen bg-[#0e1014]">
      <header className="border-b border-[#2a2f3d] bg-[#0e1014]/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Shield size={18} className="text-green-400" />
            <span className="font-black text-sm">Tas Money 管理</span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#6b7280]">{admin.email}</span>
            <span className="px-2 py-0.5 rounded-pill bg-green-500/10 text-green-400 font-bold">{admin.role || 'admin'}</span>
            <Link href="/dashboard" className="text-[#b8bcc8] hover:text-white">ユーザー画面 →</Link>
          </div>
        </div>
        <nav className="border-t border-[#1a1d24] overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 flex gap-1">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#b8bcc8] hover:text-white hover:bg-[#1a1d24] transition-colors whitespace-nowrap"
              >
                <n.icon size={14} />
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
