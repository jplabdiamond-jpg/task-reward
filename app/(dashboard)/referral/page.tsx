'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Copy, CheckCircle, Gift, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function ReferralPage() {
  const [profile, setProfile] = useState<{ referral_code: string; total_earned: number } | null>(null)
  const [referrals, setReferrals] = useState<{ referee_id: string; bonus_amount: number; paid_at: string | null; created_at: string }[]>([])
  const [copied, setCopied] = useState(false)
  const [appUrl, setAppUrl] = useState('')

  useEffect(() => {
    setAppUrl(window.location.origin)
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from('tr_users').select('referral_code,total_earned').eq('id', user.id).single(),
        supabase.from('tr_referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      ])
      setProfile(p)
      setReferrals(r ?? [])
    })()
  }, [])

  const referralUrl = profile ? `${appUrl}/signup?ref=${profile.referral_code}` : ''
  const totalBonusEarned = referrals.filter(r => r.paid_at).reduce((s, r) => s + r.bonus_amount, 0)
  const pendingBonus = referrals.filter(r => !r.paid_at).reduce((s, r) => s + r.bonus_amount, 0)

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareText = `TaskRewardで副業しませんか？タスクをこなして報酬を稼げます！登録はこちら → ${referralUrl}`

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-2">
        <Users size={20} className="text-notion-blue" />
        <h1 className="text-2xl font-bold tracking-tight">紹介プログラム</h1>
      </div>

      {/* Reward Structure */}
      <div className="card p-5">
        <h2 className="font-bold mb-4">2段階報酬の仕組み</h2>
        <div className="space-y-3">
          {[
            { level: '1段階目', desc: '紹介した友人が初案件を完了', bonus: '友人の報酬の10%', icon: '👤' },
            { level: '2段階目', desc: '友人が紹介した人が初案件を完了', bonus: '孫紹介の報酬の5%', icon: '👥' },
          ].map(r => (
            <div key={r.level} className="flex items-start gap-3 p-3 bg-warm-white rounded-xl">
              <span className="text-2xl">{r.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-sm">{r.level}</div>
                <div className="text-xs text-warm-gray-500">{r.desc}</div>
              </div>
              <div className="badge text-[10px]">{r.bonus}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '紹介人数', value: `${referrals.length}人` },
          { label: '獲得済み', value: formatCurrency(totalBonusEarned) },
          { label: '確定待ち', value: formatCurrency(pendingBonus) },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <div className="text-lg font-bold text-notion-blue">{s.value}</div>
            <div className="text-xs text-warm-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referral Link */}
      <div className="card p-5 space-y-3">
        <h2 className="font-bold">あなたの招待リンク</h2>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-warm-white rounded-lg px-3 py-2.5 text-sm font-mono truncate text-warm-gray-500">
            {referralUrl || '読み込み中...'}
          </div>
          <button onClick={copyLink} className="btn-primary flex items-center gap-1.5 px-4 py-2.5 flex-shrink-0">
            {copied ? <><CheckCircle size={14} />コピー済み</> : <><Copy size={14} />コピー</>}
          </button>
        </div>

        {/* Share Buttons */}
        <div className="flex gap-2">
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 btn-secondary text-xs py-2.5 text-center">
            𝕏 でシェア
          </a>
          <a href={`https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 btn-secondary text-xs py-2.5 text-center">
            LINE でシェア
          </a>
        </div>

        {profile && (
          <div className="text-center text-xs text-warm-gray-300">
            招待コード: <span className="font-mono font-bold text-warm-gray-500">{profile.referral_code}</span>
          </div>
        )}
      </div>

      {/* Referral History */}
      <div className="card">
        <div className="p-4 border-b border-[rgba(0,0,0,0.06)] flex items-center gap-2">
          <Gift size={14} className="text-notion-blue" />
          <h2 className="font-bold text-sm">紹介履歴</h2>
        </div>
        {referrals.length === 0 ? (
          <div className="py-10 text-center text-warm-gray-300">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">まだ紹介実績がありません</p>
            <p className="text-xs mt-1">友達を招待して報酬を稼ごう！</p>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(0,0,0,0.06)]">
            {referrals.map(r => (
              <div key={r.id ?? r.created_at} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium">紹介ユーザー</div>
                  <div className="text-xs text-warm-gray-300">
                    {new Date(r.created_at).toLocaleDateString('ja-JP')} ·{' '}
                    {r.paid_at ? <span className="text-green-600">支払済</span> : <span className="text-orange-500">確定待ち</span>}
                  </div>
                </div>
                <div className={`text-sm font-bold ${r.paid_at ? 'text-green-600' : 'text-warm-gray-300'}`}>
                  {r.bonus_amount > 0 ? `+${formatCurrency(r.bonus_amount)}` : '集計中'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
