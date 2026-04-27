import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'TaskReward — Earn rewards by completing tasks',
  description: 'タスク・アンケート・動画視聴で報酬を獲得。PayPal・暗号通貨・ギフトカードへ即時交換。',
  keywords: ['副業', '報酬', 'タスク', 'アンケート', 'ポイ活', '稼ぐ', 'offerwall'],
  openGraph: {
    title: 'TaskReward',
    description: 'Earn rewards by completing tasks',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0e1014',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${inter.variable} dark`}>
      <body className="bg-[#0e1014] text-white">{children}</body>
    </html>
  )
}
