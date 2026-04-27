/**
 * クリック発行エンドポイント
 *
 * - ログインユーザーが案件をクリックすると click_id を発行し DB 記録
 * - tracking_url_template の {click_id} を置換して 302 リダイレクト
 * - user_id は外部に出さない（click_id 経由の間接参照のみ）
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateClickId, buildTrackingUrl } from '@/lib/asp/click-id'

export const runtime = 'edge'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: campaignId } = await ctx.params
    if (!campaignId) {
      return NextResponse.json({ error: '案件IDが不正です' }, { status: 400 })
    }

    const supabase = await createClient()

    // 認証
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    // 案件取得
    const { data: campaign, error: cErr } = await supabase
      .from('tr_campaigns')
      .select('id, asp_provider, tracking_url_template, is_active, pointback_allowed, cta_url')
      .eq('id', campaignId)
      .single()

    if (cErr || !campaign) {
      return NextResponse.json({ error: '案件が見つかりません' }, { status: 404 })
    }
    if (!campaign.is_active) {
      return NextResponse.json({ error: 'この案件は現在無効です' }, { status: 410 })
    }
    if (campaign.pointback_allowed === false) {
      return NextResponse.json({ error: 'この案件はユーザー還元対象外です' }, { status: 403 })
    }

    // tracking_url_template が無ければ cta_url でフォールバック（旧データ救済）
    const template = campaign.tracking_url_template || campaign.cta_url
    if (!template) {
      console.error('[click] tracking_url未設定', { campaignId })
      return NextResponse.json({ error: '案件URLが未設定です' }, { status: 500 })
    }

    // click_id 発行（重複時は最大3回リトライ）
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null
    const ua = req.headers.get('user-agent') ?? ''
    const fp = req.headers.get('x-fingerprint') ?? ''

    let clickId = ''
    let lastErr: unknown = null
    for (let i = 0; i < 3; i++) {
      const candidate = generateClickId(12)
      const { error } = await supabase.from('tr_affiliate_clicks').insert({
        click_id: candidate,
        user_id: user.id,
        campaign_id: campaignId,
        asp_provider: campaign.asp_provider ?? 'unknown',
        ip_address: ip,
        user_agent: ua,
        fingerprint: fp,
        status: 'clicked',
      })
      if (!error) { clickId = candidate; break }
      lastErr = error
    }

    if (!clickId) {
      console.error('[click] click_id 発行失敗', lastErr)
      return NextResponse.json({ error: 'クリック登録に失敗しました' }, { status: 500 })
    }

    // tracking URL 構築 → 302
    const finalUrl = buildTrackingUrl(template, clickId)
    return NextResponse.redirect(finalUrl, 302)
  } catch (e) {
    console.error('[click] 内部エラー', e)
    return NextResponse.json({ error: '内部エラー' }, { status: 500 })
  }
}
