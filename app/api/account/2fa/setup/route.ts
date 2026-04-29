/**
 * 2FA セットアップ開始 API
 * - 新しいTOTPシークレット生成
 * - otpauth:// URI を返却（QR化用）
 * - シークレットは検証完了まで DB保存しない（フロントが setup → verify の順で送る）
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTotpSecret, buildOtpauthUri } from '@/lib/auth/totp'

export const runtime = 'edge'

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: '認証が必要です' }, { status: 401 })
    }

    const secret = generateTotpSecret()
    const otpauth = buildOtpauthUri({
      secret,
      accountName: user.email ?? user.id,
      issuer: 'Tas Money',
    })

    return NextResponse.json({ ok: true, secret, otpauth })
  } catch (e) {
    console.error('[2fa-setup] exception', e)
    return NextResponse.json({ ok: false, error: '内部エラー' }, { status: 500 })
  }
}
