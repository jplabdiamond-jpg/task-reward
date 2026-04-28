'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

const CATEGORIES = [
  { value: 'account', label: 'アカウント・ログイン' },
  { value: 'withdraw', label: '出金・換金' },
  { value: 'reward', label: '報酬・ポイント' },
  { value: 'bug', label: '不具合報告' },
  { value: 'partnership', label: '業務提携・取材' },
  { value: 'other', label: 'その他' },
]

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [inquiryId, setInquiryId] = useState<string>('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState('account')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [agreed, setAgreed] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    if (!agreed) {
      setStatus('error')
      setErrorMsg('プライバシーポリシーへの同意が必要です')
      return
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category, subject, message }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error || '送信に失敗しました')
        return
      }
      setInquiryId(data.inquiryId || '')
      setStatus('success')
      setName(''); setEmail(''); setSubject(''); setMessage(''); setAgreed(false)
    } catch (err) {
      console.error(err)
      setStatus('error')
      setErrorMsg('通信エラーが発生しました')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="mx-auto text-green-400 mb-4" size={56} />
        <h2 className="text-xl font-bold mb-2">送信完了</h2>
        <p className="text-sm text-[#b8bcc8] mb-1">お問い合わせを受け付けました。</p>
        <p className="text-sm text-[#b8bcc8] mb-4">3営業日以内にご返信いたします。</p>
        {inquiryId && (
          <p className="text-xs text-[#6b7280] mb-6">受付ID: <span className="font-mono">{inquiryId}</span></p>
        )}
        <button
          onClick={() => setStatus('idle')}
          className="btn-secondary text-sm"
        >
          続けて問い合わせる
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#b8bcc8] mb-1.5">
            お名前 <span className="text-red-400">*</span>
          </label>
          <input
            type="text" required maxLength={100}
            value={name} onChange={e => setName(e.target.value)}
            className="input w-full"
            placeholder="山田太郎"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#b8bcc8] mb-1.5">
            メールアドレス <span className="text-red-400">*</span>
          </label>
          <input
            type="email" required maxLength={200}
            value={email} onChange={e => setEmail(e.target.value)}
            className="input w-full"
            placeholder="example@task-money.net"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#b8bcc8] mb-1.5">
          カテゴリ <span className="text-red-400">*</span>
        </label>
        <select
          value={category} onChange={e => setCategory(e.target.value)}
          className="input w-full"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#b8bcc8] mb-1.5">
          件名 <span className="text-red-400">*</span>
        </label>
        <input
          type="text" required maxLength={200}
          value={subject} onChange={e => setSubject(e.target.value)}
          className="input w-full"
          placeholder="例: 出金申請の処理状況について"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#b8bcc8] mb-1.5">
          お問い合わせ内容 <span className="text-red-400">*</span>
        </label>
        <textarea
          required minLength={10} maxLength={5000}
          value={message} onChange={e => setMessage(e.target.value)}
          className="input w-full min-h-[160px] resize-y"
          placeholder="ご質問・ご要望の内容を詳しくお書きください（10文字以上）"
        />
        <p className="text-xs text-[#6b7280] mt-1">{message.length} / 5000文字</p>
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-1 accent-green-400"
        />
        <span className="text-xs text-[#b8bcc8]">
          <a href="/privacy" target="_blank" className="text-green-400 hover:underline">プライバシーポリシー</a>
          に同意のうえ送信します
        </span>
      </label>

      {status === 'error' && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
          <AlertCircle size={16} />{errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting' || !agreed}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === 'submitting' ? (
          <><Loader2 className="animate-spin" size={16} />送信中...</>
        ) : (
          '送信する'
        )}
      </button>
    </form>
  )
}
