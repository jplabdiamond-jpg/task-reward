'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Target, TrendingUp, Trophy, Users, Wallet, LogOut, Bell } from 'lucide-react'
import { cn, getRankLabel, getRankColor, formatCurrency } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'ダッシュボード' },
  { href: '/campaigns', icon: Target, label: '案件一覧' },
  { href: '/earnings', icon: TrendingUp, label: '収益レポート' },
  { href: '/ranking', icon: Trophy, label: 'ランキング' },
  { href: '/referral', icon: Users, label: '紹介プログラム' },
  { href: '/withdraw', icon: Wallet, label: '出金申請' },
]

interface SidebarProps {
  profile: { nickname: string; rank: string; balance: number; level: number; avatar_url: string | null } | null
}

export default function Sidebar({ profile }: SidebarProps) {
  const path = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-[rgba(0,0,0,0.1)] p-4">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 mb-6 px-2">
        <div className="w-7 h-7 bg-notion-blue rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">TR</span>
        </div>
        <span className="font-bold text-sm">TaskReward</span>
      </Link>

      {/* Profile Card */}
      {profile && (
        <div className="card p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-badge-blue-bg flex items-center justify-center text-notion-blue font-bold text-sm flex-shrink-0">
              {profile.nickname[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{profile.nickname}</div>
              <div className="text-xs flex items-center gap-1">
                <span style={{ color: getRankColor(profile.rank) }}>●</span>
                <span className="text-warm-gray-500">{getRankLabel(profile.rank)}</span>
                <span className="text-warm-gray-300">Lv.{profile.level}</span>
              </div>
            </div>
          </div>
          <div className="bg-warm-white rounded-lg p-2 text-center">
            <div className="text-xs text-warm-gray-500">利用可能残高</div>
            <div className="text-lg font-bold text-notion-blue">{formatCurrency(profile.balance)}</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              path === href || path.startsWith(href + '/')
                ? 'bg-badge-blue-bg text-notion-blue'
                : 'text-warm-gray-500 hover:bg-warm-white hover:text-[rgba(0,0,0,0.95)]'
            )}>
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <button onClick={handleLogout}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-warm-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors mt-2">
        <LogOut size={16} />
        ログアウト
      </button>
    </aside>
  )
}
