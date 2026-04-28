import Link from 'next/link'
import { ArrowLeft, UserPlus, Search, ClipboardCheck, Wallet, ShieldCheck, TrendingUp, Gift, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '使い方ガイド | Tas Money',
  description: '登録から報酬獲得・出金までの流れを4ステップで解説。',
}

const STEPS = [
  {
    n: 1,
    icon: UserPlus,
    title: '無料アカウント作成',
    desc: 'メールアドレスまたはSNS（Google・LINE）で1分登録。本人確認は最初の出金時のみ。',
    color: 'from-green-500 to-emerald-500',
    detail: ['メールアドレス＋パスワードの登録', '登録メールに届く認証リンクをクリック', 'プロフィール初期設定（任意）'],
  },
  {
    n: 2,
    icon: Search,
    title: '案件を探す',
    desc: 'Earn / Surveys / Tasks / Rewards の4セクションから自分に合った案件を選択。',
    color: 'from-blue-500 to-cyan-500',
    detail: ['Earn: アプリ・登録案件で高単価報酬', 'Surveys: 短時間で安定報酬', 'Tasks: 動画視聴・クイズで小銭稼ぎ', 'Rewards: 貯まった報酬を交換'],
  },
  {
    n: 3,
    icon: ClipboardCheck,
    title: 'タスク完了',
    desc: '案件詳細の手順通りに実施。完了確認後、報酬がアカウントに自動付与されます。',
    color: 'from-purple-500 to-pink-500',
    detail: ['案件ページから外部リンクをクリック', '広告主指示の操作（登録・購入・視聴等）', '成果確認後 数分〜数日で報酬反映'],
  },
  {
    n: 4,
    icon: Wallet,
    title: '出金・換金',
    desc: '500円から出金可能。PayPal / 銀行振込 / Amazonギフト券 / 暗号通貨を選択。',
    color: 'from-amber-500 to-yellow-500',
    detail: ['Rewards画面から出金方法を選択', '出金先口座を入力（初回のみ）', '1〜3営業日で支払処理完了'],
  },
]

const TIPS = [
  { icon: ShieldCheck, title: '不正対策にご協力を', desc: '複数アカウント・VPN利用は禁止です。違反するとアカウント凍結の対象になります。' },
  { icon: TrendingUp, title: '紹介で永続報酬', desc: '友達紹介で10%、紹介の紹介で5%の報酬を永久獲得。' },
  { icon: Gift, title: 'デイリーミッション', desc: '毎日ログインしてミッションをこなすと、ボーナス報酬がもらえます。' },
]

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-[#0e1014]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="flex items-center gap-1.5 text-[#b8bcc8] hover:text-green-400 text-sm mb-8 transition-colors">
          <ArrowLeft size={14} />トップへ戻る
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black mb-3">使い方ガイド</h1>
          <p className="text-[#b8bcc8]">登録から出金まで、たった4ステップ</p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-12">
          {STEPS.map(s => (
            <div key={s.n} className="card p-6">
              <div className="flex items-start gap-4">
                <div className={`shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center font-black text-white text-lg shadow-lg`}>
                  {s.n}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon size={18} className="text-green-400" />
                    <h2 className="text-lg md:text-xl font-bold">{s.title}</h2>
                  </div>
                  <p className="text-sm text-[#b8bcc8] mb-3 leading-relaxed">{s.desc}</p>
                  <ul className="space-y-1.5">
                    {s.detail.map((d, i) => (
                      <li key={i} className="text-xs text-[#b8bcc8] flex items-start gap-2">
                        <ArrowRight size={12} className="text-green-400 shrink-0 mt-0.5" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <h2 className="text-xl font-bold mb-4">📌 知っておくと便利なこと</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-12">
          {TIPS.map(t => (
            <div key={t.title} className="card p-5">
              <t.icon size={20} className="text-green-400 mb-3" />
              <h3 className="font-bold text-sm mb-1.5">{t.title}</h3>
              <p className="text-xs text-[#b8bcc8] leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="card p-8 text-center bg-gradient-to-br from-green-500/10 to-amber-500/10 border-green-500/20">
          <h2 className="text-2xl font-black mb-3">準備はOK？</h2>
          <p className="text-sm text-[#b8bcc8] mb-6">無料登録は1分で完了。最低出金500円から。</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="btn-primary px-8 py-3 inline-block">
              無料で登録する →
            </Link>
            <Link href="/faq" className="btn-secondary px-8 py-3 inline-block">
              よくある質問
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
