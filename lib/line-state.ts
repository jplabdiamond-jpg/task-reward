/**
 * LINE OAuth state を HMAC署名付きで生成・検証
 * cookie 不依存（モバイルでLINEアプリ介在しても動作）
 */

type StatePayload = {
  nonce: string
  next: string
  exp: number // unix ms
}

function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function importKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  )
}

export async function signState(payload: StatePayload, secret: string): Promise<string> {
  const data = JSON.stringify(payload)
  const dataBytes = new TextEncoder().encode(data)
  const key = await importKey(secret, 'sign')
  const sig = await crypto.subtle.sign('HMAC', key, dataBytes)
  return `${b64urlEncode(dataBytes)}.${b64urlEncode(sig)}`
}

export async function verifyState(
  state: string,
  secret: string
): Promise<StatePayload | null> {
  try {
    const [dataB64, sigB64] = state.split('.')
    if (!dataB64 || !sigB64) return null

    const dataBytes = b64urlDecode(dataB64)
    const sig = b64urlDecode(sigB64)
    const key = await importKey(secret, 'verify')
    // BufferSource 互換性のため ArrayBuffer に変換
    const sigBuf = sig.buffer.slice(sig.byteOffset, sig.byteOffset + sig.byteLength) as ArrayBuffer
    const dataBuf = dataBytes.buffer.slice(dataBytes.byteOffset, dataBytes.byteOffset + dataBytes.byteLength) as ArrayBuffer
    const valid = await crypto.subtle.verify('HMAC', key, sigBuf, dataBuf)
    if (!valid) return null

    const payload = JSON.parse(new TextDecoder().decode(dataBytes)) as StatePayload
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
