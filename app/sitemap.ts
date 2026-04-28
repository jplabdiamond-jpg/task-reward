import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

const SITE_URL = 'https://task-money.net'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/news`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/tokushoho`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/signup`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
  ]

  // 公開済みお知らせを動的に追加
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('tr_notices')
      .select('slug,updated_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(500)

    const noticeUrls: MetadataRoute.Sitemap = (data ?? []).map(n => ({
      url: `${SITE_URL}/news/${n.slug}`,
      lastModified: n.updated_at ? new Date(n.updated_at) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    return [...staticUrls, ...noticeUrls]
  } catch {
    return staticUrls
  }
}
