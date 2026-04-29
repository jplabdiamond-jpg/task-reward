import Link from 'next/link'
import { Coins, Gamepad2, ClipboardList, Video, Gift, Shield, TrendingUp, Users, Quote, ChevronRight, HelpCircle } from 'lucide-react'

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

const VOICES = [
  {
    nickname: 'Y.K.さん（28歳・会社員）',
    avatar: 'Y',
    avatarBg: 'from-purple-500 to-blue-500',
    body: 'スマホで動画を見るだけで本当に振り込まれた。最初は半信半疑だったけど、PayPayに即日反映されて感動。今は通勤中の習慣になってます。',
    earned: '¥18,400 / 月',
  },
  {
    nickname: 'M.S.さん（35歳・主婦）',
    avatar: 'M',
    avatarBg: 'from-pink-500 to-rose-500',
    body: '子どもが寝た後にアンケートを回答するだけ。家事の合間で月¥10,000は超えてます。報酬の計算が透明で、ASP承認まで何日かかるか明示されているのが好印象。',
    earned: '¥12,800 / 月',
  },
  {
    nickname: 'T.H.さん（42歳・自営業）',
    avatar: 'T',
    avatarBg: 'from-emerald-500 to-teal-500',
    body: 'クレカ案件で1件¥8,000の還元を受けた。広告主直案件と比べても還元率が高くて、副業として割が良いです。サポートのレスも早い。',
    earned: '¥38,200 / 月',
  },
]

const SAMPLE_OFFERS = [
  { type: '仮想通貨取引所', title: 'Bybit 口座開設＋初回入金', reward: '¥12,000', lead: '即時〜3日', emoji: '₿' },
  { type: 'クレジットカード', title: '楽天カード 新規発行', reward: '¥8,500', lead: '30〜60日', emoji: '💳' },
  { type: 'アンケート', title: '5分アンケート（生活全般）', reward: '¥120', lead: '即時', emoji: '📋' },
  { type: 'アプリ', title: 'メルカリ 新規登録＋出品', reward: '¥800', lead: '1〜7日', emoji: '📱' },
]

