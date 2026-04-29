'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0e1014]" />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [lineLoading, setLineLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLine = () => {
    setLineLoading(true)
    setError(null)
    const next = params.get('redirect') ?? '/dashboard'
    window.location.href = `/api/auth/line/start?next=${encodeURIComponent(next)}`
  }

  useEffect(() => {
    const e = params.get('error')
    if (e) setError(decodeURIComponent(e))
  }, [params])

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const next = params.get('redirect') ?? '/dashboard'
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (oauthErr) throw oauthErr
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Googleログインに失敗しました'
      setError(msg)
      setGoogleLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ログインに失敗しました'
      setError(msg.includes('Invalid') ? 'メールアドレスまたはパスワードが違います' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0e1014] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Tas Money" className="w-10 h-10 rounded-xl object-cover" />
            <span className="font-black text-lg">Tas Money</span>
          </Link>
          <h1 className="text-2xl font-black">ログイン</h1>
        </div>
        <div className="card p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full py-3 mb-4 rounded-xl bg-white text-[#1f1f1f] font-bold flex items-center justify-center gap-2.5 hover:bg-gray-100 active:bg-gray-200 transition disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            Googleでログイン
          </button>
          <button
            type="button"
            onClick={handleLine}
            disabled={lineLoading || googleLoading || loading}
            className="w-full py-3 mb-4 rounded-xl bg-[#06C755] text-white font-bold flex items-center justify-center gap-2.5 hover:bg-[#05b34c] active:bg-[#04a043] transition disabled:opacity-50"
          >
            {lineLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                <path d="M18 3C9.716 3 3 8.474 3 15.227c0 6.054 5.323 11.124 12.514 12.084.487.105 1.15.32 1.318.736.151.378.099.97.048 1.353l-.214 1.282c-.066.378-.301 1.479 1.296.806 1.598-.673 8.62-5.075 11.76-8.69C31.86 20.4 33 17.95 33 15.227 33 8.474 26.284 3 18 3zM11.39 18.815H8.426c-.43 0-.78-.35-.78-.78v-5.928c0-.43.35-.78.78-.78.43 0 .78.35.78.78v5.148h2.184c.43 0 .78.35.78.78 0 .43-.35.78-.78.78zm2.34-.78c0 .43-.35.78-.78.78-.43 0-.78-.35-.78-.78v-5.928c0-.43.35-.78.78-.78.43 0 .78.35.78.78v5.928zm7.092 0c0 .337-.214.635-.531.747-.084.027-.171.04-.255.04-.249 0-.485-.115-.638-.32l-3.04-4.13v3.663c0 .43-.35.78-.78.78-.43 0-.78-.35-.78-.78v-5.928c0-.337.214-.635.531-.747.085-.03.176-.044.265-.044.246 0 .482.116.633.318l3.04 4.135v-3.665c0-.43.35-.78.78-.78.43 0 .78.35.78.78v5.928c0 .002 0 .003-.003.005zm4.776-3.745c.43 0 .78.35.78.78 0 .43-.35.78-.78.78h-2.184v1.404h2.184c.43 0 .78.35.78.78 0 .43-.35.78-.78.78h-2.964c-.43 0-.78-.35-.78-.78v-5.928c0-.43.35-.78.78-.78h2.964c.43 0 .78.35.78.78 0 .43-.35.78-.78.78h-2.184v1.404h2.184z"/>
              </svg>
            )}
            LINEでログイン
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#2a2f3d]" />
            <span className="text-xs text-[#6b7280]">または</span>
            <div className="flex-1 h-px bg-[#2a2f3d]" />
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">パスワード</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" />処理中...</> : 'ログイン'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-[#b8bcc8] mt-4">
          アカウントをお持ちでない方は{' '}
          <Link href="/signup" className="text-green-400 font-bold hover:text-green-300">新規登録</Link>
        </p>
      </div>
    </div>
  )
}
