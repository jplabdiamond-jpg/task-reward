import Link from 'next/link'
import { TrendingUp, Shield, Zap, Star, Users, Award } from 'lucide-react'

const STATS = [
  { label: '累計支払い報酬', value: '¥2.4億+' },
  { label: '登録ユーザー数', value: '85,000+' },
  { label: '平均時給換算', value: '¥2,800' },
  { label: '案件数', value: '500+' },
]

const FEATURES = [
  {
    icon: TrendingUp,
    title: '本当に稼げる設計',
    desc: '動画視聴だけでは報酬ゼロ。行動（登録・申込）が伴った成果報酬のみ。業界最高水準の還元率50%以上。',
  },
  {
    icon: Zap,
    title: 'AIが最適案件を推薦',
    desc: 'あなたのプロフィール・実績・スキルをAIが分析。CV率×単価×難易度でスコアリングした「今やるべき案件」を提示。',
  },
  {
    icon: Shield,
    title: '安心の業務委託契約',
    desc: 'ポイントではなく「報酬」として支払い。業務委託契約書発行、支払調書対応。法律に準拠した安全な仕組み。',
  },
  {
    icon: Star,
    title: 'レベル・ランクシステム',
    desc: '実績を積んでランクアップ。上位ランクほど高単価案件が解放。継続インセンティブで毎日稼ぐ動機を維持。',
  },
  {
    icon: Users,
    title: '2段階リファラル報酬',
    desc: '友達を紹介すると紹介報酬。友達が稼いだ金額の一部もあなたに。紹介の紹介（2段階目）も報酬対象。',
  },
  {
    icon: Award,
    title: '即日出金対応',
    desc: '最低出金額1,000円から申請可能。PayPay・銀行振込・Amazonギフト券に対応。最短即日振込。',
  },
]

const FLOW = [
  { step: '01', title: '案件を選ぶ', desc: 'AIが推薦する高CV率・高単価案件をチェック' },
  { step: '02', title: '動画を視聴', desc: '案件の詳細動画を最後まで視聴（スキップ不可）' },
  { step: '03', title: 'クイズに正解', desc: '理解度確認クイズに正解して知識を証明' },
  { step: '04', title: 'アクションを実行', desc: '登録・申込などのCTAを実行' },
  { step: '05', title: '報酬を受け取る', desc: '成果確認後に報酬を即時付与・出金申請可能' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-[rgba(0,0,0,0.1)] bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-notion-blue rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">TR</span>
            </div>
            <span className="font-bold text-[rgba(0,0,0,0.95)]">TaskReward</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-warm-gray-500 hover:text-[rgba(0,0,0,0.95)] transition-colors">
              ログイン
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              無料で始める
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 badge mb-6">
          <span>🎯</span>
          <span>業務委託型 タスク報酬サービス</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-[-2px] mb-6">
          タスクをこなして
          <br />
          <span className="text-notion-blue">本当に稼げる</span>
          <br />
          副業プラットフォーム
        </h1>
        <p className="text-lg md:text-xl text-warm-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          動画視聴＋行動（登録・申込）で報酬獲得。業務委託契約で安心安全。
          AIが最適案件を推薦し、初心者でも月3万円以上稼ぐユーザー続出。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className="btn-primary text-base px-8 py-3">
            今すぐ無料登録 →
          </Link>
          <Link href="#flow" className="btn-secondary text-base px-8 py-3">
            仕組みを見る
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
          {STATS.map(s => (
            <div key={s.label} className="card p-5 text-center">
              <div className="text-2xl md:text-3xl font-bold text-notion-blue mb-1">{s.value}</div>
              <div className="text-xs text-warm-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-warm-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-heading mb-3">競合を超える6つの特徴</h2>
            <p className="text-warm-gray-500">Swagbucks・ポイントサイトでは実現できない体験</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-6">
                <div className="w-10 h-10 bg-badge-blue-bg rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-notion-blue" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-warm-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section id="flow" className="py-20 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="section-heading mb-3">5ステップで報酬を獲得</h2>
          <p className="text-warm-gray-500">迷わず行動できるシンプルなフロー</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          {FLOW.map((f, i) => (
            <div key={f.step} className="flex-1 card p-5 relative">
              {i < FLOW.length - 1 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-warm-gray-300">→</div>
              )}
              <div className="text-3xl font-bold text-notion-blue mb-3">{f.step}</div>
              <div className="font-semibold mb-1">{f.title}</div>
              <div className="text-xs text-warm-gray-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-notion-blue py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">今すぐ稼ぎ始めよう</h2>
        <p className="text-blue-100 mb-8">登録無料・最短5分で報酬獲得開始</p>
        <Link href="/signup" className="bg-white text-notion-blue font-bold px-10 py-4 rounded-xl hover:bg-gray-50 transition-colors inline-block">
          無料でアカウント作成 →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(0,0,0,0.1)] py-8 text-center text-xs text-warm-gray-300">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-6">
          <Link href="/terms" className="hover:text-warm-gray-500">利用規約</Link>
          <Link href="/privacy" className="hover:text-warm-gray-500">プライバシーポリシー</Link>
          <Link href="/legal" className="hover:text-warm-gray-500">特定商取引法</Link>
          <span>© 2025 TaskReward</span>
        </div>
      </footer>
    </div>
  )
}
