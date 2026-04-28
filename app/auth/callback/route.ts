import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const errorParam = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  // Google認可エラー
  if (errorParam) {
    console.error('[auth/callback] OAuth error:', errorParam, errorDesc)
    const url = new URL('/login', origin)
    url.searchParams.set('error', errorDesc ?? errorParam)
    return NextResponse.redirect(url)
  }

  if (!code) {
    console.error('[auth/callback] missing code')
    const url = new URL('/login', origin)
    url.searchParams.set('error', '認証コードが取得できませんでした')
    return NextResponse.redirect(url)
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchange failed:', error.message)
      const url = new URL('/login', origin)
      url.searchParams.set('error', 'ログインに失敗しました')
      return NextResponse.redirect(url)
    }

    // next が外部URLにならないよう同一オリジン強制
    const safeNext = next.startsWith('/') ? next : '/dashboard'
    return NextResponse.redirect(new URL(safeNext, origin))
  } catch (err) {
    console.error('[auth/callback] unexpected:', err)
    const url = new URL('/login', origin)
    url.searchParams.set('error', '予期せぬエラーが発生しました')
    return NextResponse.redirect(url)
  }
}
