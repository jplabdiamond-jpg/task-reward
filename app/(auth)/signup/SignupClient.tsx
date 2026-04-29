'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'

export default function SignupClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0e1014]" />}>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const router = useRouter()
  const params = useSearchParams()
  const refCode = params.get('ref') ?? ''

  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedAge18, setAgreedAge18] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [lineLoading, setLineLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allAgreed = agreedTerms && agreedAge18

  // 18歳以上 + 規約同意 + 捨てメアドチェックをサーバ側で実行
  // 通過時、agreed_*_at タイムスタンプを取得して user_metadata に格納する
  async function precheck(emailToCheck: string): Promise<{
    ok: true
    agreedAge18At: string
    agreedTermsAt: string
    agreedTermsVersion: string
  }> {
    const res = await fetch('/api/auth/signup-precheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailToCheck, agreedAge18, agreedTerms, referralCode: refCode || null }),
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      throw new Error(data.error || '事前チェックに失敗しました')
    }
    return data
  }

  const handleLine = async () => {
    if (!allAgreed) { setError('利用規約と18歳以上の確認の両方に同意してください'); return }
    setLineLoading(true)
    setError(null)
    // LINE/Googleはメール取得が後段になるため、ここでは同意フラグのみ確認
    window.location.href = `/api/auth/line/start?next=/dashboard`
  }

  const handleGoogle = async () => {
    if (!allAgreed) { setError('利用規約と18歳以上の確認の両方に同意してください'); return }
    setGoogleLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allAgreed) { setError('利用規約と18歳以上の確認の両方に同意してください'); return }
    if (password.length < 8) { setError('パスワードは8文字以上で設定してください'); return }

    setLoading(true)
    setError(null)
    try {
      const pre = await precheck(email)
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email, password,
        options: {
          data: {
            nickname,
            referral_code: refCode,
            agreed_age_18_at: pre.agreedAge18At,
            agreed_terms_at: pre.agreedTermsAt,
            agreed_terms_version: pre.agreedTermsVersion,
          },
        },
      })
      if (authError) throw authError
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登録に失敗しました'
      setError(msg.includes('already') ? 'このメールアドレスは既に登録されています' : msg)
    } finally {
      setLoading(false)
    }
  }

  const strength = password.length >= 12 ? 3 : password.length >= 8 ? 2 : password.length > 0 ? 1 : 0

  return (
    <div className="min-h-screen bg-[#0e1014] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Tas Money" className="w-10 h-10 rounded-xl object-cover" />
            <span className="font-black text-lg">Tas Money</span>
          </Link>
          <h1 className="text-2xl font-black">無料で始める</h1>
          <p className="text-sm text-[#b8bcc8] mt-1">業務委託契約で安心・安全に稼ぐ</p>
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
            Googleで登録
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
            LINEで登録
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#2a2f3d]" />
            <span className="text-xs text-[#6b7280]">または</span>
            <div className="flex-1 h-px bg-[#2a2f3d]" />
          </div>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">ニックネーム</label>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                className="input" placeholder="山田太郎" required maxLength={20} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">パスワード（8文字以上）</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-10" placeholder="••••••••" required minLength={8} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      strength >= i ? (i === 3 ? 'bg-green-500' : i === 2 ? 'bg-amber-500' : 'bg-orange-500') : 'bg-[#2a2f3d]'
                    }`} />
                  ))}
                </div>
              )}
            </div>
            {refCode && (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg">
                <CheckCircle size={14} />
                <span>紹介コード: <strong>{refCode}</strong> が適用されます</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-green-500" />
                <span className="text-xs text-[#b8bcc8] leading-relaxed">
                  <Link href="/terms" className="text-green-400 hover:underline">利用規約</Link>・
                  <Link href="/privacy" className="text-green-400 hover:underline">プライバシーポリシー</Link>・
                  業務委託基本契約に同意します
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agreedAge18} onChange={e => setAgreedAge18(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-green-500" />
                <span className="text-xs text-[#b8bcc8] leading-relaxed">
                  私は <strong className="text-white">18歳以上</strong> です（18歳未満の方はご利用いただけません）
                </span>
              </label>
            </div>
            <button type="submit" disabled={loading || !allAgreed}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <><Loader2 size={16} className="animate-spin" />登録中...</> : '無料で登録する'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-[#b8bcc8] mt-4">
          既にアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-green-400 font-bold hover:text-green-300">ログイン</Link>
        </p>
      </div>
    </div>
  )
}
