import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="flex items-center gap-1.5 text-warm-gray-500 hover:text-notion-blue text-sm mb-8 transition-colors">
          <ArrowLeft size={14} />トップへ戻る
        </Link>
        <div className="card p-8">
          <h1 className="text-2xl font-bold mb-2">プライバシーポリシー</h1>
          <p className="text-warm-gray-300 text-xs mb-6">最終更新日: 2025年1月1日</p>

          {[
            {
              title: '第1条（収集する情報）',
              body: 'メールアドレス・ニックネーム・IPアドレス・デバイス情報・行動ログ・出金先口座情報を収集します。これらはサービス提供・不正対策・税務対応の目的で使用します。',
            },
            {
              title: '第2条（情報の利用目的）',
              body: 'サービス提供・改善、本人確認、報酬支払い、不正検知、税務書類作成、マーケティング分析に使用します。第三者への販売・提供は行いません（法令に基づく場合を除く）。',
            },
            {
              title: '第3条（Cookie・トラッキング）',
              body: 'セッション管理・不正検知のためCookieおよびローカルストレージを使用します。成果計測のため、広告主のトラッキングピクセルが設置される場合があります。',
            },
            {
              title: '第4条（情報の保護）',
              body: 'SSL暗号化通信・アクセス制限・定期的なセキュリティ監査を実施します。パスワードはハッシュ化して保存します。',
            },
            {
              title: '第5条（お客様の権利）',
              body: '個人情報の開示・訂正・削除をご要望の場合はサポートへお問い合わせください。アカウント削除後も税務上必要な情報は法定期間保管します。',
            },
            {
              title: '第6条（お問い合わせ）',
              body: 'プライバシーに関するお問い合わせ: support@task-reward.jp',
            },
          ].map(s => (
            <div key={s.title} className="mb-6">
              <h2 className="text-lg font-bold mb-2">{s.title}</h2>
              <p className="text-sm text-warm-gray-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
