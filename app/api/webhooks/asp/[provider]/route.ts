/**
 * ASP Postback / Webhook 受信
 *
 * 5項目すべてを実装:
 *   ① user_id 不使用: click_id 経由で間接参照
 *   ② 冪等性: (asp_provider, asp_order_id) UNIQUE で重複スキップ
 *   ③ 承認/否認: payload.status を pending/approved/rejected に正規化
 *   ④ 確定タイミング: trigger sync_user_rewards_on_conversion が
 *      pending → confirmed の遷移時のみ confirmed_balance に加算
 *   ⑤ 署名検証: HMAC-SHA256 必須。失敗時 401
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifyAspSignature } from '@/lib/asp/signature'

export const runtime = 'edge'  // Cloudflare Pages 互換（crypto.subtle で署名検証）

// Service Role クライアント（Webhookは認証なしで来るため）
function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

interface NormalizedPayload {
  asp_order_id: string
  click_id: string | null
  reward_amount_jpy: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  occurred_at: string
}

/**
 * ASPごとの payload 形式差異を吸収して正規化。
 * 不明プロバイダーは generic 形式で受ける。
 */
function normalize(provider: string, p: Record<string, unknown>): NormalizedPayload | null {
  const get = (k: string) => (p[k] as string | number | undefined)
  switch (provider) {
    case 'bybit':
    case 'bitget':
    case 'binance':
    case 'okx':
      return {
        asp_order_id: String(get('order_id') ?? get('uid') ?? ''),
        click_id: String(get('source') ?? get('sub_id') ?? '') || null,
        reward_amount_jpy: Math.floor(Number(get('commission') ?? get('reward') ?? 0)),
        status: mapStatus(String(get('status') ?? 'pending')),
        occurred_at: String(get('occurred_at') ?? new Date().toISOString()),
      }
    case 'clickbank':
      return {
        asp_order_id: String(get('receipt') ?? ''),
        click_id: String(get('tid') ?? '') || null,
        reward_amount_jpy: Math.floor(Number(get('amount') ?? 0)),
        status: mapStatus(String(get('transactionType') ?? 'pending')),
        occurred_at: String(get('transactionTime') ?? new Date().toISOString()),
      }
    case 'impact':
      return {
        asp_order_id: String(get('ActionId') ?? ''),
        click_id: String(get('SubId1') ?? '') || null,
        reward_amount_jpy: Math.floor(Number(get('Payout') ?? 0)),
        status: mapStatus(String(get('State') ?? 'pending')),
        occurred_at: String(get('EventDate') ?? new Date().toISOString()),
      }
    default:
      // generic
      return {
        asp_order_id: String(get('order_id') ?? get('id') ?? ''),
        click_id: String(get('click_id') ?? get('sub_id') ?? '') || null,
        reward_amount_jpy: Math.floor(Number(get('amount') ?? 0)),
        status: mapStatus(String(get('status') ?? 'pending')),
        occurred_at: String(get('occurred_at') ?? new Date().toISOString()),
      }
  }
}

function mapStatus(s: string): NormalizedPayload['status'] {
  const v = s.toLowerCase()
  if (['approved', 'confirmed', 'paid', 'sale'].includes(v)) return 'approved'
  if (['rejected', 'denied', 'declined'].includes(v)) return 'rejected'
  if (['cancelled', 'canceled', 'refund', 'chargeback'].includes(v)) return 'cancelled'
  return 'pending'
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params
  const supabase = adminClient()
  const headers = Object.fromEntries(req.headers.entries())
  let httpStatus = 200
  let errorMsg: string | null = null
  let parsedPayload: Record<string, unknown> = {}
  let signatureOk = false

  try {
    // 1. 生Body読み取り（署名検証用に）
    const rawBody = await req.text()

    // 2. 署名検証（必須）
    const sigResult = await verifyAspSignature({
      provider,
      rawBody,
      headerSig: req.headers.get('x-signature') || req.headers.get('x-asp-signature'),
      querySig: new URL(req.url).searchParams.get('sig'),
    })
    signatureOk = sigResult.ok
    if (!sigResult.ok) {
      httpStatus = 401
      errorMsg = `signature_invalid:${sigResult.reason ?? 'unknown'}`
      console.error('[webhook] 署名検証失敗', { provider, reason: sigResult.reason })
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // 3. JSON parse
    try {
      parsedPayload = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      httpStatus = 400
      errorMsg = 'invalid_json'
      return NextResponse.json({ error: 'invalid json' }, { status: 400 })
    }

    // 4. payload 正規化
    const norm = normalize(provider, parsedPayload)
    if (!norm || !norm.asp_order_id) {
      httpStatus = 400
      errorMsg = 'invalid_payload'
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
    }

    // 5. click_id から元クリック取得
    let matchedClick = null
    let matchMethod: 'subid' | 'unmatched' = 'unmatched'
    if (norm.click_id) {
      const { data } = await supabase
        .from('tr_affiliate_clicks')
        .select('id, user_id, campaign_id')
        .eq('click_id', norm.click_id)
        .maybeSingle()
      if (data) {
        matchedClick = data
        matchMethod = 'subid'
      }
    }

    // 6. ASP報酬の50%をユーザー還元（既存ロジック踏襲）
    const userPayout = Math.floor(norm.reward_amount_jpy * 0.5)

    // 7. 冪等INSERT: (asp_provider, asp_order_id) UNIQUE で重複は無視
    const { data: convRow, error: insertErr } = await supabase
      .from('tr_asp_conversions')
      .upsert({
        asp_provider: provider,
        asp_order_id: norm.asp_order_id,
        click_id: norm.click_id,
        matched_click_uuid: matchedClick?.id ?? null,
        matched_user_id: matchedClick?.user_id ?? null,
        matched_campaign_id: matchedClick?.campaign_id ?? null,
        reward_amount_jpy: norm.reward_amount_jpy,
        user_payout_jpy: userPayout,
        status: norm.status,
        match_method: matchMethod,
        occurred_at: norm.occurred_at,
        approved_at: norm.status === 'approved' ? new Date().toISOString() : null,
        rejected_at: norm.status === 'rejected' ? new Date().toISOString() : null,
        signature_verified: true,
        raw_payload: parsedPayload,
      }, { onConflict: 'asp_provider,asp_order_id' })
      .select()
      .single()

    if (insertErr) {
      httpStatus = 500
      errorMsg = `db_error:${insertErr.message}`
      console.error('[webhook] DB保存失敗', insertErr)
      return NextResponse.json({ error: 'storage error' }, { status: 500 })
    }

    // 8. matched_click を converted に更新
    if (matchedClick) {
      await supabase.from('tr_affiliate_clicks')
        .update({ status: 'converted' })
        .eq('id', matchedClick.id)
    }

    // 9. user_rewards へは trigger 経由で自動同期（pending→confirmed制御）
    return NextResponse.json({
      ok: true,
      conversion_id: convRow?.id,
      matched: !!matchedClick,
    })
  } catch (e: unknown) {
    httpStatus = 500
    errorMsg = e instanceof Error ? e.message : 'unknown'
    console.error('[webhook] 想定外エラー', e)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  } finally {
    // 監査ログは常に残す（攻撃の痕跡保全）
    try {
      await supabase.from('tr_asp_webhook_logs').insert({
        asp_provider: provider,
        signature_verified: signatureOk,
        http_status: httpStatus,
        payload: parsedPayload,
        headers,
        error_message: errorMsg,
      })
    } catch (logErr) {
      console.error('[webhook] ログ書込失敗', logErr)
    }
  }
}
