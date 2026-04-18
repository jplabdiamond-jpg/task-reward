import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, fingerprint, action } = await req.json()
    if (!userId) return NextResponse.json({ suspicious: false })

    const supabase = await createClient()
    const ip = (req.headers.get('x-forwarded-for') ?? '0.0.0.0').split(',')[0].trim()
    const ua = req.headers.get('user-agent') ?? ''

    // デバイスログ記録
    await supabase.from('tr_device_logs').insert({
      user_id: userId, ip_address: ip, device_fingerprint: fingerprint ?? '',
      user_agent: ua, action, is_suspicious: false,
    })

    // 不正チェック
    const { data: suspicious } = await supabase.rpc('detect_suspicious_activity', {
      p_user_id: userId, p_ip: ip, p_fingerprint: fingerprint ?? '',
    })

    // 同一ユーザーの24時間以内のアクション数チェック（レート制限）
    const { count: actionCount } = await supabase.from('tr_device_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('action', action)
      .gte('created_at', new Date(Date.now() - 86400000).toISOString())

    const isRateLimited = (actionCount ?? 0) > 100

    // BOT検知: 同一IPから5分以内に10回以上アクセス
    const { count: ipCount } = await supabase.from('tr_device_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', new Date(Date.now() - 300000).toISOString())
    const isBot = (ipCount ?? 0) > 10

    const result = suspicious || isRateLimited || isBot

    if (result) {
      // 不正ログを更新
      await supabase.from('tr_device_logs').update({ is_suspicious: true })
        .eq('user_id', userId).eq('action', action)
        .gte('created_at', new Date(Date.now() - 5000).toISOString())
    }

    return NextResponse.json({ suspicious: result, rateLimit: isRateLimited, bot: isBot })
  } catch (e: unknown) {
    console.error('[fraud-check]', e)
    return NextResponse.json({ suspicious: false })
  }
}
