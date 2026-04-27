import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: '未認証です' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body?.reward_option_id) {
      return NextResponse.json({ success: false, error: 'reward_option_id が必要です' }, { status: 400 })
    }
    const accountInfo = body.account_info ?? {}
    const accountValue = (accountInfo?.value ?? '').toString().trim()
    if (!accountValue) {
      return NextResponse.json({ success: false, error: '送付先情報を入力してください' }, { status: 400 })
    }

    // Reward optionと残高を取得
    const [{ data: option }, { data: profile }] = await Promise.all([
      supabase.from('tr_reward_options').select('*').eq('id', body.reward_option_id).single(),
      supabase.from('tr_users').select('confirmed_balance,balance,is_banned').eq('id', user.id).single(),
    ])
    if (!option || !option.is_active) {
      return NextResponse.json({ success: false, error: '指定された交換先は利用できません' }, { status: 400 })
    }
    if (profile?.is_banned) {
      return NextResponse.json({ success: false, error: 'アカウントが停止されています' }, { status: 403 })
    }

    const balance = profile?.confirmed_balance ?? profile?.balance ?? 0
    if (balance < option.cost) {
      return NextResponse.json({ success: false, error: '残高が不足しています' }, { status: 400 })
    }

    // 残高減算 + 交換レコード作成（atomic ではないが MVP で許容、後でDB関数化）
    const { data: redemption, error: insertErr } = await supabase
      .from('tr_redemptions')
      .insert({
        user_id: user.id,
        reward_option_id: option.id,
        cost: option.cost,
        payout_value: option.payout_value,
        account_info: accountInfo,
        status: 'pending',
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[redeem] insert error', insertErr)
      return NextResponse.json({ success: false, error: '交換申請の登録に失敗しました' }, { status: 500 })
    }

    // 残高減算
    const { error: balErr } = await supabase
      .from('tr_users')
      .update({ confirmed_balance: balance - option.cost })
      .eq('id', user.id)

    if (balErr) {
      console.error('[redeem] balance update error', balErr)
      // ロールバック: redemptionを cancelled にする
      await supabase
        .from('tr_redemptions')
        .update({ status: 'cancelled', failure_reason: 'balance update failed' })
        .eq('id', redemption.id)
      return NextResponse.json({ success: false, error: '残高更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { redemption_id: redemption.id, status: 'pending' },
    })
  } catch (e: any) {
    console.error('[redeem] unexpected', e)
    return NextResponse.json(
      { success: false, error: e?.message ?? 'unexpected error' },
      { status: 500 }
    )
  }
}
