import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Coins, Gamepad2, ClipboardList, Video, Gift, TrendingUp, Trophy, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

const RANK_LABEL: Record<string, string> = {
  beginner: 'Beginner', bronze: 'Bronze', silver: 'Silver',
  gold: 'Gold', platinum: 'Platinum', diamond: 'Diamond',
}
const RANK_COLOR: Record<string, string> = {
  beginner: 'text-gray-400', bronze: 'text-orange-400',
  silver: 'text-slate-300', gold: 'text-yellow-400',
  platinum: 'text-cyan-300', diamond: 'text-purple-300',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: recentRewards }, { data: hotCampaigns }] = await Promise.all([
    supabase.from('tr_users')
      .select('nickname,rank,confirmed_balance,pending_balance,balance,total_earned,level,xp,streak_days')
      .eq('id', user!.id).single(),
    supabase.from('tr_rewards')
      .select('id,amount,description,created_at,type')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('tr_campaigns')
      .select('id,title,reward_amount,category,thumbnail_url,estimated_time')
      .eq('is_active', true)
      .order('reward_amount', { ascending: false })
      .limit(4),
  ])

  const balance = profile?.confirmed_balance ?? profile?.balance ?? 0
  const totalEarned = profile?.total_earned ?? 0

  const QUICK_ACTIONS = [
    { href: '/earn', label: 'Offerwall', icon: Gamepad2, color: 'green', desc: '高単価案件' },
    { href: '/surveys', label: 'Surveys', icon: ClipboardList, color: 'blue', desc: '安定報酬' },
    { href: '/tasks', label: 'Tasks', icon: Video, color: 'purple', desc: '動画+CTA' },
    { href: '/rewards', label: 'Rewards', icon: Gift, color: 'amber', desc: '即時交換' },
  ]

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">
          おかえり、<span className="text-green-400">{profile?.nickname ?? 'User'}</span> 👋
        </h1>
        <p className="text-[#b8bcc8] text-sm md:text-base mt-1">
          {profile?.streak_days ? `🔥 ${profile.streak_days}日連続ログイン中` : '今日も稼ごう'}
        </p>
      </div>

      {/* Balance Hero */}
      <div className="card p-6 md:p-8 bg-gradient-to-br from-green-500/10 via-amber-500/5 to-purple-500/10 border-green-500/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-[#b8bcc8] mb-1 uppercase tracking-wider">出金可能</div>
            <div className="text-4xl md:text-5xl font-black text-amber-400 count-up">
              🪙 {balance.toLocaleString()}
            </div>
            <Link href="/rewards" className="inline-block mt-3 btn-primary text-sm">
              交換する →
            </Link>
          </div>
          <div className="md:border-l md:border-[#2a2f3d] md:pl-6">
            <div className="text-xs text-[#b8bcc8] mb-1 uppercase tracking-wider">承認待ち</div>
            <div className="text-2xl font-black text-[#6b7280]">
              {(profile?.pending_balance ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-[#6b7280] mt-1">ASP承認後に確定</div>
          </div>
          <div className="md:border-l md:border-[#2a2f3d] md:pl-6">
            <div className="text-xs text-[#b8bcc8] mb-1 uppercase tracking-wider">累計獲得</div>
            <div className="text-2xl font-black text-green-400">{totalEarned.toLocaleString()}</div>
            <div className={`text-xs font-bold mt-1 ${RANK_COLOR[profile?.rank ?? 'beginner']}`}>
              {RANK_LABEL[profile?.rank ?? 'beginner']} · Lv {profile?.level ?? 1}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(a => (
          <Link key={a.href} href={a.href} className="card card-hover p-5 text-center group">
            <div className={`w-12 h-12 mx-auto mb-3 bg-${a.color}-500/10 rounded-xl flex items-center justify-center`}>
              <a.icon className={`text-${a.color}-400`} size={22} />
            </div>
            <div className="font-bold mb-0.5">{a.label}</div>
            <div className="text-xs text-[#6b7280]">{a.desc}</div>
          </Link>
        ))}
      </div>

      {/* Hot offers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp size={18} className="text-green-400" /> 高単価案件
          </h2>
          <Link href="/earn" className="text-sm text-green-400 hover:text-green-300">すべて見る →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(hotCampaigns ?? []).map((c: any) => (
            <Link key={c.id} href={`/earn/${c.id}`} className="card card-hover p-4">
              <div className="aspect-video bg-gradient-to-br from-[#252a38] to-[#1f2330] rounded-lg mb-3 flex items-center justify-center text-3xl">
                🎯
              </div>
              <div className="text-xs text-[#6b7280] mb-1">{c.category}</div>
              <div className="font-bold text-sm line-clamp-2 mb-2">{c.title}</div>
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-black inline-flex items-center gap-1">
                  <Coins size={12} /> {c.reward_amount.toLocaleString()}
                </span>
                <span className="text-xs text-[#6b7280]">{c.estimated_time}分</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent rewards */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Trophy size={18} className="text-amber-400" /> 最近の報酬
        </h2>
        <div className="card divide-y divide-[#2a2f3d]">
          {(recentRewards ?? []).length === 0 ? (
            <div className="p-6 text-center text-sm text-[#6b7280]">まだ報酬がありません</div>
          ) : (
            (recentRewards ?? []).map((r: any) => (
              <div key={r.id} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Coins className="text-green-400" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm line-clamp-1">{r.description}</div>
                  <div className="text-xs text-[#6b7280]">{new Date(r.created_at).toLocaleString('ja-JP')}</div>
                </div>
                <div className="text-amber-400 font-black">+{r.amount?.toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Referral CTA */}
      <Link href="/referral" className="card card-hover p-5 flex items-center gap-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
          <Users className="text-purple-400" size={22} />
        </div>
        <div className="flex-1">
          <div className="font-bold">友達招待で永続報酬</div>
          <div className="text-xs text-[#b8bcc8]">友達の獲得額の10%があなたに。紹介の紹介で5%</div>
        </div>
        <span className="text-purple-400">→</span>
      </Link>
    </div>
  )
}
