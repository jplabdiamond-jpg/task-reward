import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MissionFlow from '@/components/mission/MissionFlow'
import { Clock, Coins, ArrowLeft, Tag } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const DIFFICULTY_LABEL = ['', '超簡単', '簡単', '普通', '難しい', '上級']

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: campaign }, { data: questions }, { data: existingMission }] =
    await Promise.all([
      supabase.from('tr_campaigns').select('*').eq('id', id).single(),
      supabase.from('tr_quiz_questions').select('*').eq('campaign_id', id).order('order_num'),
      supabase.from('tr_user_missions')
        .select('*').eq('user_id', user!.id).eq('campaign_id', id).maybeSingle(),
    ])

  if (!campaign) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link href="/earn"
        className="inline-flex items-center gap-1.5 text-sm text-[#b8bcc8] hover:text-green-400 transition-colors">
        <ArrowLeft size={14} /> Offerwallへ戻る
      </Link>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-5">
          <div className="md:w-2/5 aspect-[16/9] md:aspect-square bg-gradient-to-br from-[#252a38] to-[#1f2330] rounded-2xl overflow-hidden flex items-center justify-center text-5xl">
            {campaign.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={campaign.thumbnail_url} alt={campaign.title} className="w-full h-full object-cover" />
            ) : '🎯'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-black leading-tight mb-3">{campaign.title}</h1>
            <p className="text-sm text-[#b8bcc8] leading-relaxed mb-4">{campaign.description}</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-[#1f2330] rounded-xl p-3 text-center">
                <Coins size={16} className="mx-auto text-amber-400 mb-1" />
                <div className="text-xs text-[#6b7280]">報酬</div>
                <div className="font-black text-amber-400 text-lg">
                  {campaign.reward_amount.toLocaleString()}
                </div>
              </div>
              <div className="bg-[#1f2330] rounded-xl p-3 text-center">
                <Clock size={16} className="mx-auto text-blue-400 mb-1" />
                <div className="text-xs text-[#6b7280]">所要</div>
                <div className="font-black text-base mt-0.5">{campaign.estimated_time}分</div>
              </div>
              <div className="bg-[#1f2330] rounded-xl p-3 text-center">
                <Tag size={16} className="mx-auto text-purple-400 mb-1" />
                <div className="text-xs text-[#6b7280]">難易度</div>
                <div className="font-black text-base mt-0.5">{DIFFICULTY_LABEL[campaign.difficulty] ?? '普通'}</div>
              </div>
            </div>

            {campaign.tags && campaign.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {campaign.tags.map((tag: string) => (
                  <span key={tag} className="badge-blue">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <MissionFlow
        campaign={campaign}
        questions={questions ?? []}
        existingMission={existingMission}
        userId={user!.id}
      />
    </div>
  )
}
