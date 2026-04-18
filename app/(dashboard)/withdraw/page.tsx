'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Wallet, AlertCircle, CheckCircle, Loader2, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type Method = 'bank' | 'paypay' | 'amazon_gift'

const METHODS: { value: Method; label: string; icon: string; minAmount: number }[] = [
  { value: 'paypay', label: 'PayPay', icon: '🔵', minAmount: 1000 },
  { value: 'bank', label: '銀行振込', icon: '🏦', minAmount: 1000 },
  { value: 'amazon_gift', label: 'Amazonギフト券', icon: '📦', minAmount: 1000 },
]

export default function WithdrawPage() {
  const [balance, setBalance] = useState(0)
  const [history, setHistory] = useState<{ id: string; amount: number; method: string; status: string; created_at: string }[]>([])
  const [method, setMethod] = useState<Method>('paypay')
  const [amount, setAmount] = useState('')
  const [accountInfo, setAccountInfo] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const [{ data: p }, { data: h }] = await Promise.all([
        supabase.from('tr_users').select('balance').eq('id', user.id).single(),
        supabase.from('tr_withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ])
      setBalance(p?.balance ?? 0)
      setHistory(h ?? [])
    })()
  }, [])

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseInt(amount)
    if (!amt || amt < 1000) { setError('最低出金額は¥1,000です'); return }
    if (amt > balance) { setError('残高が不足しています'); return }
    if (!userId) return

    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: amt, method, accountInfo }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '出金申請に失敗しました')
      }
      setSuccess(true)
      setBalance(prev => prev - amt)
      setAmount('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '出金申請に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const BANK_FIELDS = [
    { key: 'bank_name', label: '銀行名', placeholder: '〇〇銀行' },
    { key: 'branch_name', label: '支店名', placeholder: '〇〇支店' },
    { key: 'account_type', label: '口座種別', placeholder: '普通' },
    { key: 'account_number', label: '口座番号', placeholder: '1234567' },
    { key: 'account_holder', label: '口座名義（カナ）', placeholder: 'ヤマダ タロウ' },
  ]

  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <Wallet size={20} className="text-notion-blue" />
        <h1 className="text-2xl font-bold tracking-tight">出金申請</h1>
      </div>

      {/* Balance */}
      <div className="card p-5 text-center">
        <div className="text-xs text-warm-gray-500 mb-1">利用可能残高</div>
        <div className="text-4xl font-bold text-notion-blue">{formatCurrency(balance)}</div>
        <div className="text-xs text-warm-gray-300 mt-1">最低出金額: ¥1,000</div>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl">
          <CheckCircle size={16} />
          <div>
            <div className="font-semibold text-sm">出金申請を受け付けました</div>
            <div className="text-xs mt-0.5">1〜3営業日以内に振り込まれます</div>
          </div>
        </div>
      )}

      {/* Withdraw Form */}
      {balance >= 1000 && !success && (
        <form onSubmit={handleWithdraw} className="card p-5 space-y-4">
          {/* Method */}
          <div>
            <label className="block text-sm font-medium mb-2">出金方法</label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map(m => (
                <button key={m.value} type="button" onClick={() => setMethod(m.value)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all text-center ${
                    method === m.value
                      ? 'border-notion-blue bg-badge-blue-bg text-notion-blue'
                      : 'border-[rgba(0,0,0,0.1)] text-warm-gray-500 hover:border-notion-blue'
                  }`}>
                  <div className="text-xl mb-0.5">{m.icon}</div>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">出金金額</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-500 font-medium">¥</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                className="input pl-7" placeholder="1000" min="1000" max={balance} required />
            </div>
            <div className="flex gap-2 mt-1.5">
              {[1000, 3000, 5000, balance].map(v => (
                <button key={v} type="button" onClick={() => setAmount(String(v))}
                  className="text-xs px-2 py-1 bg-warm-white rounded-lg text-warm-gray-500 hover:text-notion-blue transition-colors">
                  {v === balance ? '全額' : formatCurrency(v)}
                </button>
              ))}
            </div>
          </div>

          {/* Account Info */}
          {method === 'bank' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">振込先情報</label>
              {BANK_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-warm-gray-500 mb-0.5">{f.label}</label>
                  <input className="input" placeholder={f.placeholder} required
                    onChange={e => setAccountInfo(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
          )}
          {method === 'paypay' && (
            <div>
              <label className="block text-sm font-medium mb-1">PayPay登録電話番号</label>
              <input className="input" placeholder="090-0000-0000" required
                onChange={e => setAccountInfo({ phone: e.target.value })} />
            </div>
          )}
          {method === 'amazon_gift' && (
            <div>
              <label className="block text-sm font-medium mb-1">送付先メールアドレス</label>
              <input type="email" className="input" placeholder="you@example.com" required
                onChange={e => setAccountInfo({ email: e.target.value })} />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-orange-700 bg-orange-50 p-3 rounded-xl text-sm">
              <AlertCircle size={14} />{error}
            </div>
          )}

          <div className="bg-warm-white rounded-xl p-3 text-xs text-warm-gray-500 space-y-1">
            <p>• 振込手数料は弊社負担</p>
            <p>• 処理時間: 1〜3営業日</p>
            <p>• 年間50万円超の場合、支払調書を発行します</p>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base disabled:opacity-50">
            {loading ? <><Loader2 size={16} className="animate-spin" />処理中...</> : '出金申請する'}
          </button>
        </form>
      )}

      {balance < 1000 && (
        <div className="card p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-warm-gray-300 mb-2" />
          <p className="font-semibold text-sm">残高が不足しています</p>
          <p className="text-xs text-warm-gray-500 mt-1">最低出金額¥1,000以上になると出金できます</p>
          <a href="/campaigns" className="btn-primary inline-block mt-4 px-6">案件を探す →</a>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-[rgba(0,0,0,0.06)]">
            <h2 className="font-bold text-sm">出金履歴</h2>
          </div>
          <div className="divide-y divide-[rgba(0,0,0,0.06)]">
            {history.map(h => (
              <div key={h.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{METHODS.find(m => m.value === h.method)?.label}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock size={10} className="text-warm-gray-300" />
                    <span className="text-xs text-warm-gray-300">{new Date(h.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">-{formatCurrency(h.amount)}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-pill font-medium ${
                    h.status === 'completed' ? 'bg-green-50 text-green-700' :
                    h.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                    h.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-warm-white text-warm-gray-500'
                  }`}>
                    {h.status === 'completed' ? '振込完了' : h.status === 'processing' ? '処理中' : h.status === 'failed' ? '失敗' : '申請中'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
