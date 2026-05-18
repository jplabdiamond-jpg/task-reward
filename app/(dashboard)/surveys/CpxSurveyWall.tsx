'use client'

/**
 * CPX Research iframe ウォール
 * - offers.cpx-research.com のiframeでアンケートリストを表示
 * - ポストバックはサーバー側 /api/cpx/postback で受信
 */

interface Props {
  userId: string
  appId?: string
}

const CPX_APP_ID = process.env.NEXT_PUBLIC_CPX_APP_ID || '33111'

export default function CpxSurveyWall({ userId, appId }: Props) {
  const resolvedAppId = appId || CPX_APP_ID
  const src = `https://offers.cpx-research.com/index.php?app_id=${resolvedAppId}&ext_user_id=${encodeURIComponent(userId)}`

  return (
    <iframe
      src={src}
      width="100%"
      frameBorder="0"
      height="2000px"
      style={{ border: 'none', minHeight: '400px' }}
      title="CPX Research アンケート"
    />
  )
}
