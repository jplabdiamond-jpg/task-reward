import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 完全一致で公開
const PUBLIC_EXACT = new Set([
  '/', '/login', '/signup',
  '/terms', '/privacy', '/tokushoho',
  '/guide', '/faq', '/news', '/contact',
  '/sitemap.xml', '/robots.txt',
])
// プレフィックス一致で公開（動的ルート含む）
const PUBLIC_PREFIXES = ['/news/', '/api/', '/_next/', '/auth/']

// 正規ホスト（独自ドメイン）。pages.dev / www からの流入を 301 で集約
const CANONICAL_HOST = 'task-money.net'

export async function middleware(request: NextRequest) {
  // ホスト正規化（本番環境のみ）
  const host = request.headers.get('host') || ''
  const isProd = process.env.NODE_ENV === 'production'
  if (
    isProd &&
    host &&
    host !== CANONICAL_HOST &&
    (host.endsWith('.pages.dev') || host === `www.${CANONICAL_HOST}`)
  ) {
    const url = request.nextUrl.clone()
    url.host = CANONICAL_HOST
    url.protocol = 'https:'
    url.port = ''
    return NextResponse.redirect(url, 301)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isPublic = PUBLIC_EXACT.has(path) || PUBLIC_PREFIXES.some(p => path.startsWith(p))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  if (user && (path === '/login' || path === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
