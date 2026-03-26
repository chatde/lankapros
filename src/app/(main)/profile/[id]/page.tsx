import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

/**
 * Profile by UUID — redirects to the username-based route if the user has a username,
 * otherwise shows a not-found page. This handles links like /profile/<uuid>.
 */
export default async function ProfileByIdPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Validate UUID format to avoid unnecessary DB queries
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', id)
    .single()

  if (!profile) {
    notFound()
  }

  if (profile.username) {
    redirect(`/${profile.username}`)
  }

  // User exists but has no username — redirect to the dynamic [username] route using ID
  // The [username] page also tries ID lookup as a fallback
  redirect(`/${id}`)
}
