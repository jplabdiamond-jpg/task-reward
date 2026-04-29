'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Gamepad2, ClipboardList, Video, Gift, Users, Trophy, LogOut } from 'lucide-react'

type Profile = {
  nickname: string | null
  rank: string | null
  balance: number | null
  confirmed_balance?: number | null
  pending_balance?: number | null
  level: number | null
  avatar_url: string | null
} | null

const NAV = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/earn', label: 'Offerwall', icon: Gamepad2 },
  { href: '/surveys', label: 'Surveys', icon: ClipboardList },
  { href: '/tasks', label: 'Tasks', icon: Video },
  { href: '/rewards', label: 'Rewards', icon: Gift },
  { href: '/referral', label: 'Referral', icon: Users },
  { href: '/ranking', label: 'Leaderboard', icon: Trophy },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const balance = profile?.confirmed_balance ?? profile?.balance ?? 0

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#171a21] border-r border-[#2a2f3d] sticky top-0 h-screen">
      <div className="px-5 py-5 border-b border-[#2a2f3d]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="Tas Money" className="w-9 h-9 rounded-xl object-cover" />
          <span className="font-black text-lg">Tas Money</span>
        </Link>
      </div>

      <div className="p-4">
        <div className="card p-4 bg-gradient-to-br from-green-500/10 to-amber-500/10 border-green-500/20">
          <div className="text-xs text-[#b8bcc8] mb-1">出金可能残高</div>
          <div className="text-2xl font-black text-amber-400">
            🪙 {balance.toLocaleString()}
          </div>
          {profile?.pending_balance ? (
            <div className="text-[11px] text-[#6b7280] mt-1">承認待ち: {profile.pending_balance.toLocaleString()}</div>
          ) : null}
          <Link href="/rewards" className="block mt-3 text-center bg-green-500 hover:bg-green-600 text-black font-bold py-2 rounded-lg text-sm transition-colors">
            交換する
          </Link>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${active ? 'nav-link-active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-[#2a2f3d]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#1f2330] mb-2">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center font-bold text-sm">
            {(profile?.nickname?.[0] ?? 'U').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{profile?.nickname ?? 'User'}</div>
            <div className="text-xs text-[#6b7280]">Lv {profile?.level ?? 1} · {profile?.rank ?? 'beginner'}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full nav-link text-[#6b7280] hover:text-red-400">
          <LogOut size={18} />
          ログアウト
        </button>
      </div>
    </aside>
  )
}
