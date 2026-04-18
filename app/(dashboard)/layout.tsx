import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileNav from '@/components/dashboard/MobileNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('tr_users')
    .select('nickname,rank,balance,level,avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-warm-white flex">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav profile={profile} />
        <main className="flex-1 p-4 md:p-6 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
