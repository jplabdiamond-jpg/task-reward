import type { MetadataRoute } from 'next'

const SITE_URL = 'https://task-money.net'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard',
          '/earn',
          '/surveys',
          '/tasks',
          '/rewards',
          '/withdraw',
          '/earnings',
          '/referral',
          '/ranking',
          '/admin',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
