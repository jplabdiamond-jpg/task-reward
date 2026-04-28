import Link from 'next/link'
import { ArrowLeft, Target, Shield, Users, Sparkles, FileCheck, Building2 } from 'lucide-react'
import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '会社概要・運営方針 | Tas Money',
  description: 'Tas Money（タスマネ）の運営会社・運営方針・サービス目的・運営体制を明示します。',
}

const VALUES = [
  {
    icon: Target,
    title: 'サービス目的',
    body: 'スマートフォン1台で、誰もが安全に・透明性高く・継続的に副収入を得られる環境を提供すること。動画視聴・アンケート回答・案件申込などの単純タスクを業務委託として整備し、空いた時間を確実な対価に変える「報酬の見える化」を最優先とします。',
  },
  {
    icon: Shield,
    title: '運営方針',
    body: '①報酬の透明性: ASP成果報酬の50%以上をユーザーへ還元、計算ロジックを公開。\n②不正の徹底排除: 自己アフィリ・複アカ・bot行為は検知次第アカウント停止。\n③個人情報の最小取得: ASP広告主には user_id を渡さず click_id（無作為12桁）でのみ突合。\n④法令遵守: 改正個人情報保護法・特定商取引法・景品表示法・資金決済法を遵守し、必要な届出を行います。',
  },
  {
    icon: Users,
    title: '運営体制',
    body: 'プロダクト・カスタマーサポート・コンプライアンスを内製で運営。お問い合わせは原則3営業日以内に有人対応。広告主・ASPからの問い合わせ窓口は support@task-money.net で一元管理しています。',
  },
  {
    icon: FileCheck,
    title: 'コンプライアンス',
    body: '・個人情報保護法に基づく個人情報取扱事業者として安全管理措置を実施\n・特定商取引法に基づく表記を /tokushoho に掲載\n・景品表示法のガイドラインに沿った成果条件・上限の表示\n・反社会的勢力との取引排除に関する規定を整備\n・年間支払額が一定額を超えるユーザーには支払調書を発行',
  },
]

const ROADMAP = [
  { quarter: '2026 Q1', body: 'サービスリリース・国内主要ASP3社接続・初期ユーザー獲得' },
  { quarter: '2026 Q2', body: '提携ASP拡大（仮想通貨・FX・クレカ系）・本人確認(eKYC)実装' },
  { quarter: '2026 Q3', body: 'リファラル機能強化・ランクシステム改善・出金手段拡張（暗号通貨）' },
  { quarter: '2026 Q4', body: '管理画面の高度化・不正検知の自動化・モバイルアプリ化検討' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0e1014]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="flex items-center gap-1.5 text-[#b8bcc8] hover:text-green-400 text-sm mb-8 transition-colors">
          <ArrowLeft size={14} />トップへ戻る
        </Link>

        <div className="card p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={20} className="text-green-400" />
            <h1 className="text-2xl font-bold">会社概要・運営方針</h1>
          </div>
          <p className="text-[#6b7280] text-xs mb-6">最終更新日: 2026年4月29日</p>

          <p className="text-sm text-[#b8bcc8] leading-relaxed mb-6">
            Tas Money（タスマネ）は、スマートフォン1台でできる「動画視聴」「アンケート回答」「案件申込」などのタスクを通じて、誰もが安全に副収入を得られる業務委託型タスク報酬プラットフォームです。<br/>
            本ページでは、サービスを運営する立場として、目的・方針・体制を明示します。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#0e1014] rounded-xl p-4 border border-[rgba(255,255,255,0.04)]">
              <div className="text-xs text-[#6b7280] mb-1">サービス名</div>
              <div className="font-bold text-sm">Tas Money（タスマネ）</div>
            </div>
            <div className="bg-[#0e1014] rounded-xl p-4 border border-[rgba(255,255,255,0.04)]">
              <div className="text-xs text-[#6b7280] mb-1">公式ドメイン</div>
              <div className="font-bold text-sm">task-money.net</div>
            </div>
            <div className="bg-[#0e1014] rounded-xl p-4 border border-[rgba(255,255,255,0.04)]">
              <div className="text-xs text-[#6b7280] mb-1">ローンチ</div>
              <div className="font-bold text-sm">2026年4月</div>
            </div>
            <div className="bg-[#0e1014] rounded-xl p-4 border border-[rgba(255,255,255,0.04)]">
              <div className="text-xs text-[#6b7280] mb-1">サポート窓口</div>
              <div className="font-bold text-sm break-all">support@task-money.net</div>
            </div>
          </div>
        </div>

        {VALUES.map(v => (
          <div key={v.title} className="card p-6 md:p-8 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <v.icon size={18} className="text-green-400" />
              <h2 className="text-lg font-bold">{v.title}</h2>
            </div>
            <p className="text-sm text-[#b8bcc8] leading-relaxed whitespace-pre-line">{v.body}</p>
          </div>
        ))}

        <div className="card p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-green-400" />
            <h2 className="text-lg font-bold">事業ロードマップ</h2>
          </div>
          <div className="space-y-3">
            {ROADMAP.map(r => (
              <div key={r.quarter} className="flex gap-4">
                <div className="w-20 shrink-0 text-xs font-bold text-green-400 pt-0.5">{r.quarter}</div>
                <div className="text-sm text-[#b8bcc8] leading-relaxed flex-1">{r.body}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 md:p-8 mb-6">
          <h2 className="text-lg font-bold mb-3">関連情報</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link href="/tokushoho" className="text-green-400 hover:underline">特定商取引法に基づく表記 →</Link>
            <Link href="/about-rewards" className="text-green-400 hover:underline">報酬・還元率について →</Link>
            <Link href="/terms" className="text-green-400 hover:underline">利用規約 →</Link>
            <Link href="/privacy" className="text-green-400 hover:underline">プライバシーポリシー →</Link>
            <Link href="/guide" className="text-green-400 hover:underline">ご利用ガイド →</Link>
            <Link href="/contact" className="text-green-400 hover:underline">お問い合わせ →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
