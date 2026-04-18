import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="flex items-center gap-1.5 text-warm-gray-500 hover:text-notion-blue text-sm mb-8 transition-colors">
          <ArrowLeft size={14} />トップへ戻る
        </Link>
        <div className="card p-8 prose prose-sm max-w-none">
          <h1 className="text-2xl font-bold mb-2">利用規約・業務委託基本契約</h1>
          <p className="text-warm-gray-300 text-xs mb-6">最終更新日: 2025年1月1日</p>

          <h2 className="text-lg font-bold mt-6 mb-2">第1条（本サービスについて）</h2>
          <p className="text-sm text-warm-gray-500 leading-relaxed">
            TaskReward（以下「本サービス」）は、ユーザーが指定のタスク（動画視聴・クイズ回答・申込等）を完了することで報酬を獲得できる業務委託型プラットフォームです。
            本サービスにおける報酬の支払いは、民法上の業務委託契約に基づくものであり、ポイント制ではなく金銭報酬として取り扱います。
          </p>

          <h2 className="text-lg font-bold mt-6 mb-2">第2条（業務委託契約の成立）</h2>
          <p className="text-sm text-warm-gray-500 leading-relaxed">
            ユーザーが本規約に同意して会員登録を完了した時点で、運営者とユーザーの間に業務委託基本契約が成立します。
            各案件への応募時に個別業務委託契約が成立するものとします。
          </p>

          <h2 className="text-lg font-bold mt-6 mb-2">第3条（報酬について）</h2>
          <p className="text-sm text-warm-gray-500 leading-relaxed">
            報酬は、広告主から受け取るASP報酬の一定割合（通常50%以上）をユーザーに還元します。
            報酬は成果確認後に付与され、出金申請後1〜3営業日以内に指定の方法で支払います。
            年間報酬支払額が50万円を超える場合は、支払調書を発行します。
          </p>

          <h2 className="text-lg font-bold mt-6 mb-2">第4条（禁止事項）</h2>
          <ul className="text-sm text-warm-gray-500 space-y-1 list-disc list-inside">
            <li>複数アカウントの作成・使用</li>
            <li>VPN・プロキシ等による不正アクセス</li>
            <li>BOTや自動化ツールの使用</li>
            <li>虚偽の申込・個人情報の提供</li>
            <li>その他不正な手段による報酬の取得</li>
          </ul>
          <p className="text-sm text-warm-gray-500 mt-2">
            禁止事項に違反した場合、アカウント停止・報酬没収・法的措置を取ることがあります。
          </p>

          <h2 className="text-lg font-bold mt-6 mb-2">第5条（税務上の取り扱い）</h2>
          <p className="text-sm text-warm-gray-500 leading-relaxed">
            本サービスで獲得した報酬は、雑所得として確定申告の対象となる場合があります。
            年間20万円超の報酬を獲得した場合は確定申告が必要です。税務処理はユーザー自身の責任で行ってください。
          </p>

          <h2 className="text-lg font-bold mt-6 mb-2">第6条（免責事項）</h2>
          <p className="text-sm text-warm-gray-500 leading-relaxed">
            運営者は、広告主のサービス内容・品質について一切の責任を負いません。
            案件の予告なき終了・報酬額変更が生じる場合があります。
          </p>

          <div className="mt-8 p-4 bg-warm-white rounded-xl text-xs text-warm-gray-300">
            <p>運営者: TaskReward運営事務局</p>
            <p>お問い合わせ: support@task-reward.jp</p>
          </div>
        </div>
      </div>
    </div>
  )
}
