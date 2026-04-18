'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Target, TrendingUp, Trophy, Wallet, LogOut } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'ホーム' },
  { href: '/campaigns', icon: Target, label: '案件' },
  { href: '/earnings', icon: TrendingUp, label: '収益' },
  { href: '/ranking', icon: Trophy, label: 'ランキング' },
  { href: '/withdraw', icon: Wallet, label: '出金' },
]

interface MobileNavProps {
  profile: { nickname: string; balance: number } | null
}

export default function MobileNav({ profile }: MobileNavProps) {
  const path = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* Top header (mobile only) */}
      <header className="md:hidden bg-white border-b border-[rgba(0,0,0,0.1)] px-4 h-12 flex items-center justify-between sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-notion-blue rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">TR</span>
          </div>
          <span className="font-bold text-sm">TaskReward</span>
        </Link>
        {profile && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-notion-blue">{formatCurrency(profile.balance)}</span>
            <button onClick={handleLogout} className="p-1.5 text-warm-gray-300 hover:text-red-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </header>

      {/* Bottom nav (mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[rgba(0,0,0,0.1)] z-40 flex">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors',
              path === href || path.startsWith(href + '/')
                ? 'text-notion-blue'
                : 'text-warm-gray-300'
            )}>
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}
