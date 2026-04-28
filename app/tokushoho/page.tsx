import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記 | Tas Money',
  description: 'Tas Moneyの特定商取引法に基づく表記。事業者情報・支払方法・支払時期等。',
}

const ROWS: { label: string; value: string }[] = [
  { label: '販売事業者', value: '株式会社タスマネ（仮）※法人登記後に正式表記へ更新' },
  { label: '運営統括責任者', value: '代表取締役（法人登記完了後に記載）' },
  { label: '所在地', value: '〒———— 法人登記住所（請求があれば遅滞なく開示）' },
  { label: '電話番号', value: '請求があった場合に遅滞なく開示します' },
  { label: 'メールアドレス', value: 'support@task-money.net' },
  { label: 'サイトURL', value: 'https://task-money.net' },
  { label: 'サービスの種類', value: '業務委託型タスク報酬プラットフォームの提供' },
  { label: '販売価格', value: '本サービスの利用は無料です。各案件の報酬額は当該案件詳細ページに明示します。' },
  { label: '報酬の支払方法', value: 'PayPal / 銀行振込 / Amazonギフト券 / 暗号通貨（USDT等）から選択' },
  { label: '報酬の支払時期', value: '出金申請後、原則1〜3営業日以内に支払処理を実行' },
  { label: '最低出金額', value: '500円相当より' },
  { label: '役務の提供時期', value: 'タスク完了・成果確認後、ユーザーアカウントへ即時付与' },
  { label: '返品・キャンセルについて', value: 'デジタル役務の性質上、付与後の取消・返金は原則として対応致しかねます。ただし当社の責に帰すべき不具合がある場合はこの限りではありません。' },
  { label: '動作環境', value: 'Chrome / Safari / Firefox / Edge の最新版（モバイル含む）' },
  { label: '免責事項', value: '広告主側の都合による案件の予告なき終了・報酬条件の変更が生じる場合があります。' },
]

export default function TokushohoPage() {
  return (
    <div className="min-h-screen bg-[#0e1014]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="flex items-center gap-1.5 text-[#b8bcc8] hover:text-green-400 text-sm mb-8 transition-colors">
          <ArrowLeft size={14} />トップへ戻る
        </Link>
        <div className="card p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-2">特定商取引法に基づく表記</h1>
          <p className="text-[#6b7280] text-xs mb-6">最終更新日: 2026年4月28日</p>

          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <tbody>
                {ROWS.map(r => (
                  <tr key={r.label} className="border-b border-[#2a2f3d]">
                    <th className="text-left py-3 px-2 align-top font-semibold text-white w-[40%] md:w-[30%]">
                      {r.label}
                    </th>
                    <td className="py-3 px-2 text-[#b8bcc8] leading-relaxed">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 p-4 bg-[#0e1014] rounded-xl text-xs text-[#6b7280] leading-relaxed">
            <p>本表記は特定商取引法第11条および同法施行規則第8条に基づき表示しています。</p>
            <p className="mt-1">事業者の所在地・電話番号は、購入者・取引相手からの請求があった場合に遅滞なく開示いたします。開示請求は <Link href="/contact" className="text-green-400 hover:underline">お問い合わせフォーム</Link> よりお願いいたします。</p>
          </div>
        </div>
      </div>
    </div>
  )
}
