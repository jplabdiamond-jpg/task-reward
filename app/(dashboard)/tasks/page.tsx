import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Video, Coins, CheckCircle2, Circle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: campaigns }, { data: missions }] = await Promise.all([
    supabase.from('tr_campaigns')
      .select('id,title,description,reward_amount,estimated_time,thumbnail_url,category')
      .eq('is_active', true)
      .order('reward_amount', { ascending: false })
      .limit(20),
    supabase.from('tr_user_missions')
      .select('campaign_id,status,reward_amount,reward_confirmed_at')
      .eq('user_id', user!.id),
  ])

  const missionMap = new Map((missions ?? []).map((m: any) => [m.campaign_id, m]))
  const list = campaigns ?? []
  const completedCount = (missions ?? []).filter((m: any) => m.status === 'reward_confirmed').length
  const totalEarnedFromTasks = (missions ?? [])
    .filter((m: any) => m.status === 'reward_confirmed')
    .reduce((s: number, m: any) => s + (m.reward_amount ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Tasks</h1>
        <p className="text-[#b8bcc8]">動画視聴 → クイズ → アクションの3ステップで報酬獲得</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="stat-tile">
          <div className="text-xs text-[#6b7280] mb-1">完了タスク</div>
          <div className="text-2xl font-black text-green-400">{completedCount}</div>
        </div>
        <div className="stat-tile">
          <div className="text-xs text-[#6b7280] mb-1">タスク累計報酬</div>
          <div className="text-2xl font-black text-amber-400">🪙 {totalEarnedFromTasks.toLocaleString()}</div>
        </div>
        <div className="stat-tile col-span-2 md:col-span-1">
          <div className="text-xs text-[#6b7280] mb-1">利用可能タスク</div>
          <div className="text-2xl font-black text-purple-400">{list.length}</div>
        </div>
      </div>

      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="card p-10 text-center text-[#6b7280]">タスクがありません</div>
        ) : (
          list.map((c: any) => {
            const m: any = missionMap.get(c.id)
            const status: string = m?.status ?? 'not_started'
            const isDone = status === 'reward_confirmed'
            return (
              <Link key={c.id} href={`/earn/${c.id}`} className="card card-hover p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex-shrink-0 flex items-center justify-center">
                  <Video className="text-purple-400" size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm md:text-base mb-0.5 line-clamp-1">{c.title}</div>
                  <div className="flex items-center gap-3 text-xs text-[#6b7280]">
                    <span className="inline-flex items-center gap-1"><Clock size={11} /> {c.estimated_time}分</span>
                    <span>{c.category}</span>
                    {m && (
                      <span className={`inline-flex items-center gap-1 ${isDone ? 'text-green-400' : 'text-amber-400'}`}>
                        {isDone ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                        {isDone ? '完了' : '進行中'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="inline-flex items-center gap-1 text-amber-400 font-black text-base">
                    <Coins size={14} />
                    {c.reward_amount.toLocaleString()}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
