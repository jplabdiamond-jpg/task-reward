'use client'

/**
 * CPX Research Script Tag ウォール
 * - ユーザーIDをCPXに渡してアンケートリストを表示
 * - ポストバックはサーバー側 /api/cpx/postback で受信
 */

import { useEffect, useRef } from 'react'

interface Props {
  userId: string      // Supabase user.id をそのまま渡す
  appId?: string      // CPX APP ID (省略時はenv or fallback)
}

const CPX_APP_ID = process.env.NEXT_PUBLIC_CPX_APP_ID || '33111'

export default function CpxSurveyWall({ userId, appId }: Props) {
  const resolvedAppId = appId || CPX_APP_ID
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userId || !resolvedAppId || !containerRef.current) return

    // 既にロード済みのスクリプトを除去（HMR対策）
    const existingScript = document.getElementById('cpx-script')
    if (existingScript) existingScript.remove()

    const script = document.createElement('script')
    script.id = 'cpx-script'
    script.src = `https://t.cpx-research.com/app/api/script-tag/v2/survey-widget.js?app_id=${resolvedAppId}&ext_user_id=${encodeURIComponent(userId)}&output_method=inline&survey_distributor=random&widget_type=wall`
    script.async = true
    script.setAttribute('data-cpx-app-id', resolvedAppId)
    script.setAttribute('data-cpx-ext-user-id', userId)

    document.body.appendChild(script)

    return () => {
      const s = document.getElementById('cpx-script')
      if (s) s.remove()
      // CPXが生成したウィジェットDOMをクリア
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [userId, appId])

  return (
    <div ref={containerRef} id="cpx-survey-widget" className="w-full min-h-[400px]">
      {/* CPX Script Tagがここにアンケートウォールを注入する */}
    </div>
  )
}
