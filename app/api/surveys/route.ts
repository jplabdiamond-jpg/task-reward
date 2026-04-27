import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tr_surveys')
      .select('id,title,description,reward_amount,estimated_minutes,loi,ir,category,provider')
      .eq('is_active', true)
      .order('reward_amount', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'unexpected' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '未認証' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body?.survey_id) {
      return NextResponse.json({ success: false, error: 'survey_id required' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('tr_user_surveys')
      .insert({ user_id: user.id, survey_id: body.survey_id, status: 'started' })
      .select()
      .single()
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'unexpected' }, { status: 500 })
  }
}
