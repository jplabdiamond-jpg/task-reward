import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Target, Star, Clock, TrendingUp } from 'lucide-react'
import { formatCurrency, getDifficultyLabel, getScoreLabel } from '@/lib/utils'
import type { CampaignCategory } from '@/lib/supabase/types'

const CATEGORIES: { value: CampaignCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'finance', label: '💰 金融' },
  { value: 'credit_card', label: '💳 カード' },
  { value: 'insurance', label: '🛡️ 保険' },
  { value: 'app', label: '📱 アプリ' },
  { value: 'survey', label: '📝 アンケート' },
  { value: 'education', label: '📚 教育' },
  { value: 'shopping', label: '🛒 ショッピング' },
]

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>
}) {
  const params = await searchParams
  const category = params.category ?? 'all'
  const sort = params.sort ?? 'score'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase.from('tr_campaigns').select('*').eq('is_active', true)
  if (category !== 'all') query = query.eq('category', category as CampaignCategory)

  const { data: campaigns } = await query

  // 完了済みミッションIDを取得
  const { data: completedMissions } = await supabase
    .from('tr_user_missions')
    .select('campaign_id')
    .eq('user_id', user!.id)
    .eq('status', 'reward_confirmed')

  const completedIds = new Set((completedMissions ?? []).map(m => m.campaign_id))

  const sorted = (campaigns ?? [])
    .map(c => ({ ...c, score: getScoreLabel(c), completed: completedIds.has(c.id) }))
    .sort((a, b) => {
      if (sort === 'reward') return b.reward_amount - a.reward_amount
      if (sort === 'easy') return a.difficulty - b.difficulty
      return b.score - a.score
    })

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">案件一覧</h1>
        <p className="text-sm text-warm-gray-500 mt-1">{sorted.length}件の案件が見つかりました</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <Link key={cat.value}
            href={`/campaigns?category=${cat.value}&sort=${sort}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-pill text-sm font-medium transition-colors ${
              category === cat.value
                ? 'bg-notion-blue text-white'
                : 'bg-white border border-[rgba(0,0,0,0.1)] text-warm-gray-500 hover:border-notion-blue hover:text-notion-blue'
            }`}>
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-2">
        {[
          { value: 'score', label: 'おすすめ順' },
          { value: 'reward', label: '高単価順' },
          { value: 'easy', label: '簡単順' },
        ].map(s => (
          <Link key={s.value}
            href={`/campaigns?category=${category}&sort=${s.value}`}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              sort === s.value
                ? 'bg-badge-blue-bg text-notion-blue'
                : 'text-warm-gray-500 hover:text-[rgba(0,0,0,0.95)]'
            }`}>
            {s.label}
          </Link>
        ))}
      </div>

      {/* Campaign Cards */}
      <div className="grid md:grid-cols-2 gap-3">
        {sorted.map(c => (
          <Link key={c.id} href={`/campaigns/${c.id}`}>
            <div className={`card p-4 hover:shadow-deep transition-all cursor-pointer h-full ${c.completed ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="badge text-[10px]">{CATEGORIES.find(cat => cat.value === c.category)?.label ?? c.category}</span>
                    {c.completed && <span className="badge-success text-[10px]">✓ 完了済み</span>}
                    {c.reward_amount >= 10000 && <span className="bg-orange-50 text-orange-600 text-[10px] font-semibold px-2 py-0.5 rounded-pill">高単価</span>}
                  </div>
                  <h3 className="font-semibold text-sm leading-tight">{c.title}</h3>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <div className="text-xl font-bold text-notion-blue">{formatCurrency(c.reward_amount)}</div>
                </div>
              </div>
              <p className="text-xs text-warm-gray-500 line-clamp-2 mb-3">{c.description}</p>
              <div className="flex items-center gap-3 text-xs text-warm-gray-500">
                <span className="flex items-center gap-1"><Star size={11} /> {getDifficultyLabel(c.difficulty)}</span>
                <span className="flex items-center gap-1"><Clock size={11} /> 約{c.estimated_time}分</span>
                <span className="flex items-center gap-1"><TrendingUp size={11} /> CV率{Math.round(c.cv_rate * 100)}%</span>
              </div>
              <div className="mt-3 pt-3 border-t border-[rgba(0,0,0,0.06)] flex items-center justify-between">
                <span className="text-[10px] text-warm-gray-300">AIスコア: {c.score}</span>
                <span className="text-xs font-medium text-notion-blue">
                  {c.completed ? '詳細を見る' : '今すぐ始める →'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16 text-warm-gray-300">
          <Target size={40} className="mx-auto mb-3 opacity-30" />
          <p>この条件の案件はありません</p>
        </div>
      )}
    </div>
  )
}
