'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Gamepad2, ClipboardList, Video, Gift } from 'lucide-react'

type Profile = {
  nickname: string | null
  balance: number | null
  confirmed_balance?: number | null
} | null

const TABS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/earn', label: 'Earn', icon: Gamepad2 },
  { href: '/surveys', label: 'Surveys', icon: ClipboardList },
  { href: '/tasks', label: 'Tasks', icon: Video },
  { href: '/rewards', label: 'Rewards', icon: Gift },
]

export default function MobileNav({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const balance = profile?.confirmed_balance ?? profile?.balance ?? 0

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-[#0e1014]/95 backdrop-blur border-b border-[#2a2f3d]">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center font-black text-black text-xs">
              TM
            </div>
            <span className="font-black">Tas Money</span>
          </Link>
          <Link href="/rewards" className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 font-bold text-sm">
            🪙 {balance.toLocaleString()}
          </Link>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#171a21]/95 backdrop-blur border-t border-[#2a2f3d]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid grid-cols-5">
          {TABS.map(t => {
            const active = pathname === t.href || pathname.startsWith(t.href + '/')
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                  active ? 'text-green-400' : 'text-[#6b7280]'
                }`}
              >
                <t.icon size={20} />
                <span className="text-[10px] font-semibold">{t.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
