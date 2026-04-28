import Link from 'next/link'
import { ArrowLeft, Coins, Clock, AlertTriangle, CheckCircle2, XCircle, Wallet, Percent } from 'lucide-react'
import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '報酬・還元率について | Tas Money',
  description: 'Tas Money（タスマネ）の報酬還元率・承認リードタイム・否認可能性・出金条件を全て公開します。',
}

const FLOW_STEPS = [
  { step: 1, title: '案件をクリック', body: 'ユーザーが案件詳細から「サイトへ移動」をクリック。click_idがASPに送信されます（user_idは送信しません）。' },
  { step: 2, title: 'ASP/広告主側で成果発生', body: '対象アクション（口座開設・アプリ登録・取引・購入等）を完了。' },
  { step: 3, title: '当社へWebhook通知', body: 'ASPから当社にPostback。click_idでユーザーを特定し「未確定報酬」として記録。' },
  { step: 4, title: 'ASP側で承認/否認判定', body: '広告主が条件達成を確認し「承認」または「否認」を確定（リードタイムは案件種別による）。' },
  { step: 5, title: '確定残高に反映', body: '承認時のみ確定残高に加算。出金可能になります。否認時は未確定残高から減算され通知メールを送信します。' },
]

const APPROVAL_LEAD = [
  { type: '動画視聴・クイズ・アンケート', lead: '即時〜7日', icon: '⚡' },
  { type: '無料アプリ登録', lead: '1〜14日', icon: '📱' },
  { type: '仮想通貨・暗号資産取引所', lead: '即時〜数日', icon: '₿' },
  { type: 'FX口座開設・取引', lead: '30〜90日', icon: '📈' },
  { type: 'クレジットカード発行', lead: '30〜90日', icon: '💳' },
  { type: '商品購入・サービス契約', lead: '14〜45日', icon: '🛍️' },
]

const REJECTION_REASONS = [
  '申込条件未達（取引額未達・カード発行審査落ち・アプリ未起動 等）',
  '本人確認書類の不備・申込情報の虚偽',
  '指定期間内のキャンセル・解約',
  '重複申込・自己アフィリ判定・不正検知',
  '広告主側のシステム不具合・条件変更（事後変更含む）',
]

