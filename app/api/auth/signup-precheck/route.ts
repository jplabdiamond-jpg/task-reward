/**
 * Signup 事前チェックAPI
 *
 * フロント側 supabase.auth.signUp() の前段に呼び出し、
 * 以下を検証:
 *   ① 18歳以上同意 / 規約同意のフラグ
 *   ② 捨てメアド(disposable email) ドメインのブロック
 *
 * 通過時に同意のタイムスタンプを返却し、auth.signUp の user_metadata に格納
 * （DBへのagreed_*_at記録は signup後の users insert か、後続のpost-confirmで実施）
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isDisposableEmail, getEmailDomain } from '@/lib/auth/disposable-email-domains'
import { checkIpSignupRateLimit, checkSelfReferral } from '@/lib/fraud/signup-checks'

export const runtime = 'edge'

interface PrecheckPayload {
  email?: string
  agreedAge18?: boolean
  agreedTerms?: boolean
  referralCode?: string | null
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
    const body = (await req.json()) as PrecheckPayload
    const email = String(body.email ?? '').trim()
    const agreedAge18 = Boolean(body.agreedAge18)
    const agreedTerms = Boolean(body.agreedTerms)

    if (!email) {
      return NextResponse.json({ ok: false, error: 'メールアドレスが未入力です' }, { status: 400 })
    }
    if (!agreedAge18) {
      return NextResponse.json(
        { ok: false, error: '18歳以上であることへの同意が必要です' },
        { status: 400 }
      )
    }
    if (!agreedTerms) {
      return NextResponse.json(
        { ok: false, error: '利用規約・プライバシーポリシーへの同意が必要です' },
        { status: 400 }
      )
    }

    if (isDisposableEmail(email)) {
      const domain = getEmailDomain(email)
      console.warn('[signup-precheck] disposable email blocked', { domain })
      return NextResponse.json(
        {
          ok: false,
          error:
            'この使い捨てメールアドレスは登録に利用できません。Gmail等の常用メールアドレスをご利用ください。',
        },
        { status: 400 }
      )
    }

    // 不正検知: IP起点の連続登録、自己アフィリ
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || null
    const referralCode = body.referralCode ? String(body.referralCode).trim() : null

    const admin = adminClient()
    // service_role により RLS をバイパスして tr_users 集計
    const ipCheck = await checkIpSignupRateLimit(admin as never, ip)
    if (!ipCheck.ok) {
      return NextResponse.json({ ok: false, error: ipCheck.message }, { status: 429 })
    }
    const refCheck = await checkSelfReferral(admin as never, referralCode, ip)
    if (!refCheck.ok) {
      return NextResponse.json({ ok: false, error: refCheck.message }, { status: 400 })
    }

    const now = new Date().toISOString()
    return NextResponse.json({
      ok: true,
      agreedAge18At: now,
      agreedTermsAt: now,
      agreedTermsVersion: '2026-04-28',
      // 後段の supabase.auth.signUp -> trigger create_tr_user に渡すために返却
      signupIp: ip,
    })
  } catch (e) {
    console.error('[signup-precheck] exception', e)
    return NextResponse.json({ ok: false, error: '内部エラー' }, { status: 500 })
  }
}
