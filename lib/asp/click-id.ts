/**
 * click_id ユーティリティ
 *
 * 重要: user_id を直接 ASP に渡さない。
 *       click_id (12桁の URL-safe ID) を介して間接参照する。
 *       生 user_id (UUID) を晒すと外部突合・推測のリスクがあるため。
 */

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateClickId(length = 12): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return out
}

/**
 * tracking_url_template の {click_id} プレースホルダを置換。
 * テンプレ未定義/プレースホルダ無しの場合はクエリパラメータとして付与。
 */
export function buildTrackingUrl(template: string, clickId: string, fallbackParam = 'sub_id'): string {
  if (!template) throw new Error('tracking_url_template is empty')

  if (template.includes('{click_id}')) {
    return template.replaceAll('{click_id}', encodeURIComponent(clickId))
  }
  // フォールバック: クエリ末尾に付与
  const sep = template.includes('?') ? '&' : '?'
  return `${template}${sep}${fallbackParam}=${encodeURIComponent(clickId)}`
}
