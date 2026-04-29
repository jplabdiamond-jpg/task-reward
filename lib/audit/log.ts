/**
 * ユーザー操作の監査ログ書き込みヘルパ
 *
 * 用途:
 *   - 出金申請: action='withdrawal_requested'
 *   - 2FA有効化: action='2fa_enabled'
 *   - 2FA無効化: action='2fa_disabled'
 *   - 退会: action='account_deleted'
 *   - 不正検知拒否: action='fraud_blocked'
 *
 * 書き込みはservice_role 経由のため呼び出し側で createServerClient を渡すこと
 */
import type { NextRequest } from 'next/server'

export interface AuditLogInput {
  userId: string
  action: string
  payload?: Record<string, unknown>
}

interface AdminLikeClient {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
  }
}

/** リクエストヘッダから IP/UA を抽出 */
export function extractRequestMeta(req: NextRequest): { ip: string | null; ua: string | null } {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null
  const ua = req.headers.get('user-agent') || null
  return { ip, ua }
}

/** 監査ログをINSERT。失敗してもメイン処理は継続させる方針 */
export async function writeUserAuditLog(
  admin: AdminLikeClient,
  input: AuditLogInput,
  meta: { ip: string | null; ua: string | null } = { ip: null, ua: null },
): Promise<void> {
  try {
    const { error } = await admin.from('tr_user_audit_logs').insert({
      user_id: input.userId,
      action: input.action,
      payload: input.payload ?? {},
      ip_address: meta.ip,
      user_agent: meta.ua,
    })
    if (error) {
      console.error('[audit] insert error', { action: input.action, error: error.message })
    }
  } catch (e) {
    console.error('[audit] exception', { action: input.action, e })
  }
}
