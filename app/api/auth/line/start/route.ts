import { NextResponse } from 'next/server'

export const runtime = 'edge'

/**
 * LINE Login v2.1 認可開始エンドポイント
 * GET /api/auth/line/start?next=/dashboard
 * → LINE 認可URLへリダイレクト
 */
export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const next = searchParams.get('next') ?? '/dashboard'

    const channelId = process.env.LINE_CHANNEL_ID?.trim()
    if (!channelId) {
      console.error('[line/start] LINE_CHANNEL_ID not set')
      return NextResponse.redirect(new URL('/login?error=LINE設定が未完了です', origin))
    }

    // CSRF防止のstate / nonce 生成（暗号論的乱数）
    const state = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    const nonce = crypto.randomUUID().replace(/-/g, '')

    // safeNext（同一オリジン強制）
    const safeNext = next.startsWith('/') ? next : '/dashboard'

    // state にアプリ側情報を埋め込み（HMAC不要・cookieに正本保存）
    const redirectUri = `${origin}/api/auth/callback/line`

    const authUrl = new URL('https://access.line.me/oauth2/v2.1/authorize')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', channelId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('scope', 'profile openid email')
    authUrl.searchParams.set('nonce', nonce)
    authUrl.searchParams.set('bot_prompt', 'normal')

    const res = NextResponse.redirect(authUrl.toString())

    // state/nonce/next を HttpOnly Cookieに保存（10分有効）
    const cookieOpts = {
      httpOnly: true,
      secure: origin.startsWith('https://'),
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 10,
    }
    res.cookies.set('line_oauth_state', state, cookieOpts)
    res.cookies.set('line_oauth_nonce', nonce, cookieOpts)
    res.cookies.set('line_oauth_next', safeNext, cookieOpts)

    return res
  } catch (err) {
    console.error('[line/start] unexpected:', err)
    const origin = new URL(request.url).origin
    return NextResponse.redirect(new URL('/login?error=LINE認可開始に失敗しました', origin))
  }
}
