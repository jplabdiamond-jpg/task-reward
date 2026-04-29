/**
 * 2FA 無効化 API
 *   - 現在のTOTPコードで本人確認後にシークレットをクリア
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@/lib/supabase/server'
import { verifyTotpCode } from '@/lib/auth/totp'
import { writeUserAuditLog, extractRequestMeta } from '@/lib/audit/log'

export const runtime = 'edge'

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: '認証が必要です' }, { status: 401 })
    }
    const { code } = (await req.json()) as { code?: string }
    const c = String(code ?? '').trim()
    if (!c) return NextResponse.json({ ok: false, error: 'コードが未入力です' }, { status: 400 })

    const admin = adminClient()
    const { data: u } = await admin
      .from('tr_users')
      .select('totp_secret')
      .eq('id', user.id)
      .single()
    if (!u?.totp_secret) {
      return NextResponse.json({ ok: false, error: '2FAは有効化されていません' }, { status: 400 })
    }
    const valid = await verifyTotpCode(u.totp_secret as string, c)
    if (!valid) {
      return NextResponse.json({ ok: false, error: '認証コードが正しくありません' }, { status: 400 })
    }
    const { error } = await admin
      .from('tr_users')
      .update({ totp_secret: null, totp_enabled_at: null })
      .eq('id', user.id)
    if (error) {
      return NextResponse.json({ ok: false, error: '無効化に失敗しました' }, { status: 500 })
    }
    await writeUserAuditLog(
      admin,
      { userId: user.id, action: '2fa_disabled', payload: {} },
      extractRequestMeta(req),
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[2fa-disable] exception', e)
    return NextResponse.json({ ok: false, error: '内部エラー' }, { status: 500 })
  }
}
