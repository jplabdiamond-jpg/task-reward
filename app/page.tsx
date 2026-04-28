import Link from 'next/link'
import { Coins, Gamepad2, ClipboardList, Video, Gift, Shield, TrendingUp, Users } from 'lucide-react'

const STATS = [
  { label: '累計支払い', value: '$2.4M+' },
  { label: 'アクティブユーザー', value: '85,000+' },
  { label: '案件数', value: '500+' },
  { label: '平均報酬/日', value: '$3.20' },
]

const EARN_TILES = [
  { icon: Gamepad2, title: 'Offerwall', desc: 'アプリインストール・ゲーム・登録案件で稼ぐ', color: 'text-green-400', bg: 'bg-green-500/10' },
  { icon: ClipboardList, title: 'Surveys', desc: 'アンケート回答で安定報酬', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Video, title: 'Tasks', desc: '動画視聴＋クイズ＋CTAでミッション達成', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: Gift, title: 'Rewards', desc: 'PayPal/暗号通貨/ギフトカードに即時交換', color: 'text-amber-400', bg: 'bg-amber-500/10' },
]

const FEATURES = [
  { icon: Shield, title: '業務委託契約', desc: 'ポイントではなく「報酬」として支払い。法律準拠の安全な仕組み。' },
  { icon: TrendingUp, title: '50%還元', desc: 'ASP成果報酬の50%以上をユーザーに還元。業界最高水準。' },
  { icon: Users, title: '2段階リファラル', desc: '友達紹介で10%、紹介の紹介で5%の永続報酬。' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0e1014]">
      {/* Nav */}
      <nav className="border-b border-[#2a2f3d] bg-[#0e1014]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center font-black text-black">
              TM
            </div>
            <span className="font-black text-lg tracking-tight">Tas Money</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:inline px-4 py-2 text-sm font-semibold text-[#b8bcc8] hover:text-white transition-colors">
              ログイン
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              無料で始める
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-bold mb-6">
            <Coins size={14} /> 報酬即時付与・最低出金 ¥500
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            タスクで稼ぐ。
            <br />
            <span className="bg-gradient-to-r from-green-400 to-amber-400 bg-clip-text text-transparent">
              リアルマネー。
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[#b8bcc8] mb-10 leading-relaxed">
            アプリインストール、アンケート、動画視聴で報酬獲得。
            <br className="hidden sm:block" />
            PayPal・暗号通貨・ギフトカードへ即時交換可能。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="btn-primary text-base px-8 py-4 glow-green">
              今すぐ無料で稼ぐ →
            </Link>
            <Link href="#how" className="btn-secondary text-base px-8 py-4">
              仕組みを見る
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-14">
            {STATS.map(s => (
              <div key={s.label} className="stat-tile text-center">
                <div className="text-xl md:text-2xl font-black text-green-400 mb-0.5">{s.value}</div>
                <div className="text-xs text-[#6b7280]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earn Methods */}
      <section id="how" className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">4つの稼ぎ方</h2>
          <p className="text-[#b8bcc8]">あなたに合った方法で報酬を獲得</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {EARN_TILES.map(t => (
            <div key={t.title} className="card card-hover p-6">
              <div className={`w-12 h-12 ${t.bg} rounded-xl flex items-center justify-center mb-4`}>
                <t.icon className={t.color} size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">{t.title}</h3>
              <p className="text-sm text-[#b8bcc8] leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#171a21] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">なぜ Tas Money？</h2>
            <p className="text-[#b8bcc8]">他のポイ活サービスとは違う、本気の報酬プラットフォーム</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-6">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="text-green-400" size={20} />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-[#b8bcc8] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="card p-10 md:p-16 bg-gradient-to-br from-green-500/10 to-amber-500/10 border-green-500/20">
          <h2 className="text-3xl md:text-5xl font-black mb-4">今すぐ稼ぎ始めよう</h2>
          <p className="text-[#b8bcc8] mb-8 text-lg">登録無料・最短5分で報酬獲得開始</p>
          <Link href="/signup" className="btn-primary text-base px-10 py-4 glow-green inline-block">
            無料アカウント作成 →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2f3d] py-8 text-center text-xs text-[#6b7280]">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-6">
          <Link href="/terms" className="hover:text-white transition-colors">利用規約</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link>
          <span>© 2026 Tas Money</span>
        </div>
      </footer>
    </div>
  )
}
