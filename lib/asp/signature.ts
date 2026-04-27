/**
 * ASP Webhook 署名検証
 *
 * なりすまし防止のため必須。各ASPは下記いずれかで署名を提供:
 *   - HMAC-SHA256 (Bybit/Bitget系) : ヘッダー X-Signature にHEX署名
 *   - HMAC-SHA1   (一部国内ASP)    : ヘッダー X-ASP-Signature
 *   - クエリ ?sig=... による簡易署名（Postback URL に埋め込む方式）
 *
 * いずれも timing-safe 比較で検証する。
 */

type Algo = 'sha256' | 'sha1'

async function hmac(secret: string, body: string, algo: Algo): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: algo === 'sha256' ? 'SHA-256' : 'SHA-1' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body))
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** timing-safe 文字列比較 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export interface VerifyInput {
  provider: string
  rawBody: string
  headerSig: string | null
  querySig: string | null
}

/**
 * 検証結果。failure の理由はログ目的でのみ使用。
 * 攻撃者へは詳細を返さない。
 */
export async function verifyAspSignature(input: VerifyInput): Promise<{ ok: boolean; reason?: string }> {
  const { provider, rawBody, headerSig, querySig } = input

  // プロバイダー別 secret 取得（環境変数: ASP_WEBHOOK_SECRET_<UPPER>）
  const envKey = `ASP_WEBHOOK_SECRET_${provider.toUpperCase()}`
  const secret = process.env[envKey] || process.env.ASP_WEBHOOK_SECRET_DEFAULT

  if (!secret) return { ok: false, reason: 'secret_not_configured' }

  const provided = (headerSig || querySig || '').replace(/^sha256=/, '').replace(/^sha1=/, '').trim().toLowerCase()
  if (!provided) return { ok: false, reason: 'signature_missing' }

  // sha256 で先に検証、ダメなら sha1 でフォールバック（ASP差異吸収）
  const expected256 = await hmac(secret, rawBody, 'sha256')
  if (timingSafeEqual(expected256, provided)) return { ok: true }

  const expected1 = await hmac(secret, rawBody, 'sha1')
  if (timingSafeEqual(expected1, provided)) return { ok: true }

  return { ok: false, reason: 'signature_mismatch' }
}
