'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-notion-blue rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">TR</span>
            </div>
            <span className="font-bold text-lg">TaskReward</span>
          </Link>
          <h1 className="text-2xl font-bold">ログイン</h1>
        </div>
        <div className="card p-6">
          {error && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">パスワード</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" />処理中...</> : 'ログイン'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-warm-gray-500 mt-4">
          アカウントをお持ちでない方は{' '}
          <Link href="/signup" className="text-notion-blue font-medium hover:underline">新規登録</Link>
        </p>
      </div>
    </div>
  )
}
