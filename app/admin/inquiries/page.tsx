import { createServerClient } from '@supabase/ssr'

export const runtime = 'edge'

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

interface InquiryRow {
  id: string
  name: string
  email: string
  category: string
  subject: string
  message: string
  status: string
  created_at: string
}

async function getInquiries(): Promise<InquiryRow[]> {
  const supabase = adminClient()
  const { data } = await supabase
    .from('tr_contact_inquiries')
    .select('id,name,email,category,subject,message,status,created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  return (data ?? []) as InquiryRow[]
}

export default async function AdminInquiriesPage() {
  const inquiries = await getInquiries()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">問い合わせ一覧</h1>
        <span className="text-xs text-[#6b7280]">直近 {inquiries.length} 件</span>
      </div>
      <div className="space-y-3">
        {inquiries.map(i => (
          <div key={i.id} className="card p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-pill ${
                  i.status === 'open' ? 'bg-amber-500/10 text-amber-400' :
                  i.status === 'replied' ? 'bg-green-500/10 text-green-400' :
                  'bg-[#0e1014] text-[#6b7280]'
                }`}>{i.status}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-[#0e1014] text-[#b8bcc8]">{i.category}</span>
              </div>
              <span className="text-[10px] text-[#6b7280]">{new Date(i.created_at).toLocaleString('ja-JP')}</span>
            </div>
            <div className="font-bold text-sm mb-1">{i.subject}</div>
            <div className="text-xs text-[#b8bcc8] mb-2">
              <span>{i.name}</span> / <a className="text-green-400 hover:underline" href={`mailto:${i.email}`}>{i.email}</a>
            </div>
            <pre className="text-xs text-[#b8bcc8] whitespace-pre-wrap font-sans bg-[#0e1014] rounded-lg p-3">{i.message}</pre>
          </div>
        ))}
        {inquiries.length === 0 && (
          <div className="card p-12 text-center text-[#6b7280] text-sm">問い合わせはありません</div>
        )}
      </div>
    </div>
  )
}
