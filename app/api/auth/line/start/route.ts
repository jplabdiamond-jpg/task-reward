import { NextResponse } from 'next/server'
import { signState } from '@/lib/line-state'

export const runtime = 'edge'

/**
 * LINE Login v2.1 認可開始エンドポイント
 * GET /api/auth/line/start?next=/dashboard
 * → LINE 認可URLへリダイレクト
 *
 * state は HMAC署名付きで自己完結（cookie不依存）。
 * モバイルLINEアプリ介在時の cookie 消失問題を回避。
 */
export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const next = searchParams.get('next') ?? '/dashboard'

    const channelId = process.env.LINE_CHANNEL_ID?.trim()
    const channelSecret = process.env.LINE_CHANNEL_SECRET?.trim()

    if (!channelId || !channelSecret) {
      console.error('[line/start] missing LINE_CHANNEL_ID or LINE_CHANNEL_SECRET')
      return NextResponse.redirect(new URL('/login?error=LINE設定が未完了です', origin))
    }

    // 同一オリジン強制
    const safeNext = next.startsWith('/') ? next : '/dashboard'

    // nonce / 期限 / 戻り先を state に署名付きで埋め込み
    const nonce = crypto.randomUUID().replace(/-/g, '')
    const state = await signState(
      { nonce, next: safeNext, exp: Date.now() + 10 * 60 * 1000 },
      channelSecret
    )

    const redirectUri = `${origin}/api/auth/callback/line`

    const authUrl = new URL('https://access.line.me/oauth2/v2.1/authorize')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', channelId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('scope', 'profile openid')
    authUrl.searchParams.set('nonce', nonce)
    // モバイルでLINEアプリ自動ログインを許可（UX優先）
    // HMAC署名state方式でcookieに依存しないため、アプリ介在しても問題なし

    return NextResponse.redirect(authUrl.toString())
  } catch (err) {
    console.error('[line/start] unexpected:', err)
    const origin = new URL(request.url).origin
    return NextResponse.redirect(new URL('/login?error=LINE認可開始に失敗しました', origin))
  }
}
