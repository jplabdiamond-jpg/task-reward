/**
 * TOTP (RFC 6238) - Web Crypto API実装 / Edge Runtime互換
 *
 * 仕様:
 *   - Base32エンコード(RFC 4648)
 *   - HMAC-SHA1
 *   - 6桁コード / 30秒周期 / ±1ステップの許容窓
 *   - Google Authenticator / Authy / 1Password 互換
 *
 * 外部ライブラリ依存ゼロ (Cloudflare Pages Edge Runtimeで動作)
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/** 16文字 (80bit) のランダムBase32文字列を生成 = TOTP共有秘密 */
export function generateTotpSecret(): string {
  const bytes = new Uint8Array(10) // 80bit
  crypto.getRandomValues(bytes)
  return base32Encode(bytes)
}

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let output = ''
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i]
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f]
  }
  return output
}

export function base32Decode(secret: string): Uint8Array {
  const cleaned = secret.replace(/=+$/, '').toUpperCase().replace(/\s/g, '')
  let bits = 0
  let value = 0
  const out: number[] = []
  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i])
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return new Uint8Array(out)
}

/** RFC 6238: T = floor((Now - T0) / X), X=30s */
function getCounter(timestamp = Date.now()): bigint {
  return BigInt(Math.floor(timestamp / 1000 / 30))
}

function counterToBytes(counter: bigint): Uint8Array {
  const buf = new Uint8Array(8)
  for (let i = 7; i >= 0; i--) {
    buf[i] = Number(counter & 0xffn)
    counter >>= 8n
  }
  return buf
}

async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data as BufferSource)
  return new Uint8Array(sig)
}

/** カウンタ T からTOTP 6桁を計算 */
async function generateCodeAt(secretBytes: Uint8Array, counter: bigint): Promise<string> {
  const hmac = await hmacSha1(secretBytes, counterToBytes(counter))
  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  const code = binary % 1_000_000
  return code.toString().padStart(6, '0')
}

/** 現在時刻のTOTPを生成（テスト/UI表示用） */
export async function generateTotpCode(secret: string, timestamp = Date.now()): Promise<string> {
  return generateCodeAt(base32Decode(secret), getCounter(timestamp))
}

/** TOTPコード検証（前後1ステップ=±30秒の時刻ずれ許容） */
export async function verifyTotpCode(
  secret: string,
  code: string,
  timestamp = Date.now(),
): Promise<boolean> {
  const cleaned = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(cleaned)) return false
  const secretBytes = base32Decode(secret)
  const counter = getCounter(timestamp)
  for (const offset of [0n, -1n, 1n] as const) {
    const expected = await generateCodeAt(secretBytes, counter + offset)
    if (timingSafeEqual(expected, cleaned)) return true
  }
  return false
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return result === 0
}

/** otpauth:// URI を生成（QRコード化用） */
export function buildOtpauthUri(opts: {
  secret: string
  accountName: string  // 通常はメールアドレス
  issuer?: string      // サービス名
}): string {
  const issuer = encodeURIComponent(opts.issuer ?? 'Tas Money')
  const account = encodeURIComponent(opts.accountName)
  const params = new URLSearchParams({
    secret: opts.secret,
    issuer: opts.issuer ?? 'Tas Money',
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  })
  return `otpauth://totp/${issuer}:${account}?${params.toString()}`
}
