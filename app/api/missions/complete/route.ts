import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, campaignId, trackingId, fingerprint } = await req.json()
    if (!userId || !campaignId) {
      return NextResponse.json({ error: '必須パラメータ不足' }, { status: 400 })
    }

    const supabase = await createClient()

    // ミッション確認
    const { data: mission } = await supabase
      .from('tr_user_missions').select('*')
      .eq('user_id', userId).eq('campaign_id', campaignId).single()
    if (!mission) return NextResponse.json({ error: 'ミッションが見つかりません' }, { status: 404 })
    if (mission.status === 'reward_confirmed') {
      return NextResponse.json({ error: '既に完了済みです' }, { status: 400 })
    }
    if (!['quiz_passed', 'cv_completed'].includes(mission.status)) {
      return NextResponse.json({ error: '前のステップが未完了です' }, { status: 400 })
    }

    // 案件確認
    const { data: campaign } = await supabase
      .from('tr_campaigns').select('reward_amount,total_completions,daily_limit')
      .eq('id', campaignId).single()
    if (!campaign) return NextResponse.json({ error: '案件が見つかりません' }, { status: 404 })

    // デイリーリミットチェック
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('tr_user_missions').select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId).eq('status', 'reward_confirmed')
      .gte('reward_confirmed_at', today)
    if ((count ?? 0) >= campaign.daily_limit) {
      return NextResponse.json({ error: '本日の上限に達しました' }, { status: 429 })
    }

    // 不正チェック
    const ip = (req.headers.get('x-forwarded-for') ?? '0.0.0.0').split(',')[0].trim()
    const { data: suspicious } = await supabase.rpc('detect_suspicious_activity', {
      p_user_id: userId, p_ip: ip, p_fingerprint: fingerprint ?? '',
    })
    if (suspicious) {
      await supabase.from('tr_device_logs').insert({
        user_id: userId, ip_address: ip,
        device_fingerprint: fingerprint ?? '',
        user_agent: req.headers.get('user-agent') ?? '',
        action: 'suspicious_reward_claim', is_suspicious: true,
      })
      return NextResponse.json({ error: '不正行為が検出されました' }, { status: 403 })
    }

    const reward = campaign.reward_amount

    // ミッション確定
    await supabase.from('tr_user_missions').update({
      status: 'reward_confirmed',
      reward_amount: reward,
      reward_confirmed_at: new Date().toISOString(),
      cv_tracking_id: trackingId,
    }).eq('id', mission.id)

    // 報酬履歴
    await supabase.from('tr_rewards').insert({
      user_id: userId,
      mission_id: mission.id,
      type: 'mission',
      amount: reward,
      description: 'ミッション完了報酬',
    })

    // 残高更新
    const { data: u } = await supabase
      .from('tr_users').select('balance,total_earned').eq('id', userId).single()
    await supabase.from('tr_users').update({
      balance: (u?.balance ?? 0) + reward,
      total_earned: (u?.total_earned ?? 0) + reward,
    }).eq('id', userId)

    // ランクアップ確認
    await supabase.rpc('check_and_update_rank', { p_user_id: userId })

    // 案件完了数++
    await supabase.from('tr_campaigns')
      .update({ total_completions: campaign.total_completions + 1 })
      .eq('id', campaignId)

    // リファラルボーナス（1段階目 10%）
    const { data: ref1 } = await supabase.from('tr_referrals')
      .select('referrer_id').eq('referee_id', userId).eq('level', 1).single()
    if (ref1) {
      const bonus1 = Math.floor(reward * 0.1)
      const { data: refUser1 } = await supabase
        .from('tr_users').select('balance,total_earned').eq('id', ref1.referrer_id).single()
      await Promise.all([
        supabase.from('tr_users').update({
          balance: (refUser1?.balance ?? 0) + bonus1,
          total_earned: (refUser1?.total_earned ?? 0) + bonus1,
        }).eq('id', ref1.referrer_id),
        supabase.from('tr_rewards').insert({
          user_id: ref1.referrer_id, type: 'referral',
          amount: bonus1, description: '紹介ボーナス（1段階目）',
        }),
        supabase.from('tr_referrals').update({
          bonus_amount: bonus1, paid_at: new Date().toISOString(),
        }).eq('referrer_id', ref1.referrer_id).eq('referee_id', userId),
      ])

      // 2段階目 5%
      const { data: ref2 } = await supabase.from('tr_referrals')
        .select('referrer_id').eq('referee_id', ref1.referrer_id).eq('level', 1).single()
      if (ref2) {
        const bonus2 = Math.floor(reward * 0.05)
        const { data: refUser2 } = await supabase
          .from('tr_users').select('balance,total_earned').eq('id', ref2.referrer_id).single()
        await Promise.all([
          supabase.from('tr_users').update({
            balance: (refUser2?.balance ?? 0) + bonus2,
            total_earned: (refUser2?.total_earned ?? 0) + bonus2,
          }).eq('id', ref2.referrer_id),
          supabase.from('tr_rewards').insert({
            user_id: ref2.referrer_id, type: 'referral',
            amount: bonus2, description: '紹介ボーナス（2段階目）',
          }),
        ])
      }
    }

    // 通知
    await supabase.from('tr_notifications').insert({
      user_id: userId,
      title: '🎉 報酬が付与されました',
      body: `ミッション完了報酬 ${new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(reward)} が付与されました`,
      type: 'reward',
    })

    return NextResponse.json({ success: true, rewardAmount: reward })
  } catch (e: unknown) {
    console.error('[missions/complete]', e)
    return NextResponse.json({ error: '内部エラーが発生しました' }, { status: 500 })
  }
}
