/**
 * Signup時の不正検知ヘルパー
 *
 * ASP審査要件:
 *   - 同一IPからの連続登録ブロック (24h窓で N件超は拒否)
 *   - 自己アフィリ防止 (紹介者と被紹介者が同一IPの場合は紹介報酬ゼロ)
 *
 * 注:
 *   - 既存 tr_users カラム ip_address(inet)/device_fingerprint(text) を活用
 *   - 過剰ブロックを避けるため閾値は 24h窓で 3件まで許容
 */

export interface SignupFraudCheckResult {
  ok: boolean
  reason?: 'ip_rate_limit' | 'banned_ip' | 'self_referral'
  message?: string
}

/**
 * 同一IPから24時間以内に何件のsignupがあったか
 * supabase は service_role クライアントを渡す
 */
export async function checkIpSignupRateLimit(
  supabase: { from: (t: string) => { select: (q: string, opts?: object) => { eq: (k: string, v: unknown) => { gte: (k: string, v: string) => Promise<{ count: number | null }> } } } },
  ip: string | null
): Promise<SignupFraudCheckResult> {
  if (!ip) return { ok: true }
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // 直近24h で同一IPからの signup 件数
  const { count } = await supabase
    .from('tr_users')
    .select('id', { count: 'exact', head: true } as object)
    .eq('ip_address', ip)
    .gte('created_at', dayAgo)

  const c = count ?? 0
  const MAX_SIGNUPS_PER_IP_PER_DAY = 3
  if (c >= MAX_SIGNUPS_PER_IP_PER_DAY) {
    console.warn('[fraud] ip rate limit', { ip, count: c })
    return {
      ok: false,
      reason: 'ip_rate_limit',
      message:
        '同一ネットワークからの登録が短期間に多数検出されました。時間をおいて再度お試しいただくか、サポートまでお問い合わせください。',
    }
  }
  return { ok: true }
}

/**
 * 紹介コードと被紹介者のIPが一致する場合は自己アフィリ判定
 */
export async function checkSelfReferral(
  supabase: { from: (t: string) => { select: (q: string) => { eq: (k: string, v: unknown) => { single: () => Promise<{ data: { id: string; ip_address: string | null } | null }> } } } },
  referralCode: string | null,
  signupIp: string | null
): Promise<SignupFraudCheckResult> {
  if (!referralCode || !signupIp) return { ok: true }
  const { data: refUser } = await supabase
    .from('tr_users')
    .select('id, ip_address')
    .eq('referral_code', referralCode)
    .single()
  if (!refUser) return { ok: true }
  if (refUser.ip_address && String(refUser.ip_address) === signupIp) {
    console.warn('[fraud] self referral attempt', { referralCode, signupIp })
    return {
      ok: false,
      reason: 'self_referral',
      message:
        '紹介者と同一の環境からの登録は自己アフィリエイトとみなされ、ご利用いただけません。',
    }
  }
  return { ok: true }
}
