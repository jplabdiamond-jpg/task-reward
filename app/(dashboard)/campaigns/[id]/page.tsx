import { redirect } from 'next/navigation'

export default async function CampaignDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/earn/${id}`)
}
