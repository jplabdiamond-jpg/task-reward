import { createClient } from '@/lib/supabase/server'
import RewardsClient from './RewardsClient'

export const dynamic = 'force-dynamic'

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: options }, { data: history }] = await Promise.all([
    supabase.from('tr_users')
      .select('confirmed_balance,pending_balance,balance,rank,level')
      .eq('id', user!.id)
      .single(),
    supabase.from('tr_reward_options')
      .select('*')
      .eq('is_active', true)
      .order('display_order'),
    supabase.from('tr_redemptions')
      .select('id,cost,payout_value,status,created_at,reward_option_id')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return (
    <RewardsClient
      profile={profile}
      options={options ?? []}
      history={history ?? []}
    />
  )
}
