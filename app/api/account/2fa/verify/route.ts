/**
 * 2FA 検証 & 有効化 API
 *   - フロントが setup で受け取った secret + ユーザー入力した6桁コードをPOST
 *   - 検証通れば tr_users.totp_secret / totp_enabled_at を確定保存
 *   - service_role 経由で書き込み (RLS バイパス)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@/lib/supabase/server'
import { verifyTotpCode } from '@/lib/auth/totp'
import { writeUserAuditLog, extractRequestMeta } from '@/lib/audit/log'

export const runtime = 'edge'

interface Payload {
  secret?: string
  code?: string
}

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

    const body = (await req.json()) as Payload
    const secret = String(body.secret ?? '').trim()
    const code = String(body.code ?? '').trim()
    if (!secret || !code) {
      return NextResponse.json({ ok: false, error: 'secret/codeが未入力です' }, { status: 400 })
    }

    const valid = await verifyTotpCode(secret, code)
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: '認証コードが正しくありません。時刻同期を確認し再度お試しください。' },
        { status: 400 }
      )
    }

    const admin = adminClient()
    const { error } = await admin
      .from('tr_users')
      .update({ totp_secret: secret, totp_enabled_at: new Date().toISOString() })
      .eq('id', user.id)
    if (error) {
      console.error('[2fa-verify] update error', error)
      return NextResponse.json({ ok: false, error: '保存に失敗しました' }, { status: 500 })
    }

    await writeUserAuditLog(
      admin,
      { userId: user.id, action: '2fa_enabled', payload: {} },
      extractRequestMeta(req),
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[2fa-verify] exception', e)
    return NextResponse.json({ ok: false, error: '内部エラー' }, { status: 500 })
  }
}