const FAQ_PREVIEW = [
  { q: 'Tas Moneyは無料で利用できますか？', a: '完全無料です。登録費用・月額費用・出金手数料いずれも無料です。' },
  { q: '報酬はいつ付与されますか？', a: '案件種別により即時〜90日。詳細は各案件詳細とabout-rewardsで明示しています。' },
  { q: '最低出金額はいくら？', a: '¥1,000から。PayPay/銀行振込/Amazonギフト券を選択できます。' },
  { q: '海外在住でも利用できますか？', a: '現在は日本国内在住の方のみ対象です。ASP案件の多くが日本国内対象のためです。' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0e1014]">
      {/* Nav */}
      <nav className="border-b border-[#2a2f3d] bg-[#0e1014]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Tas Money" className="w-14 h-14 rounded-xl object-cover" />
            <span className="font-black text-lg tracking-tight">Tas Money</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <Link href="/guide" className="px-3 py-2 text-sm font-semibold text-[#b8bcc8] hover:text-white transition-colors">使い方</Link>
            <Link href="/faq" className="px-3 py-2 text-sm font-semibold text-[#b8bcc8] hover:text-white transition-colors">FAQ</Link>
            <Link href="/news" className="px-3 py-2 text-sm font-semibold text-[#b8bcc8] hover:text-white transition-colors">お知らせ</Link>
            <Link href="/contact" className="px-3 py-2 text-sm font-semibold text-[#b8bcc8] hover:text-white transition-colors">問い合わせ</Link>
          </div>
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

      {/* Voices: 利用者の声 */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">利用者の声</h2>
          <p className="text-[#b8bcc8]">実際にTas Moneyで稼いでいる方々のリアルな体験談</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {VOICES.map(v => (
            <div key={v.nickname} className="card p-6">
              <Quote className="text-green-400 mb-3" size={20} />
              <p className="text-sm text-[#e5e7eb] leading-relaxed mb-5">{v.body}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${v.avatarBg} flex items-center justify-center font-black text-white text-lg`}>
                  {v.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">{v.nickname}</div>
                  <div className="text-xs text-green-400 font-bold mt-0.5">{v.earned}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-[#6b7280] mt-6">
          ※ 個人の体験談であり、すべての方が同じ収益を保証するものではありません
        </p>
      </section>

      {/* Sample Offers: 案件サンプル */}
      <section className="bg-[#171a21] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">案件サンプル</h2>
            <p className="text-[#b8bcc8]">高単価から手軽な案件まで、500件以上から選べる</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {SAMPLE_OFFERS.map(o => (
              <div key={o.title} className="card card-hover p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{o.emoji}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-pill bg-[#0e1014] text-[#b8bcc8]">{o.type}</span>
                </div>
                <h3 className="font-bold text-sm mb-3 leading-tight">{o.title}</h3>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[10px] text-[#6b7280]">獲得報酬</div>
                    <div className="text-xl font-black text-green-400">{o.reward}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#6b7280]">承認まで</div>
                    <div className="text-xs font-bold text-[#b8bcc8]">{o.lead}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/about-rewards" className="inline-flex items-center gap-1 text-sm font-semibold text-green-400 hover:underline">
              還元率と承認リードタイムの詳細 <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">よくあるご質問</h2>
          <p className="text-[#b8bcc8]">登録前に知っておきたい4つの質問</p>
        </div>
        <div className="space-y-3">
          {FAQ_PREVIEW.map(f => (
            <div key={f.q} className="card p-5">
              <div className="flex items-start gap-3 mb-2">
                <HelpCircle size={18} className="text-green-400 mt-0.5 shrink-0" />
                <h3 className="font-bold text-sm">{f.q}</h3>
              </div>
              <p className="text-xs text-[#b8bcc8] leading-relaxed pl-7">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/faq" className="inline-flex items-center gap-1 text-sm font-semibold text-green-400 hover:underline">
            すべての質問を見る（24件以上） <ChevronRight size={16} />
          </Link>
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
      <footer className="border-t border-[#2a2f3d] mt-12">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/logo.png" alt="Tas Money" className="w-12 h-12 rounded-xl object-cover" />
                <span className="font-black text-base">Tas Money</span>
              </div>
              <p className="text-xs text-[#6b7280] leading-relaxed mb-3">
                タスクで稼ぐ業務委託型報酬プラットフォーム
              </p>
              <div className="flex items-center gap-2">
                <a href="https://x.com/TasMoney2026" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)"
                   className="w-8 h-8 rounded-lg bg-[#1a1d24] hover:bg-[#2a2f3d] flex items-center justify-center text-[#b8bcc8] hover:text-white transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="mailto:support@task-money.net" aria-label="Email"
                   className="w-8 h-8 rounded-lg bg-[#1a1d24] hover:bg-[#2a2f3d] flex items-center justify-center text-[#b8bcc8] hover:text-white transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-3">サービス</h3>
              <ul className="space-y-2 text-xs">
                <li><Link href="/guide" className="text-[#b8bcc8] hover:text-white transition-colors">使い方ガイド</Link></li>
                <li><Link href="/about-rewards" className="text-[#b8bcc8] hover:text-white transition-colors">報酬・還元率</Link></li>
                <li><Link href="/faq" className="text-[#b8bcc8] hover:text-white transition-colors">よくある質問</Link></li>
                <li><Link href="/news" className="text-[#b8bcc8] hover:text-white transition-colors">お知らせ</Link></li>
                <li><Link href="/signup" className="text-[#b8bcc8] hover:text-white transition-colors">新規登録</Link></li>
                <li><Link href="/login" className="text-[#b8bcc8] hover:text-white transition-colors">ログイン</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-3">サポート</h3>
              <ul className="space-y-2 text-xs">
                <li><Link href="/contact" className="text-[#b8bcc8] hover:text-white transition-colors">お問い合わせ</Link></li>
                <li><a href="mailto:support@task-money.net" className="text-[#b8bcc8] hover:text-white transition-colors break-all">support@task-money.net</a></li>
                <li><a href="https://x.com/TasMoney2026" target="_blank" rel="noopener noreferrer" className="text-[#b8bcc8] hover:text-white transition-colors">公式X</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-3">運営情報</h3>
              <ul className="space-y-2 text-xs">
                <li><Link href="/about" className="text-[#b8bcc8] hover:text-white transition-colors">会社概要・運営方針</Link></li>
                <li><Link href="/terms" className="text-[#b8bcc8] hover:text-white transition-colors">利用規約</Link></li>
                <li><Link href="/privacy" className="text-[#b8bcc8] hover:text-white transition-colors">プライバシーポリシー</Link></li>
                <li><Link href="/tokushoho" className="text-[#b8bcc8] hover:text-white transition-colors">特定商取引法に基づく表記</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-[#2a2f3d] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6b7280]">
            <span>© 2026 Tas Money. All rights reserved.</span>
            <span>運営: 株式会社タスマネ（仮）</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
