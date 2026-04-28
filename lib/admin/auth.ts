/**
 * 管理者認可ヘルパー
 *
 * tr_admin_users に id が登録されている auth.users のみ管理画面アクセス可能
 * 一般ユーザーは middleware でログイン誘導されるため、
 * このチェックをパスしないと /admin 以下は閲覧不可
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface AdminUser {
  id: string
  email: string | null
  role: string | null
}

/**
 * Server Component / Server Action 内で呼び出し、
 * 管理者でなければ /login へリダイレクト
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/admin')
  }

  const { data: admin } = await supabase
    .from('tr_admin_users')
    .select('id, email, role')
    .eq('id', user.id)
    .single()

  if (!admin) {
    redirect('/dashboard?error=forbidden')
  }
  return admin as AdminUser
}
