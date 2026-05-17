import { createClient } from '@/lib/supabase/server'
import { ClipboardList } from 'lucide-react'
import CpxSurveyWall from './CpxSurveyWall'

export const dynamic = 'force-dynamic'

export default async function SurveysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cpxAppId = process.env.NEXT_PUBLIC_CPX_APP_ID ?? ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Surveys</h1>
        <p className="text-[#b8bcc8]">アンケートに回答して安定報酬を獲得</p>
      </div>

      {/* CPX Research アンケートウォール */}
      {user ? (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={18} className="text-blue-400" />
            <span className="font-bold text-sm">アンケート一覧</span>
            <span className="badge-blue text-[10px]">CPX Research</span>
          </div>
          <CpxSurveyWall userId={user.id} appId={cpxAppId} />
        </div>
      ) : (
        <div className="card p-10 text-center text-[#6b7280]">
          アンケートを表示するにはログインが必要です
        </div>
      )}
    </div>
  )
}
