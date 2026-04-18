import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TrendingUp, Zap, Target, Gift, ChevronRight, Star } from 'lucide-react'
import { formatCurrency, getRankLabel, getRankColor, getScoreLabel, getDifficultyLabel } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: campaigns }, { data: recentRewards }, { data: todayMission }] =
    await Promise.all([
      supabase.from('tr_users').select('*').eq('id', user!.id).single(),
      supabase.from('tr_campaigns').select('*').eq('is_active', true).order('reward_amount', { ascending: false }).limit(5),
      supabase.from('tr_rewards').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('tr_daily_missions').select('*').eq('user_id', user!.id).eq('date', new Date().toISOString().split('T')[0]).single(),
    ])

  const topCampaigns = (campaigns ?? [])
    .map(c => ({ ...c, score: getScoreLabel(c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const missionsToday = todayMission?.missions_completed ?? 0
  const dailyTarget = 3

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          おかえりなさい、{profile?.nickname ?? 'ユーザー'}さん 👋
        </h1>
        <p className="text-sm text-warm-gray-500 mt-1">
          <span style={{ color: getRankColor(profile?.rank ?? 'beginner') }}>●</span>{' '}
          {getRankLabel(profile?.rank ?? 'beginner')} ランク・Lv.{profile?.level ?? 1}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '利用可能残高', value: formatCurrency(profile?.balance ?? 0), icon: '💰', color: 'text-notion-blue' },
          { label: '累計報酬', value: formatCurrency(profile?.total_earned ?? 0), icon: '📈', color: 'text-green-600' },
          { label: '連続ログイン', value: `${profile?.streak_days ?? 0}日`, icon: '🔥', color: 'text-orange-500' },
          { label: '今日の達成', value: `${missionsToday}/${dailyTarget}`, icon: '✅', color: 'text-teal' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-warm-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Daily Mission Progress */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-notion-blue" />
            <span className="font-semibold text-sm">デイリーミッション</span>
          </div>
          <span className="badge">{missionsToday}/{dailyTarget}完了</span>
        </div>
        <div className="bg-warm-white rounded-full h-2 overflow-hidden">
          <div
            className="bg-notion-blue h-2 rounded-full transition-all"
            style={{ width: `${Math.min((missionsToday / dailyTarget) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-warm-gray-500 mt-2">
          {missionsToday >= dailyTarget
            ? '🎉 本日のミッション達成！ボーナス報酬獲得'
            : `あと${dailyTarget - missionsToday}件でボーナス報酬 +¥100`}
        </p>
      </div>

      {/* AI推薦 TOP5 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-notion-blue" />
            <h2 className="font-bold">今やるべき案件 TOP5</h2>
          </div>
          <Link href="/campaigns" className="text-xs text-notion-blue hover:underline flex items-center gap-0.5">
            すべて見る <ChevronRight size={12} />
          </Link>
        </div>
        <div className="space-y-2">
          {topCampaigns.map((c, i) => (
            <Link key={c.id} href={`/campaigns/${c.id}`}>
              <div className="card p-4 flex items-center gap-3 hover:shadow-deep transition-shadow cursor-pointer">
                <div className="w-8 h-8 bg-badge-blue-bg rounded-lg flex items-center justify-center text-notion-blue font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{c.title}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-warm-gray-500">{getDifficultyLabel(c.difficulty)}</span>
                    <span className="text-xs text-warm-gray-300">•</span>
                    <span className="text-xs text-warm-gray-500">CV率 {Math.round(c.cv_rate * 100)}%</span>
                    <span className="text-xs text-warm-gray-300">•</span>
                    <span className="text-xs text-warm-gray-500">約{c.estimated_time}分</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-notion-blue">{formatCurrency(c.reward_amount)}</div>
                  <div className="text-[10px] text-warm-gray-300">スコア {c.score}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Rewards */}
      {(recentRewards ?? []).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Gift size={16} className="text-notion-blue" />
            <h2 className="font-bold">最近の報酬履歴</h2>
          </div>
          <div className="card divide-y divide-[rgba(0,0,0,0.06)]">
            {recentRewards!.map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{r.description}</div>
                  <div className="text-xs text-warm-gray-300">
                    {new Date(r.created_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
                <div className="font-bold text-green-600">+{formatCurrency(r.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdraw CTA */}
      {(profile?.balance ?? 0) >= 1000 && (
        <div className="card p-4 bg-gradient-to-r from-blue-50 to-badge-blue-bg border-notion-blue/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">出金可能です！</div>
              <div className="text-xs text-warm-gray-500 mt-0.5">残高 {formatCurrency(profile!.balance)} が出金可能</div>
            </div>
            <Link href="/withdraw" className="btn-primary text-sm px-4 py-2">
              出金する
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
