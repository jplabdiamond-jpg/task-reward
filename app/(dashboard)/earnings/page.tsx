import { createClient } from '@/lib/supabase/server'
import { formatCurrency, calcHourlyRate } from '@/lib/utils'
import { TrendingUp, Calendar, Clock, Award } from 'lucide-react'

export default async function EarningsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: rewards }, { data: missions }] = await Promise.all([
    supabase.from('tr_users').select('total_earned,balance,rank,level').eq('id', user!.id).single(),
    supabase.from('tr_rewards').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('tr_user_missions').select('*').eq('user_id', user!.id).eq('status', 'reward_confirmed'),
  ])

  // 日別集計
  const dailyMap: Record<string, number> = {}
  ;(rewards ?? []).forEach(r => {
    const d = r.created_at.split('T')[0]
    dailyMap[d] = (dailyMap[d] ?? 0) + r.amount
  })
  const dailyData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14) // 直近14日

  // 月別集計
  const monthMap: Record<string, number> = {}
  ;(rewards ?? []).forEach(r => {
    const m = r.created_at.slice(0, 7)
    monthMap[m] = (monthMap[m] ?? 0) + r.amount
  })
  const monthData = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-6)

  // 今月
  const thisMonth = new Date().toISOString().slice(0, 7)
  const thisMonthEarned = monthMap[thisMonth] ?? 0

  // 時給換算（全ミッション合計時間）
  const totalMinutes = (missions ?? []).reduce((s, m) => s + (m.video_watch_duration ?? 0) / 60, 0)
  const hourlyRate = calcHourlyRate(profile?.total_earned ?? 0, totalMinutes)

  // 案件別ランキング
  const campaignEarnings: Record<string, number> = {}
  ;(rewards ?? []).forEach(r => {
    if (r.mission_id && r.type === 'mission') {
      campaignEarnings[r.description] = (campaignEarnings[r.description] ?? 0) + r.amount
    }
  })
  const topCampaigns = Object.entries(campaignEarnings)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const maxDaily = Math.max(...dailyData.map(([, v]) => v), 1)

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h1 className="text-2xl font-bold tracking-tight">収益レポート</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: '💰', label: '累計報酬', value: formatCurrency(profile?.total_earned ?? 0), color: 'text-notion-blue' },
          { icon: '📅', label: '今月の報酬', value: formatCurrency(thisMonthEarned), color: 'text-green-600' },
          { icon: '⚡', label: '時給換算', value: formatCurrency(hourlyRate) + '/h', color: 'text-teal' },
          { icon: '✅', label: '完了案件数', value: `${missions?.length ?? 0}件`, color: 'text-warm-gray-500' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-warm-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Daily Bar Chart */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-notion-blue" />
          <h2 className="font-bold">日別収益（直近14日）</h2>
        </div>
        {dailyData.length === 0 ? (
          <p className="text-sm text-warm-gray-300 text-center py-8">まだ収益データがありません</p>
        ) : (
          <div className="flex items-end gap-1.5 h-32">
            {dailyData.map(([date, amount]) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div
                  className="w-full bg-notion-blue rounded-t-sm transition-all hover:bg-notion-blue-active"
                  style={{ height: `${Math.max((amount / maxDaily) * 100, 4)}%` }}
                  title={`${date}: ${formatCurrency(amount)}`}
                />
                <span className="text-[9px] text-warm-gray-300 truncate w-full text-center">
                  {date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Trend */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-notion-blue" />
          <h2 className="font-bold">月別収益</h2>
        </div>
        {monthData.length === 0 ? (
          <p className="text-sm text-warm-gray-300 text-center py-6">データなし</p>
        ) : (
          <div className="space-y-2">
            {monthData.reverse().map(([month, amount]) => {
              const maxMonth = Math.max(...monthData.map(([, v]) => v), 1)
              return (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-xs text-warm-gray-500 w-16 flex-shrink-0">{month}</span>
                  <div className="flex-1 bg-warm-white rounded-full h-2 overflow-hidden">
                    <div className="bg-notion-blue h-2 rounded-full transition-all"
                      style={{ width: `${(amount / maxMonth) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold w-20 text-right">{formatCurrency(amount)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Top Campaigns */}
      {topCampaigns.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={16} className="text-notion-blue" />
            <h2 className="font-bold">案件別収益ランキング</h2>
          </div>
          <div className="space-y-2">
            {topCampaigns.map(([title, amount], i) => (
              <div key={title} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'
                }`}>{i + 1}</span>
                <span className="flex-1 text-sm truncate">{title}</span>
                <span className="font-bold text-sm">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent History */}
      <div className="card">
        <div className="p-4 border-b border-[rgba(0,0,0,0.06)]">
          <h2 className="font-bold">収益履歴</h2>
        </div>
        {(rewards ?? []).length === 0 ? (
          <p className="text-sm text-warm-gray-300 text-center py-8">まだ収益がありません</p>
        ) : (
          <div className="divide-y divide-[rgba(0,0,0,0.06)]">
            {(rewards ?? []).map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{r.description}</div>
                  <div className="text-xs text-warm-gray-300">
                    {new Date(r.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-sm font-bold text-green-600">+{formatCurrency(r.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
