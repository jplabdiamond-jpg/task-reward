import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { verifyState } from '@/lib/line-state'

export const runtime = 'edge'

/**
 * LINE Login v2.1 コールバックエンドポイント
 * - state検証（CSRF対策）
 * - code → access_token / id_token 交換
 * - LINE UID で既存ユーザー検索 → なければメールで紐付け or 新規作成
 * - Supabase Auth セッション発行
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  const cookieStore = await cookies()

  // 後方互換のno-op（旧cookieが残っていればクリア）
  const clearOauthCookies = (res: NextResponse) => {
    res.cookies.delete('line_oauth_state')
    res.cookies.delete('line_oauth_nonce')
    res.cookies.delete('line_oauth_next')
  }

  // LINE側エラー
  if (errorParam) {
    console.error('[line/callback] LINE error:', errorParam, errorDesc)
    const url = new URL('/login', origin)
    url.searchParams.set('error', errorDesc ?? 'LINEログインがキャンセルされました')
    const res = NextResponse.redirect(url)
    clearOauthCookies(res)
    return res
  }

  if (!code || !state) {
    console.error('[line/callback] missing code or state')
    const url = new URL('/login', origin)
    url.searchParams.set('error', '認証情報が不正です')
    const res = NextResponse.redirect(url)
    clearOauthCookies(res)
    return res
  }

  const channelId = process.env.LINE_CHANNEL_ID?.trim()
  const channelSecret = process.env.LINE_CHANNEL_SECRET?.trim()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!channelId || !channelSecret || !supabaseUrl || !serviceKey) {
    console.error('[line/callback] missing env vars')
    const url = new URL('/login', origin)
    url.searchParams.set('error', 'サーバー設定エラー')
    const res = NextResponse.redirect(url)
    clearOauthCookies(res)
    return res
  }

  // CSRF: state検証（HMAC署名で自己完結）
  const statePayload = await verifyState(state, channelSecret)
  if (!statePayload) {
    console.error('[line/callback] state verification failed')
    const url = new URL('/login', origin)
    url.searchParams.set('error', 'セキュリティ検証に失敗しました（state不一致）')
    const res = NextResponse.redirect(url)
    clearOauthCookies(res)
    return res
  }
  const cookieNonce = statePayload.nonce
  const next = statePayload.next ?? '/dashboard'

  try {
    const redirectUri = `${origin}/api/auth/callback/line`

    // ① code → token 交換
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: channelId,
        client_secret: channelSecret,
      }),
    })

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text()
      console.error('[line/callback] token exchange failed:', tokenRes.status, errBody)
      const url = new URL('/login', origin)
      url.searchParams.set('error', 'LINEトークン取得に失敗しました')
      const res = NextResponse.redirect(url)
      clearOauthCookies(res)
      return res
    }

    const tokenData = await tokenRes.json() as {
      access_token: string
      id_token?: string
      refresh_token?: string
      expires_in: number
    }

    // ② id_token から userId/email/name/picture 取得（verify API利用）
    if (!tokenData.id_token) {
      console.error('[line/callback] id_token missing')
      const url = new URL('/login', origin)
      url.searchParams.set('error', 'LINE ID Token取得に失敗しました')
      const res = NextResponse.redirect(url)
      clearOauthCookies(res)
      return res
    }

    const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        id_token: tokenData.id_token,
        client_id: channelId,
        nonce: cookieNonce ?? '',
      }),
    })

    if (!verifyRes.ok) {
      const errBody = await verifyRes.text()
      console.error('[line/callback] id_token verify failed:', verifyRes.status, errBody)
      const url = new URL('/login', origin)
      url.searchParams.set('error', 'LINE認証情報の検証に失敗しました')
      const res = NextResponse.redirect(url)
      clearOauthCookies(res)
      return res
    }

    const profile = await verifyRes.json() as {
      sub: string         // LINE UID
      name?: string
      picture?: string
      email?: string
    }

    const lineUserId = profile.sub
    const lineEmail = profile.email?.toLowerCase()
    const lineName = profile.name ?? 'LINEユーザー'
    const linePicture = profile.picture

    // ③ Supabase Admin Client（service_role）でユーザー作成/紐付け
    const adminAuth = `Bearer ${serviceKey}`

    // ③-1: 既存LINEユーザー検索（tr_users.line_user_id）
    const findByLineRes = await fetch(
      `${supabaseUrl}/rest/v1/tr_users?line_user_id=eq.${encodeURIComponent(lineUserId)}&select=id,email`,
      {
        headers: { apikey: serviceKey, Authorization: adminAuth },
      }
    )
    const existingByLine = (await findByLineRes.json()) as Array<{ id: string; email: string }>

    let supabaseUserId: string | null = null
    let userEmailForSession: string | null = null

    if (existingByLine.length > 0) {
      // 既存LINEユーザー → そのまま使う
      supabaseUserId = existingByLine[0].id
      userEmailForSession = existingByLine[0].email
    } else if (lineEmail) {
      // ③-2: メールで既存ユーザー検索（紐付け）
      const findByEmailRes = await fetch(
        `${supabaseUrl}/rest/v1/tr_users?email=eq.${encodeURIComponent(lineEmail)}&select=id,email`,
        {
          headers: { apikey: serviceKey, Authorization: adminAuth },
        }
      )
      const existingByEmail = (await findByEmailRes.json()) as Array<{ id: string; email: string }>

      if (existingByEmail.length > 0) {
        // メール一致 → LINE紐付けのみ（重複アカウント防止）
        supabaseUserId = existingByEmail[0].id
        userEmailForSession = existingByEmail[0].email
        await fetch(
          `${supabaseUrl}/rest/v1/tr_users?id=eq.${supabaseUserId}`,
          {
            method: 'PATCH',
            headers: {
              apikey: serviceKey,
              Authorization: adminAuth,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              line_user_id: lineUserId,
              line_display_name: lineName,
              line_picture_url: linePicture ?? null,
              updated_at: new Date().toISOString(),
            }),
          }
        )
      }
    }

    // ③-3: 新規ユーザー作成
    if (!supabaseUserId) {
      // メール未提供の場合はLINE UIDベースの内部メールで補完
      const effectiveEmail = lineEmail ?? `line_${lineUserId}@line.tas-money.local`

      const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: adminAuth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: effectiveEmail,
          email_confirm: true,
          user_metadata: {
            provider: 'line',
            line_user_id: lineUserId,
            nickname: lineName,
            avatar_url: linePicture,
          },
        }),
      })

      if (!createRes.ok) {
        const errBody = await createRes.text()
        console.error('[line/callback] auth user creation failed:', createRes.status, errBody)
        const url = new URL('/login', origin)
        url.searchParams.set('error', 'ユーザー作成に失敗しました')
        const res = NextResponse.redirect(url)
        clearOauthCookies(res)
        return res
      }

      const createdUser = await createRes.json() as { id: string; email: string }
      supabaseUserId = createdUser.id
      userEmailForSession = createdUser.email

      // tr_users 側にも upsert（DBトリガーがあれば不要だが安全のため明示）
      // referral_code はランダム生成、必須項目を埋める
      const refCode = (lineUserId.slice(-6).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase()).slice(0, 8)
      await fetch(`${supabaseUrl}/rest/v1/tr_users`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: adminAuth,
          'Content-Type': 'application/json',
          Prefer: 'resolution=ignore-duplicates,return=minimal',
        },
        body: JSON.stringify({
          id: supabaseUserId,
          email: effectiveEmail,
          nickname: lineName.slice(0, 20),
          avatar_url: linePicture ?? null,
          line_user_id: lineUserId,
          line_display_name: lineName,
          line_picture_url: linePicture ?? null,
          referral_code: refCode,
          contract_agreed_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
        }),
      })
    }

    // ④ Magic Link経由でセッション発行（admin generateLink + verify）
    const linkRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: adminAuth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'magiclink',
        email: userEmailForSession,
      }),
    })

    if (!linkRes.ok) {
      const errBody = await linkRes.text()
      console.error('[line/callback] generate_link failed:', linkRes.status, errBody)
      const url = new URL('/login', origin)
      url.searchParams.set('error', 'セッション発行に失敗しました')
      const res = NextResponse.redirect(url)
      clearOauthCookies(res)
      return res
    }

    const linkData = await linkRes.json() as {
      properties?: { hashed_token?: string; email_otp?: string }
      action_link?: string
    }

    const hashedToken = linkData.properties?.hashed_token
    if (!hashedToken) {
      console.error('[line/callback] hashed_token missing')
      const url = new URL('/login', origin)
      url.searchParams.set('error', 'セッショントークン取得失敗')
      const res = NextResponse.redirect(url)
      clearOauthCookies(res)
      return res
    }

    // ⑤ verifyOtp でセッションをcookieに焼き込み
    const supabase = createServerClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: hashedToken,
    })

    if (verifyErr) {
      console.error('[line/callback] verifyOtp failed:', verifyErr.message)
      const url = new URL('/login', origin)
      url.searchParams.set('error', 'ログイン処理に失敗しました')
      const res = NextResponse.redirect(url)
      clearOauthCookies(res)
      return res
    }

    // ⑥ 成功 → next にリダイレクト
    const safeNext = next.startsWith('/') ? next : '/dashboard'
    const res = NextResponse.redirect(new URL(safeNext, origin))
    clearOauthCookies(res)
    return res
  } catch (err) {
    console.error('[line/callback] unexpected:', err)
    const url = new URL('/login', origin)
    url.searchParams.set('error', '予期せぬエラーが発生しました')
    const res = NextResponse.redirect(url)
    clearOauthCookies(res)
    return res
  }
}
