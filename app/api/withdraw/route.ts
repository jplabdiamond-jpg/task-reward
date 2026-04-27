import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { userId, amount, method, accountInfo } = await req.json()

    if (!userId || !amount || !method) {
      return NextResponse.json({ error: '必須パラメータ不足' }, { status: 400 })
    }
    if (amount < 1000) {
      return NextResponse.json({ error: '最低出金額は¥1,000です' }, { status: 400 })
    }

    const supabase = await createClient()

    // 残高確認: ASP承認済み (confirmed_balance) のみ出金可。pending残高は出金対象外
    const { data: user } = await supabase
      .from('tr_users')
      .select('balance,confirmed_balance,pending_balance,is_banned')
      .eq('id', userId).single()
    if (!user) return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    if (user.is_banned) return NextResponse.json({ error: 'アカウントが停止されています' }, { status: 403 })

    // 既存 balance との互換: 旧データ移行期は confirmed_balance > 0 ならそちらを優先
    const availableBalance = (user.confirmed_balance ?? 0) > 0
      ? user.confirmed_balance
      : user.balance
    if (availableBalance < amount) {
      return NextResponse.json({
        error: '出金可能残高が不足しています',
        available: availableBalance,
        pending: user.pending_balance ?? 0,
      }, { status: 400 })
    }

    // 処理中の申請が既にあるか確認
    const { count } = await supabase.from('tr_withdrawals').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).in('status', ['pending', 'processing'])
    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: '処理中の出金申請が上限に達しています' }, { status: 400 })
    }

    // 出金申請作成 & 残高減算（confirmed_balance と balance の両方を減算して整合性維持）
    const newConfirmed = Math.max(0, (user.confirmed_balance ?? 0) - amount)
    const newBalance = Math.max(0, (user.balance ?? 0) - amount)
    const [withdrawResult] = await Promise.all([
      supabase.from('tr_withdrawals').insert({
        user_id: userId, amount, method, account_info: accountInfo ?? {}, status: 'pending',
      }).select().single(),
      supabase.from('tr_users').update({
        balance: newBalance,
        confirmed_balance: newConfirmed,
      }).eq('id', userId),
    ])

    if (withdrawResult.error) throw withdrawResult.error

    // 通知作成
    await supabase.from('tr_notifications').insert({
      user_id: userId, title: '出金申請を受け付けました',
      body: `${new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)}の出金申請を受け付けました。1〜3営業日以内に処理されます。`,
      type: 'reward',
    })

    return NextResponse.json({ success: true, withdrawalId: withdrawResult.data?.id })
  } catch (e: unknown) {
    console.error('[withdraw]', e)
    return NextResponse.json({ error: '内部エラー' }, { status: 500 })
  }
}
