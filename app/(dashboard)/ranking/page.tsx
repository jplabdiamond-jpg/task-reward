import { createClient } from '@/lib/supabase/server'
import { formatCurrency, getRankLabel, getRankColor } from '@/lib/utils'
import { Trophy, Crown, Medal } from 'lucide-react'

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 全体ランキング（total_earnedで降順、is_bannedを除外）
  const { data: allUsers } = await supabase
    .from('tr_users')
    .select('id,nickname,rank,total_earned,level,avatar_url')
    .eq('is_banned', false)
    .order('total_earned', { ascending: false })
    .limit(50)

  const myRank = (allUsers ?? []).findIndex(u => u.id === user!.id) + 1

  const RankIcon = ({ pos }: { pos: number }) => {
    if (pos === 1) return <Crown size={16} className="text-yellow-500" />
    if (pos === 2) return <Medal size={16} className="text-gray-400" />
    if (pos === 3) return <Medal size={16} className="text-orange-500" />
    return <span className="text-xs text-warm-gray-300 font-bold w-4 text-center">{pos}</span>
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex items-center gap-2">
        <Trophy size={20} className="text-notion-blue" />
        <h1 className="text-2xl font-bold tracking-tight">リアルタイムランキング</h1>
      </div>

      {/* My Rank Card */}
      {myRank > 0 && (
        <div className="card p-4 border-l-4 border-notion-blue">
          <div className="text-xs text-warm-gray-500 mb-1">あなたの順位</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-notion-blue">{myRank}位</span>
              <span className="text-sm text-warm-gray-500">/ {allUsers?.length ?? 0}人中</span>
            </div>
            {myRank > 3 && (
              <span className="text-xs text-warm-gray-500">
                TOP3まであと {formatCurrency((allUsers?.[2]?.total_earned ?? 0) - ((allUsers ?? []).find(u => u.id === user!.id)?.total_earned ?? 0))}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {(allUsers ?? []).length >= 3 && (
        <div className="flex items-end gap-2 justify-center py-2">
          {/* 2位 */}
          <div className="flex-1 card p-3 text-center">
            <div className="text-lg font-bold text-gray-400 mb-1">🥈</div>
            <div className="w-10 h-10 rounded-full bg-gray-100 mx-auto flex items-center justify-center text-lg font-bold mb-1">
              {allUsers![1].nickname[0]}
            </div>
            <div className="text-xs font-semibold truncate">{allUsers![1].nickname}</div>
            <div className="text-xs text-warm-gray-500">{formatCurrency(allUsers![1].total_earned)}</div>
          </div>
          {/* 1位 */}
          <div className="flex-1 card p-3 text-center bg-gradient-to-b from-yellow-50 to-white border-yellow-200">
            <div className="text-2xl mb-1">👑</div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 mx-auto flex items-center justify-center text-xl font-bold mb-1">
              {allUsers![0].nickname[0]}
            </div>
            <div className="text-sm font-bold truncate">{allUsers![0].nickname}</div>
            <div className="text-sm font-bold text-notion-blue">{formatCurrency(allUsers![0].total_earned)}</div>
          </div>
          {/* 3位 */}
          <div className="flex-1 card p-3 text-center">
            <div className="text-lg font-bold text-orange-400 mb-1">🥉</div>
            <div className="w-10 h-10 rounded-full bg-orange-50 mx-auto flex items-center justify-center text-lg font-bold mb-1">
              {allUsers![2].nickname[0]}
            </div>
            <div className="text-xs font-semibold truncate">{allUsers![2].nickname}</div>
            <div className="text-xs text-warm-gray-500">{formatCurrency(allUsers![2].total_earned)}</div>
          </div>
        </div>
      )}

      {/* Full Ranking List */}
      <div className="card divide-y divide-[rgba(0,0,0,0.06)]">
        {(allUsers ?? []).map((u, i) => (
          <div key={u.id}
            className={`flex items-center gap-3 px-4 py-3 ${u.id === user!.id ? 'bg-badge-blue-bg' : ''}`}>
            <div className="w-5 flex-shrink-0 flex justify-center">
              <RankIcon pos={i + 1} />
            </div>
            <div className="w-8 h-8 rounded-full bg-warm-white flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ borderColor: getRankColor(u.rank), border: '2px solid' }}>
              {u.nickname[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">{u.nickname}</span>
                {u.id === user!.id && <span className="badge text-[9px] px-1.5">あなた</span>}
              </div>
              <div className="text-xs text-warm-gray-500">
                <span style={{ color: getRankColor(u.rank) }}>●</span>{' '}
                {getRankLabel(u.rank)} Lv.{u.level}
              </div>
            </div>
            <div className="text-sm font-bold flex-shrink-0">{formatCurrency(u.total_earned)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
