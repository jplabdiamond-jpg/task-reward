'use client'

import { useState, useMemo } from 'react'
import { Coins, Wallet, Bitcoin, Gift, Building2, Gamepad, X, CheckCircle2, Clock as ClockIcon } from 'lucide-react'

type Profile = {
  confirmed_balance: number | null
  pending_balance: number | null
  balance: number | null
  rank: string | null
  level: number | null
} | null

type RewardOption = {
  id: string
  category: 'paypal' | 'crypto' | 'giftcard' | 'bank' | 'game'
  brand: string
  title: string
  description: string
  icon_url: string | null
  cost: number
  payout_value: string
  currency: string
  min_rank: string
}

type Redemption = {
  id: string
  cost: number
  payout_value: string
  status: string
  created_at: string
  reward_option_id: string
}

const CATEGORIES: { key: RewardOption['category'] | 'all'; label: string; icon: any }[] = [
  { key: 'all', label: 'すべて', icon: Gift },
  { key: 'paypal', label: 'PayPal', icon: Wallet },
  { key: 'crypto', label: '暗号通貨', icon: Bitcoin },
  { key: 'giftcard', label: 'ギフトカード', icon: Gift },
  { key: 'bank', label: '銀行振込', icon: Building2 },
  { key: 'game', label: 'ゲーム', icon: Gamepad },
]

export default function RewardsClient({
  profile,
  options,
  history,
}: {
  profile: Profile
  options: RewardOption[]
  history: Redemption[]
}) {
  const [category, setCategory] = useState<RewardOption['category'] | 'all'>('all')
  const [selected, setSelected] = useState<RewardOption | null>(null)
  const [accountInput, setAccountInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const balance = profile?.confirmed_balance ?? profile?.balance ?? 0
  const filtered = useMemo(
    () => (category === 'all' ? options : options.filter(o => o.category === category)),
    [category, options]
  )

  const handleRedeem = async () => {
    if (!selected) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reward_option_id: selected.id,
          account_info: { value: accountInput },
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? '交換に失敗しました')
      }
      setSuccess(true)
      setTimeout(() => {
        setSelected(null)
        setSuccess(false)
        setAccountInput('')
        location.reload()
      }, 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Rewards</h1>
        <p className="text-[#b8bcc8]">獲得した報酬をPayPal・暗号通貨・ギフトカードに交換</p>
      </div>

      {/* Balance */}
      <div className="card p-6 bg-gradient-to-br from-green-500/10 to-amber-500/10 border-green-500/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-[#b8bcc8] mb-1">出金可能残高</div>
            <div className="text-4xl md:text-5xl font-black text-amber-400">
              🪙 {balance.toLocaleString()}
            </div>
          </div>
          {profile?.pending_balance ? (
            <div className="md:text-right">
              <div className="text-xs text-[#b8bcc8] mb-1">承認待ち残高</div>
              <div className="text-2xl font-black text-[#6b7280]">
                {profile.pending_balance.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#6b7280] mt-1">ASP承認後に出金可能になります</div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {CATEGORIES.map(c => {
          const active = category === c.key
          return (
            <button
              key={c.key}
              onClick={() => setCategory(c.key as any)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                active
                  ? 'bg-green-500 text-black'
                  : 'bg-[#1f2330] text-[#b8bcc8] hover:bg-[#252a38] border border-[#2a2f3d]'
              }`}
            >
              <c.icon size={14} />
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Reward Options Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(opt => {
          const canAfford = balance >= opt.cost
          return (
            <button
              key={opt.id}
              onClick={() => canAfford && setSelected(opt)}
              disabled={!canAfford}
              className={`card p-4 text-left transition-all ${
                canAfford ? 'card-hover' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-[#252a38] to-[#1f2330] rounded-xl mb-3 flex items-center justify-center text-3xl">
                {opt.category === 'paypal' && '💸'}
                {opt.category === 'crypto' && '₿'}
                {opt.category === 'giftcard' && '🎁'}
                {opt.category === 'bank' && '🏦'}
                {opt.category === 'game' && '🎮'}
              </div>
              <div className="text-xs text-[#6b7280] mb-1">{opt.brand}</div>
              <div className="font-bold text-sm mb-2 line-clamp-1">{opt.payout_value}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b8bcc8]">交換に</span>
                <span className="font-black text-amber-400">🪙{opt.cost.toLocaleString()}</span>
              </div>
              {!canAfford && (
                <div className="mt-2 text-[10px] text-red-400">
                  あと {(opt.cost - balance).toLocaleString()} 必要
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* History */}
      <div>
        <h2 className="text-lg font-bold mb-3">交換履歴</h2>
        <div className="card divide-y divide-[#2a2f3d]">
          {history.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#6b7280]">まだ交換履歴がありません</div>
          ) : (
            history.map(h => (
              <div key={h.id} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1f2330] rounded-xl flex items-center justify-center">
                  {h.status === 'completed' ? (
                    <CheckCircle2 className="text-green-400" size={18} />
                  ) : (
                    <ClockIcon className="text-amber-400" size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{h.payout_value}</div>
                  <div className="text-xs text-[#6b7280]">{new Date(h.created_at).toLocaleString('ja-JP')}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#b8bcc8]">-🪙{h.cost.toLocaleString()}</div>
                  <div className={`text-[10px] font-bold uppercase ${
                    h.status === 'completed' ? 'text-green-400' :
                    h.status === 'failed' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {h.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 relative">
            <button
              onClick={() => { setSelected(null); setError(null); setAccountInput('') }}
              className="absolute top-4 right-4 text-[#6b7280] hover:text-white"
            >
              <X size={20} />
            </button>
            {success ? (
              <div className="text-center py-6">
                <CheckCircle2 size={48} className="text-green-400 mx-auto mb-3" />
                <div className="text-xl font-bold mb-1">交換申請を受付ました</div>
                <div className="text-sm text-[#b8bcc8]">処理状況は履歴からご確認下さい</div>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-black mb-1">{selected.brand} {selected.payout_value}</h3>
                <p className="text-sm text-[#b8bcc8] mb-4">{selected.description}</p>
                <div className="bg-[#1f2330] rounded-xl p-4 mb-4 flex items-center justify-between">
                  <span className="text-sm text-[#b8bcc8]">交換コスト</span>
                  <span className="font-black text-amber-400 text-lg">🪙 {selected.cost.toLocaleString()}</span>
                </div>
                <label className="block">
                  <span className="text-xs text-[#b8bcc8] mb-1 block">
                    {selected.category === 'paypal' && 'PayPalメールアドレス'}
                    {selected.category === 'crypto' && '送金先アドレス'}
                    {selected.category === 'giftcard' && 'コード送付先メールアドレス'}
                    {selected.category === 'bank' && '銀行口座情報（銀行名・支店・口座番号）'}
                    {selected.category === 'game' && 'ゲーム内ID / メールアドレス'}
                  </span>
                  <input
                    className="input"
                    value={accountInput}
                    onChange={e => setAccountInput(e.target.value)}
                    placeholder={selected.category === 'paypal' ? 'name@example.com' : '入力してください'}
                  />
                </label>
                {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
                <button
                  onClick={handleRedeem}
                  disabled={submitting || !accountInput.trim()}
                  className="btn-primary w-full mt-4 disabled:opacity-50"
                >
                  {submitting ? '処理中...' : '交換を申請する'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