export default function AboutRewardsPage() {
  return (
    <div className="min-h-screen bg-[#0e1014]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="flex items-center gap-1.5 text-[#b8bcc8] hover:text-green-400 text-sm mb-8 transition-colors">
          <ArrowLeft size={14} />トップへ戻る
        </Link>

        <div className="card p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Coins size={20} className="text-green-400" />
            <h1 className="text-2xl font-bold">報酬・還元率について</h1>
          </div>
          <p className="text-[#6b7280] text-xs mb-6">最終更新日: 2026年4月29日</p>

          <p className="text-sm text-[#b8bcc8] leading-relaxed">
            Tas Moneyでは、報酬体系を完全に公開しています。<br/>
            「いくらもらえるのか」「いつ確定するのか」「どんな時に否認されるのか」を<strong className="text-white">登録前に</strong>すべて確認できます。
          </p>
        </div>

        {/* 還元率 */}
        <div className="card p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Percent size={18} className="text-green-400" />
            <h2 className="text-lg font-bold">還元率: ASP成果報酬の50%以上</h2>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30 rounded-xl p-5 mb-4">
            <div className="text-xs text-[#b8bcc8] mb-2">例: ASPから10,000円の成果報酬を受領した場合</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0e1014] rounded-lg p-3 text-center">
                <div className="text-[10px] text-[#6b7280] mb-1">ユーザー報酬</div>
                <div className="text-2xl font-black text-green-400">¥5,000<span className="text-sm">〜</span></div>
                <div className="text-[10px] text-[#b8bcc8] mt-1">50%以上</div>
              </div>
              <div className="bg-[#0e1014] rounded-lg p-3 text-center">
                <div className="text-[10px] text-[#6b7280] mb-1">運営側</div>
                <div className="text-2xl font-black text-[#b8bcc8]">¥5,000<span className="text-sm">以下</span></div>
                <div className="text-[10px] text-[#b8bcc8] mt-1">サーバ・CS・反社チェック等</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-[#b8bcc8] leading-relaxed">
            高単価案件（FX/クレカ/暗号資産）では <strong className="text-white">最大80%</strong> までユーザーへ還元する場合があります。実際の獲得額は案件詳細ページに <strong className="text-white">税込円単位</strong> で明示されます。
          </p>

          <p className="text-xs text-[#6b7280] leading-relaxed mt-3">
            ※ リファラル報酬は別途、紹介者に1段階目10% / 2段階目5% を上記とは別に付与します。
          </p>
        </div>

        {/* 報酬フロー */}
        <div className="card p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-green-400" />
            <h2 className="text-lg font-bold">報酬発生から出金までの流れ</h2>
          </div>
          <div className="space-y-3">
            {FLOW_STEPS.map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {s.step}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{s.title}</div>
                  <div className="text-xs text-[#b8bcc8] mt-1 leading-relaxed">{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 承認リードタイム */}
        <div className="card p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} className="text-green-400" />
            <h2 className="text-lg font-bold">案件種別ごとの承認リードタイム</h2>
          </div>
          <div className="space-y-2">
            {APPROVAL_LEAD.map(a => (
              <div key={a.type} className="flex items-center justify-between bg-[#0e1014] rounded-lg p-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{a.icon}</span>
                  <span className="text-sm">{a.type}</span>
                </div>
                <span className="text-xs font-bold text-green-400">{a.lead}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#6b7280] leading-relaxed mt-3">
            ※ リードタイム中は「未確定残高」として表示され、出金できません。各案件の詳細ページで個別の目安日数を表示しています。
          </p>
        </div>

        {/* 否認可能性 */}
        <div className="card p-6 md:p-8 mb-6 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-orange-400" />
            <h2 className="text-lg font-bold">否認の可能性について（重要）</h2>
          </div>

          <p className="text-sm text-[#b8bcc8] leading-relaxed mb-4">
            ASP成果報酬型サービスの構造上、<strong className="text-white">広告主による事後否認は避けられません</strong>。Tas Moneyではこれを隠さず、登録前に明示します。
          </p>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={14} className="text-orange-400" />
              <span className="text-sm font-bold text-orange-400">否認となる主なケース</span>
            </div>
            <ul className="space-y-1.5">
              {REJECTION_REASONS.map(r => (
                <li key={r} className="text-xs text-[#b8bcc8] flex gap-2">
                  <span className="text-orange-400 shrink-0">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-[#b8bcc8] leading-relaxed">
            否認発生時は未確定残高から減算され、メールでお知らせします。確定残高にすでに算入されていた場合は確定残高からも減算します。<br/>
            （詳細は<Link href="/terms" className="text-green-400 hover:underline">利用規約 第8条の2</Link>に記載）
          </p>
        </div>

        {/* 出金 */}
        <div className="card p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={18} className="text-green-400" />
            <h2 className="text-lg font-bold">出金条件</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#0e1014] rounded-xl p-4">
              <div className="text-xs text-[#6b7280] mb-1">最低出金額</div>
              <div className="text-xl font-bold text-green-400">¥1,000</div>
            </div>
            <div className="bg-[#0e1014] rounded-xl p-4">
              <div className="text-xs text-[#6b7280] mb-1">処理時間</div>
              <div className="text-xl font-bold">1〜3営業日</div>
            </div>
            <div className="bg-[#0e1014] rounded-xl p-4">
              <div className="text-xs text-[#6b7280] mb-1">振込手数料</div>
              <div className="text-xl font-bold">無料</div>
              <div className="text-[10px] text-[#6b7280] mt-0.5">※運営負担</div>
            </div>
            <div className="bg-[#0e1014] rounded-xl p-4">
              <div className="text-xs text-[#6b7280] mb-1">出金手段</div>
              <div className="text-sm font-bold">PayPay / 銀行 / Amazonギフト</div>
            </div>
          </div>
          <p className="text-xs text-[#6b7280] leading-relaxed">
            年間支払額が一定額（雑所得20万円相当）を超えた場合、当社から税務署へ支払調書を提出します。確定申告はユーザー自身の責任で実施してください。
          </p>
        </div>

        <div className="card p-6 md:p-8">
          <h2 className="text-lg font-bold mb-3">よくあるご質問</h2>
          <p className="text-sm text-[#b8bcc8] mb-4">
            その他、報酬・出金・否認に関するご質問は<Link href="/faq" className="text-green-400 hover:underline">FAQ</Link>または<Link href="/contact" className="text-green-400 hover:underline">お問い合わせ</Link>より承ります。
          </p>
          <Link href="/signup" className="btn-primary inline-block px-6 py-2.5 text-sm">無料で始める →</Link>
        </div>
      </div>
    </div>
  )
}
