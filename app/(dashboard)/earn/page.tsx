import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Coins, Clock, Filter } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  finance: '金融',
  insurance: '保険',
  credit_card: 'クレカ',
  app: 'アプリ',
  survey: 'アンケート',
  shopping: 'ショッピング',
  education: '教育',
  other: 'その他',
}

const CATEGORY_COLORS: Record<string, string> = {
  finance: 'badge-yellow',
  insurance: 'badge-blue',
  credit_card: 'badge-purple',
  app: 'badge-green',
  survey: 'badge-blue',
  shopping: 'badge-yellow',
  education: 'badge-purple',
  other: 'badge-blue',
}

export default async function EarnPage() {
  const supabase = await createClient()
  const { data: campaigns } = await supabase
    .from('tr_campaigns')
    .select('id,title,description,category,reward_amount,difficulty,estimated_time,thumbnail_url,tags')
    .eq('is_active', true)
    .order('reward_amount', { ascending: false })

  const list = campaigns ?? []
  const totalReward = list.reduce((s: number, c: any) => s + (c.reward_amount ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Offerwall</h1>
        <p className="text-[#b8bcc8]">アプリインストール・登録・申込で報酬を獲得</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-tile">
          <div className="text-xs text-[#6b7280] mb-1">アクティブ案件</div>
          <div className="text-2xl font-black text-green-400">{list.length}</div>
        </div>
        <div className="stat-tile">
          <div className="text-xs text-[#6b7280] mb-1">最大獲得可能</div>
          <div className="text-2xl font-black text-amber-400">🪙 {totalReward.toLocaleString()}</div>
        </div>
        <div className="stat-tile">
          <div className="text-xs text-[#6b7280] mb-1">高単価案件</div>
          <div className="text-2xl font-black text-purple-400">{list.filter((c: any) => (c.reward_amount ?? 0) >= 5000).length}</div>
        </div>
        <div className="stat-tile">
          <div className="text-xs text-[#6b7280] mb-1">簡単案件</div>
          <div className="text-2xl font-black text-blue-400">{list.filter((c: any) => (c.difficulty ?? 5) <= 2).length}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        <button className="btn-secondary text-sm py-1.5 px-3 inline-flex items-center gap-1.5 whitespace-nowrap">
          <Filter size={14} /> すべて
        </button>
        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
          <button key={k} className="btn-secondary text-sm py-1.5 px-3 whitespace-nowrap">
            {v}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.length === 0 ? (
          <div className="col-span-full card p-10 text-center text-[#6b7280]">
            現在掲載中の案件はありません
          </div>
        ) : (
          list.map((c: any) => (
            <Link key={c.id} href={`/earn/${c.id}`} className="card card-hover p-5 group">
              <div className="aspect-[16/9] bg-gradient-to-br from-[#252a38] to-[#1f2330] rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                {c.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="text-4xl">🎯</div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={CATEGORY_COLORS[c.category ?? 'other']}>
                  {CATEGORY_LABELS[c.category ?? 'other']}
                </span>
                <span className="badge-blue inline-flex items-center gap-0.5">
                  <Clock size={10} /> {c.estimated_time ?? 5}分
                </span>
              </div>
              <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-green-400 transition-colors">
                {c.title}
              </h3>
              <p className="text-xs text-[#b8bcc8] line-clamp-2 mb-4 leading-relaxed">
                {c.description}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-[#2a2f3d]">
                <div className="flex items-center gap-1.5">
                  <Coins size={16} className="text-amber-400" />
                  <span className="font-black text-amber-400 text-lg">
                    {c.reward_amount?.toLocaleString() ?? 0}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#6b7280]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < (c.difficulty ?? 3) ? 'text-amber-400' : 'text-[#3a4050]'}>★</span>
                  ))}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
