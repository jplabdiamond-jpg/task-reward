import { createClient } from '@/lib/supabase/server'
import { ClipboardList, Clock, Coins, Target } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SurveysPage() {
  const supabase = await createClient()
  const { data: surveys } = await supabase
    .from('tr_surveys')
    .select('id,title,description,reward_amount,estimated_minutes,loi,ir,category')
    .eq('is_active', true)
    .order('reward_amount', { ascending: false })

  const list = surveys ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Surveys</h1>
        <p className="text-[#b8bcc8]">アンケートに回答して安定報酬を獲得</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="stat-tile">
          <div className="text-xs text-[#6b7280] mb-1">利用可能アンケート</div>
          <div className="text-2xl font-black text-blue-400">{list.length}</div>
        </div>
        <div className="stat-tile">
          <div className="text-xs text-[#6b7280] mb-1">合計報酬上限</div>
          <div className="text-2xl font-black text-amber-400">🪙 {list.reduce((s: number, x: any) => s + x.reward_amount, 0).toLocaleString()}</div>
        </div>
        <div className="stat-tile col-span-2 md:col-span-1">
          <div className="text-xs text-[#6b7280] mb-1">平均所要時間</div>
          <div className="text-2xl font-black text-purple-400">
            {list.length ? Math.round(list.reduce((s: number, x: any) => s + x.estimated_minutes, 0) / list.length) : 0}分
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.length === 0 ? (
          <div className="col-span-full card p-10 text-center text-[#6b7280]">
            利用可能なアンケートがありません
          </div>
        ) : (
          list.map((s: any) => (
            <div key={s.id} className="card card-hover p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={20} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base leading-snug line-clamp-2">{s.title}</h3>
                  <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">{s.category}</span>
                </div>
              </div>
              <p className="text-xs text-[#b8bcc8] mb-4 line-clamp-2">{s.description}</p>
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                <div className="bg-[#1f2330] rounded-lg p-2 text-center">
                  <Clock size={12} className="mx-auto text-blue-400 mb-0.5" />
                  <div className="text-[10px] text-[#6b7280]">所要</div>
                  <div className="text-xs font-bold">{s.estimated_minutes}分</div>
                </div>
                <div className="bg-[#1f2330] rounded-lg p-2 text-center">
                  <Target size={12} className="mx-auto text-purple-400 mb-0.5" />
                  <div className="text-[10px] text-[#6b7280]">通過率</div>
                  <div className="text-xs font-bold">{s.ir ?? '-'}%</div>
                </div>
                <div className="bg-[#1f2330] rounded-lg p-2 text-center">
                  <Coins size={12} className="mx-auto text-amber-400 mb-0.5" />
                  <div className="text-[10px] text-[#6b7280]">報酬</div>
                  <div className="text-xs font-black text-amber-400">{s.reward_amount}</div>
                </div>
              </div>
              <button className="btn-primary w-full text-sm py-2">回答を始める</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
