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
import { isDisposableEmail, getEmailDomain } from '@/lib/auth/disposable-email-domains'

export const runtime = 'edge'

interface PrecheckPayload {
  email?: string
  agreedAge18?: boolean
  agreedTerms?: boolean
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

    const now = new Date().toISOString()
    return NextResponse.json({
      ok: true,
      agreedAge18At: now,
      agreedTermsAt: now,
      agreedTermsVersion: '2026-04-28',
    })
  } catch (e) {
    console.error('[signup-precheck] exception', e)
    return NextResponse.json({ ok: false, error: '内部エラー' }, { status: 500 })
  }
}
