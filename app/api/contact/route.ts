import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

const CATEGORIES = ['account', 'withdraw', 'reward', 'bug', 'partnership', 'other'] as const
type Category = typeof CATEGORIES[number]

interface ContactPayload {
  name?: string
  email?: string
  category?: string
  subject?: string
  message?: string
}

const trim = (s: unknown, max = 5000): string => String(s ?? '').trim().slice(0, max)
const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

async function sendNotificationEmail(opts: {
  inquiryId: string
  name: string
  email: string
  category: string
  subject: string
  message: string
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    console.warn('[contact] RESEND_API_KEY not set, skipping email notification')
    return { ok: true }
  }

  const from = process.env.RESEND_FROM?.trim() || 'noreply@task-money.net'
  const to = process.env.SUPPORT_EMAIL?.trim() || 'support@task-money.net'

  const html = `
    <h2>新しいお問い合わせ</h2>
    <p><strong>受付ID:</strong> ${opts.inquiryId}</p>
    <p><strong>カテゴリ:</strong> ${opts.category}</p>
    <p><strong>氏名:</strong> ${escapeHtml(opts.name)}</p>
    <p><strong>メール:</strong> ${escapeHtml(opts.email)}</p>
    <p><strong>件名:</strong> ${escapeHtml(opts.subject)}</p>
    <hr/>
    <p><strong>本文:</strong></p>
    <pre style="white-space:pre-wrap;font-family:inherit;background:#f5f5f5;padding:12px;border-radius:8px;">${escapeHtml(opts.message)}</pre>
  `

  try {
    const resAdmin = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `Tas Money <${from}>`,
        to: [to],
        reply_to: opts.email,
        subject: `[Tas Money お問い合わせ] ${opts.subject}`,
        html,
      }),
    })
    if (!resAdmin.ok) {
      const errText = await resAdmin.text()
      console.error('[contact] resend admin error', resAdmin.status, errText)
      return { ok: false, error: `admin email failed: ${resAdmin.status}` }
    }

    // ユーザーへの自動返信
    const userHtml = `
      <p>${escapeHtml(opts.name)} 様</p>
      <p>このたびはTas Moneyへお問い合わせいただきありがとうございます。<br/>下記の内容で受け付けました。3営業日以内に担当者よりご返信いたします。</p>
      <p><strong>受付ID:</strong> ${opts.inquiryId}</p>
      <p><strong>件名:</strong> ${escapeHtml(opts.subject)}</p>
      <hr/>
      <pre style="white-space:pre-wrap;font-family:inherit;background:#f5f5f5;padding:12px;border-radius:8px;">${escapeHtml(opts.message)}</pre>
      <hr/>
      <p style="color:#888;font-size:12px;">本メールは自動送信です。本メールへの返信はお控えください。</p>
      <p style="color:#888;font-size:12px;">Tas Money 運営事務局 / https://task-money.net</p>
    `
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `Tas Money <${from}>`,
        to: [opts.email],
        subject: '【Tas Money】お問い合わせを受け付けました',
        html: userHtml,
      }),
    })

    return { ok: true }
  } catch (e) {
    console.error('[contact] resend exception', e)
    return { ok: false, error: 'email send exception' }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactPayload

    const name = trim(body.name, 100)
    const email = trim(body.email, 200)
    const category = trim(body.category, 30)
    const subject = trim(body.subject, 200)
    const message = trim(body.message, 5000)

    if (!name || !email || !category || !subject || !message) {
      return NextResponse.json({ error: '必須項目が未入力です' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'メールアドレスの形式が正しくありません' }, { status: 400 })
    }
    if (!CATEGORIES.includes(category as Category)) {
      return NextResponse.json({ error: 'カテゴリが不正です' }, { status: 400 })
    }
    if (message.length < 10) {
      return NextResponse.json({ error: 'お問い合わせ内容は10文字以上で入力してください' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || null
    const ua = req.headers.get('user-agent') || null

    // 簡易レート制限: 同一IPから直近10分以内に5件超は拒否（スパム対策）
    if (ip) {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('tr_contact_inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .gte('created_at', tenMinAgo)
      if ((count ?? 0) >= 5) {
        console.warn('[contact] rate limit hit', { ip, count })
        return NextResponse.json({ error: '短時間に多数の送信が検出されました。しばらく時間をおいて再度お試しください。' }, { status: 429 })
      }
    }

    const { data, error } = await supabase
      .from('tr_contact_inquiries')
      .insert({
        user_id: user?.id ?? null,
        name, email, category, subject, message,
        ip_address: ip, user_agent: ua,
      })
      .select('id').single()

    if (error || !data) {
      console.error('[contact] insert error', error)
      return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
    }

    // メール送信は失敗してもDB保存は成功扱い
    const mail = await sendNotificationEmail({
      inquiryId: data.id, name, email, category, subject, message,
    })

    return NextResponse.json({
      success: true,
      inquiryId: data.id,
      emailSent: mail.ok,
    })
  } catch (e) {
    console.error('[contact] exception', e)
    return NextResponse.json({ error: '内部エラー' }, { status: 500 })
  }
}
