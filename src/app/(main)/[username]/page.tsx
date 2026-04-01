import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProfileView from '@/components/profile/ProfileView'
import { db } from '@/lib/neon'
import type { Profile, Connection, Post, Experience, Education, Skill, Industry } from '@/types/database'

interface Props {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  // Try username first, then fall back to UUID lookup
  let profileData = null
  const { data: byUsername } = await db
    .from<Profile>('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (byUsername) {
    profileData = byUsername
  } else {
    // Check if it's a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(username)) {
      const { data: byId } = await db
        .from<Profile>('profiles')
        .select('*')
        .eq('id', username)
        .single()
      profileData = byId
    }
  }

  if (!profileData) {
    notFound()
  }

  const profile = profileData as Profile

  const { data: { user } } = await supabase.auth.getUser()

  const { data: experiencesRaw } = await db
    .from<Experience>('experiences')
    .select('*')
    .eq('user_id', profile.id)
    .order('start_date', { ascending: false })
  const experiences = (experiencesRaw || []) as Experience[]

  const { data: educationRaw } = await db
    .from<Education>('education')
    .select('*')
    .eq('user_id', profile.id)
    .order('start_year', { ascending: false })
  const education = (educationRaw || []) as Education[]

  const { data: skillsRaw } = await db
    .from<Skill>('skills')
    .select('*')
    .eq('user_id', profile.id)
  const skills = (skillsRaw || []) as Skill[]

  const { data: postsDataRaw } = await db
    .from<Post>('posts')
    .select('*')
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20)
  const postsData = (postsDataRaw || []) as Post[]

  let industry: Industry | null = null
  if (profile.industry_id) {
    const { data } = await db
      .from<Industry>('industries')
      .select('*')
      .eq('id', profile.industry_id)
      .single()
    industry = data
  }

  // Check connection status
  let connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected' = 'none'
  if (user && user.id !== profile.id) {
    const { data: connectionData } = await db
      .from<Connection>('connections')
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
      experiences={experiences}
      education={education}
      skills={skills}
      industry={industry}
      currentUserId={user?.id || null}
      connectionStatus={connectionStatus}
      posts={postsData}
    />
  )
}
