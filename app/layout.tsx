import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'TaskReward | タスクをこなして報酬を稼ごう',
  description: '動画視聴・タスク完了・アクションで本当に稼げる報酬サービス。業務委託形式で安心安全。',
  keywords: ['副業', '報酬', 'タスク', '動画視聴', 'ポイントサイト', '稼ぐ'],
  openGraph: {
    title: 'TaskReward',
    description: 'タスクをこなして報酬を稼ごう',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
