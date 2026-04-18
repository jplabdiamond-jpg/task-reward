'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-warm-white" />}>
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
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) { setError('利用規約・業務委託契約に同意してください'); return }
    if (password.length < 8) { setError('パスワードは8文字以上で設定してください'); return }

    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email, password,
        options: { data: { nickname, referral_code: refCode } },
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
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-notion-blue rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">TR</span>
            </div>
            <span className="font-bold text-lg">TaskReward</span>
          </Link>
          <h1 className="text-2xl font-bold">無料で始める</h1>
          <p className="text-sm text-warm-gray-500 mt-1">業務委託契約で安心・安全に稼ぐ</p>
        </div>
        <div className="card p-6">
          {error && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ニックネーム</label>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                className="input" placeholder="山田太郎" required maxLength={20} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">パスワード（8文字以上）</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-10" placeholder="••••••••" required minLength={8} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      strength >= i ? (i === 3 ? 'bg-green-500' : i === 2 ? 'bg-yellow-400' : 'bg-orange-400') : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
              )}
            </div>
            {refCode && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle size={14} />
                <span>紹介コード: <strong>{refCode}</strong> が適用されます</span>
              </div>
            )}
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-notion-blue" />
              <span className="text-xs text-warm-gray-500 leading-relaxed">
                <Link href="/terms" className="text-notion-blue hover:underline">利用規約</Link>・
                <Link href="/privacy" className="text-notion-blue hover:underline">プライバシーポリシー</Link>・
                業務委託基本契約に同意します
              </span>
            </label>
            <button type="submit" disabled={loading || !agreed}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <><Loader2 size={16} className="animate-spin" />登録中...</> : '無料で登録する'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-warm-gray-500 mt-4">
          既にアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-notion-blue font-medium hover:underline">ログイン</Link>
        </p>
      </div>
    </div>
  )
}
