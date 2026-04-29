'use client'
import { useEffect, useState } from 'react'
import { Shield, ShieldCheck, Loader2, AlertCircle, Copy, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export const runtime = 'edge'

type Stage = 'idle' | 'setup' | 'verifying' | 'enabled' | 'disabling'

export default function TwoFactorSettingsPage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [enabled, setEnabled] = useState(false)
  const [secret, setSecret] = useState('')
  const [otpauth, setOtpauth] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('tr_users')
        .select('totp_enabled_at')
        .eq('id', user.id)
        .single()
      if (data?.totp_enabled_at) {
        setEnabled(true)
        setStage('enabled')
      }
    })()
  }, [])

  async function startSetup() {
    setError(null)
    setStage('setup')
    try {
      const res = await fetch('/api/account/2fa/setup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || '初期化に失敗しました')
      setSecret(data.secret)
      setOtpauth(data.otpauth)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'エラー')
      setStage('idle')
    }
  }

  async function verify() {
    setError(null)
    setStage('verifying')
    try {
      const res = await fetch('/api/account/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, code }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || '検証に失敗しました')
      setEnabled(true)
      setStage('enabled')
      setCode('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'エラー')
      setStage('setup')
    }
  }

  async function disable() {
    setError(null)
    setStage('disabling')
    try {
      const res = await fetch('/api/account/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || '無効化に失敗しました')
      setEnabled(false)
      setStage('idle')
      setCode('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'エラー')
      setStage('enabled')
    }
  }

  const qrUrl = otpauth
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauth)}`
    : ''

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-2">
        <Shield size={20} className="text-green-400" />
        <h1 className="text-2xl font-bold">二段階認証 (2FA)</h1>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3 mb-3">
          {enabled ? (
            <><ShieldCheck size={20} className="text-green-400" /><span className="font-bold text-sm">有効</span></>
          ) : (
            <><Shield size={20} className="text-[#6b7280]" /><span className="font-bold text-sm text-[#6b7280]">未設定</span></>
          )}
        </div>
        <p className="text-xs text-[#b8bcc8] leading-relaxed">
          高額出金（¥30,000以上）時に <strong className="text-white">Google Authenticator</strong> 等で発行する6桁コードの入力が必須となります。
          設定しなくても通常出金は可能ですが、不正対策として強く推奨します。
        </p>
      </div>

      {error && (
        <div className="card p-4 bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={14} />{error}
          </div>
        </div>
      )}

      {stage === 'idle' && !enabled && (
        <button onClick={startSetup} className="btn-primary w-full py-3">
          2FAを設定する
        </button>
      )}

      {(stage === 'setup' || stage === 'verifying') && otpauth && (
        <div className="card p-5 space-y-4">
          <div>
            <h2 className="font-bold text-sm mb-2">① Authenticatorアプリで読み取り</h2>
            <p className="text-xs text-[#b8bcc8] mb-3">
              Google Authenticator / Authy / 1Password などのアプリでQRコードを読み取るか、シークレットを手動入力してください。
            </p>
            {qrUrl && (
              <div className="flex justify-center bg-white p-3 rounded-xl">
                <img src={qrUrl} alt="2FA QR" width={220} height={220} />
              </div>
            )}
          </div>

          <div>
            <div className="text-xs text-[#6b7280] mb-1">手動入力用シークレット</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-[#0e1014] rounded-lg px-3 py-2 text-xs font-mono break-all">{secret}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
                className="btn-secondary px-3 py-2 text-xs flex items-center gap-1"
                aria-label="コピー"
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div>
            <h2 className="font-bold text-sm mb-2">② アプリに表示された6桁コードを入力</h2>
            <input
              type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="input w-full text-center text-2xl font-mono tracking-[0.4em]"
              placeholder="000000"
            />
          </div>

          <button
            onClick={verify}
            disabled={stage === 'verifying' || code.length !== 6}
            className="btn-primary w-full py-3 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {stage === 'verifying' ? <><Loader2 size={16} className="animate-spin" />検証中...</> : '有効化する'}
          </button>
        </div>
      )}

      {stage === 'enabled' && enabled && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-400" />
            <span className="font-bold text-sm">2FAは有効です</span>
          </div>
          <p className="text-xs text-[#b8bcc8]">
            無効化するには、Authenticatorアプリの現在のコードを入力してください。
          </p>
          <input
            type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
            value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            className="input w-full text-center text-2xl font-mono tracking-[0.4em]"
            placeholder="000000"
          />
          <button
            onClick={disable}
            disabled={code.length !== 6 || stage === 'disabling'}
            className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 text-sm font-bold"
          >
            {stage === 'disabling' ? '処理中...' : '2FAを無効化'}
          </button>
        </div>
      )}
    </div>
  )
}
