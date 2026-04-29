import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const SITE_URL = 'https://task-money.net'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Tas Money（タスマネ）| タスクで稼ぐ報酬プラットフォーム',
    template: '%s | Tas Money',
  },
  description: 'タスク・アンケート・動画視聴で報酬を獲得できる業務委託型プラットフォーム。PayPal・銀行振込・Amazonギフト券・暗号通貨へ最低500円から即時交換可能。',
  keywords: ['副業', '報酬', 'タスク', 'アンケート', 'ポイ活', '稼ぐ', 'offerwall', 'タスマネ', 'Tas Money', '高報酬', '在宅', 'スキマ時間'],
  applicationName: 'Tas Money',
  authors: [{ name: 'Tas Money 運営事務局' }],
  creator: 'Tas Money',
  publisher: 'Tas Money',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: SITE_URL,
    siteName: 'Tas Money',
    title: 'Tas Money（タスマネ）| タスクで稼ぐ報酬プラットフォーム',
    description: 'タスク・アンケート・動画視聴で報酬を獲得。PayPal・銀行振込・Amazonギフト券へ最低500円から即時交換。',
    images: [
      { url: '/og-image.png', width: 1200, height: 630, alt: 'Tas Money' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tas Money（タスマネ）',
    description: 'タスクで稼ぐ。リアルマネー。最低出金500円・即時付与。',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
  verification: {
    // 必要時に Search Console / Bing Webmaster の verification コードを追加
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0e1014',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${inter.variable} dark`}>
      <body className="bg-[#0e1014] text-white">
        {children}
        {/* JSON-LD: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Tas Money',
              alternateName: 'タスマネ',
              url: SITE_URL,
              logo: `${SITE_URL}/logo.png`,
              sameAs: ['https://x.com/TasMoney2026'],
              contactPoint: {
                '@type': 'ContactPoint',
                email: 'support@task-money.net',
                contactType: 'customer support',
                areaServed: 'JP',
                availableLanguage: ['Japanese'],
              },
            }),
          }}
        />
        {/* JSON-LD: WebSite + SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Tas Money',
              url: SITE_URL,
              inLanguage: 'ja-JP',
            }),
          }}
        />
      </body>
    </html>
  )
}
