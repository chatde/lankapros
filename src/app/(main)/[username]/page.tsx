import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProfileView from '@/components/profile/ProfileView'
import type { Profile, Connection, Post } from '@/types/database'

interface Props {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profileData) {
    notFound()
  }

  const profile = profileData as Profile

  const { data: { user } } = await supabase.auth.getUser()

  const { data: experiences } = await supabase
    .from('experiences')
    .select('*')
    .eq('user_id', profile.id)
    .order('start_date', { ascending: false })

  const { data: education } = await supabase
    .from('education')
    .select('*')
    .eq('user_id', profile.id)
    .order('start_year', { ascending: false })

  const { data: skills } = await supabase
    .from('skills')
    .select('*')
    .eq('user_id', profile.id)

  const { data: postsData } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20)

  let industry = null
  if (profile.industry_id) {
    const { data } = await supabase
      .from('industries')
      .select('*')
      .eq('id', profile.industry_id)
      .single()
    industry = data
  }

  // Check connection status
  let connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected' = 'none'
  if (user && user.id !== profile.id) {
    const { data: connectionData } = await supabase
      .from('connections')
      .select('*')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`)
      .single()

    const connection = connectionData as unknown as Connection | null
    if (connection) {
      if (connection.status === 'accepted') {
        connectionStatus = 'connected'
      } else if (connection.status === 'pending') {
        connectionStatus = connection.requester_id === user.id ? 'pending_sent' : 'pending_received'
      }
    }
  }

  return (
    <ProfileView
      profile={profile}
      experiences={experiences || []}
      education={education || []}
      skills={skills || []}
      industry={industry}
      currentUserId={user?.id || null}
      connectionStatus={connectionStatus}
      posts={(postsData as Post[]) || []}
    />
  )
}
