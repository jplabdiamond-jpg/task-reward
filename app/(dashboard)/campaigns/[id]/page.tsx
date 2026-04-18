import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MissionFlow from '@/components/mission/MissionFlow'
import { formatCurrency, getDifficultyLabel } from '@/lib/utils'
import { Clock, Star, TrendingUp, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: campaign }, { data: questions }, { data: existingMission }, { data: reviews }] =
    await Promise.all([
      supabase.from('tr_campaigns').select('*').eq('id', id).single(),
      supabase.from('tr_quiz_questions').select('*').eq('campaign_id', id).order('order_num'),
      supabase.from('tr_user_missions')
        .select('*').eq('user_id', user!.id).eq('campaign_id', id).single(),
      supabase.from('tr_campaign_reviews').select('*').eq('campaign_id', id).limit(10),
    ])

  if (!campaign) notFound()

  const avgEarn = reviews?.length
    ? reviews.reduce((s, r) => s + r.earn_score, 0) / reviews.length
    : 0
  const avgDiff = reviews?.length
    ? reviews.reduce((s, r) => s + r.difficulty_score, 0) / reviews.length
    : 0

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 md:pb-0">
      <Link href="/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-warm-gray-500 hover:text-notion-blue transition-colors">
        <ArrowLeft size={14} />案件一覧へ戻る
      </Link>

      {/* Campaign Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold leading-tight mb-2">{campaign.title}</h1>
            <p className="text-sm text-warm-gray-500 leading-relaxed">{campaign.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-bold text-notion-blue">
              {formatCurrency(campaign.reward_amount)}
            </div>
            <div className="text-xs text-warm-gray-300">報酬額</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[rgba(0,0,0,0.06)]">
          {[
            { icon: Star, label: '難易度', value: getDifficultyLabel(campaign.difficulty) },
            { icon: Clock, label: '所要時間', value: `約${campaign.estimated_time}分` },
            { icon: TrendingUp, label: 'CV率', value: `${Math.round(campaign.cv_rate * 100)}%` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center bg-warm-white rounded-xl p-3">
              <Icon size={16} className="mx-auto text-notion-blue mb-1" />
              <div className="text-xs text-warm-gray-500">{label}</div>
              <div className="text-sm font-semibold mt-0.5">{value}</div>
            </div>
          ))}
        </div>

        {/* Reviews summary */}
        {reviews && reviews.length > 0 && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-1 text-sm">
              <span className="text-yellow-400">★</span>
              <span className="font-medium">稼げる度 {avgEarn.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Shield size={12} className="text-teal" />
              <span className="font-medium">難易度 {avgDiff.toFixed(1)}</span>
            </div>
            <span className="text-xs text-warm-gray-300">{reviews.length}件のレビュー</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {campaign.tags && campaign.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {campaign.tags.map((tag: string) => (
            <span key={tag} className="badge">{tag}</span>
          ))}
        </div>
      )}

      {/* Mission Flow */}
      <MissionFlow
        campaign={campaign}
        questions={questions ?? []}
        existingMission={existingMission}
        userId={user!.id}
      />
    </div>
  )
}
