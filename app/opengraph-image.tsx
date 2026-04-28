import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Tas Money — タスクで稼ぐ'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0e1014 0%, #1a2922 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: 80,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 56,
            fontWeight: 900,
            color: '#0a0f0d',
            marginBottom: 40,
          }}
        >
          TM
        </div>
        <div style={{ fontSize: 80, fontWeight: 900, letterSpacing: -2, marginBottom: 16 }}>
          Tas Money
        </div>
        <div style={{ fontSize: 36, color: '#34d399', fontWeight: 700, marginBottom: 24 }}>
          タスクで稼ぐ。リアルマネー。
        </div>
        <div style={{ fontSize: 26, color: '#b8bcc8' }}>
          最低出金 ¥500・即時付与・業界最高還元率
        </div>
      </div>
    ),
    size,
  )
}
