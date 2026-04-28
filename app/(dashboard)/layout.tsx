import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileNav from '@/components/dashboard/MobileNav'

export const runtime = 'edge'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('tr_users')
    .select('nickname,rank,balance,confirmed_balance,pending_balance,level,avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#0e1014] flex">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav profile={profile} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
