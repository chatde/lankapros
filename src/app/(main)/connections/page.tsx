'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { UserCheck, UserPlus, X, Loader2, MessageCircle, Users, Sparkles } from 'lucide-react'
import type { Profile, Industry } from '@/types/database'

type ConnectionWithProfile = {
  id: number
  requester_id: string
  addressee_id: string
  status: string
  profile: Profile
}

type ProfileWithIndustry = Profile & { industry?: Industry | null }

export default function ConnectionsPage() {
  const router = useRouter()
  const [pending, setPending] = useState<ConnectionWithProfile[]>([])
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([])
  const [suggestions, setSuggestions] = useState<ProfileWithIndustry[]>([])
  const [myIndustry, setMyIndustry] = useState<Industry | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Pending requests TO me
      const { data: pendingData } = await supabase
        .from('connections')
        .select('*, profiles!connections_requester_id_fkey(*)')
        .eq('addressee_id', user.id)
        .eq('status', 'pending')

      if (pendingData) {
        setPending(pendingData.map(c => ({
          id: c.id,
          requester_id: c.requester_id,
          addressee_id: c.addressee_id,
          status: c.status,
          profile: (c as Record<string, unknown>).profiles as Profile,
        })))
      }

      // Accepted connections
      const { data: acceptedData } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (acceptedData && acceptedData.length > 0) {
        const otherIds = acceptedData.map(c =>
          c.requester_id === user.id ? c.addressee_id : c.requester_id
        )

        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', otherIds)

        if (profiles) {
          setConnections(acceptedData.map(c => {
            const otherId = c.requester_id === user.id ? c.addressee_id : c.requester_id
            return {
              ...c,
              profile: profiles.find(p => p.id === otherId) as Profile,
            }
          }).filter(c => c.profile))
        }
      }

      // My profile + industry
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('industry_id')
        .eq('id', user.id)
        .single()

      let industry: Industry | null = null
      if (myProfile?.industry_id) {
        const { data: ind } = await supabase
          .from('industries')
          .select('*')
          .eq('id', myProfile.industry_id)
          .single()
        industry = ind
        setMyIndustry(ind)
      }

      // Suggestions: same industry, not connected
      if (myProfile?.industry_id) {
        const connectedIds = [
          user.id,
          ...(acceptedData || []).map(c =>
            c.requester_id === user.id ? c.addressee_id : c.requester_id
          ),
          ...(pendingData || []).map(c => c.requester_id),
        ]

        const { data: suggestionsData } = await supabase
          .from('profiles')
          .select('*')
          .eq('industry_id', myProfile.industry_id)
          .not('id', 'in', `(${connectedIds.join(',')})`)
          .limit(8)

        if (suggestionsData) {
          setSuggestions(suggestionsData.map(p => ({ ...p, industry })))
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleAccept(connectionId: number, requesterId: string) {
    const supabase = createClient()
    await supabase.from('connections').update({ status: 'accepted' }).eq('id', connectionId)
    await supabase.from('notifications').insert({
      user_id: requesterId,
      type: 'connection_accepted',
      actor_id: userId,
      message: 'accepted your connection request',
    })

    const accepted = pending.find(p => p.id === connectionId)
    if (accepted) {
      setPending(prev => prev.filter(p => p.id !== connectionId))
      setConnections(prev => [...prev, { ...accepted, status: 'accepted' }])
    }
  }

  async function handleReject(connectionId: number) {
    const supabase = createClient()
    await supabase.from('connections').update({ status: 'rejected' }).eq('id', connectionId)
    setPending(prev => prev.filter(p => p.id !== connectionId))
  }

  async function handleConnect(profileId: string) {
    setConnectingIds(prev => new Set(prev).add(profileId))
    const supabase = createClient()
    await supabase.from('connections').insert({
      requester_id: userId,
      addressee_id: profileId,
    })
    await supabase.from('notifications').insert({
      user_id: profileId,
      type: 'connection_request',
      actor_id: userId,
      message: 'sent you a connection request',
    })
    setSuggestions(prev => prev.filter(p => p.id !== profileId))
    setConnectingIds(prev => {
      const next = new Set(prev)
      next.delete(profileId)
      return next
    })
  }

  async function handleMessage(profile: Profile) {
    const supabase = createClient()
    // Find or create conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(participant_1.eq.${userId},participant_2.eq.${profile.id}),and(participant_1.eq.${profile.id},participant_2.eq.${userId})`
      )
      .single()

    if (existing) {
      router.push(`/messages/${existing.id}`)
      return
    }

    const { data: newConvo } = await supabase
      .from('conversations')
      .insert({ participant_1: userId, participant_2: profile.id })
      .select('id')
      .single()

    if (newConvo) {
      router.push(`/messages/${newConvo.id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Pending requests */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-black text-xs font-bold">
              {pending.length}
            </span>
            Pending Requests
          </h2>
          <div className="space-y-2">
            {pending.map(conn => (
              <Card key={conn.id} className="flex items-center gap-3">
                <Link href={`/${conn.profile.username || conn.profile.id}`} className="shrink-0">
                  <Avatar src={conn.profile.avatar_url} name={conn.profile.full_name} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/${conn.profile.username || conn.profile.id}`}
                    className="font-medium hover:text-accent transition-colors block"
                  >
                    {conn.profile.full_name || 'Anonymous'}
                  </Link>
                  {conn.profile.headline && (
                    <p className="text-xs text-muted truncate">{conn.profile.headline}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(conn.id, conn.requester_id)}
                    className="gap-1.5"
                  >
                    <UserCheck className="h-4 w-4" />
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleReject(conn.id)} title="Decline">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* People You May Know */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-accent" />
          <h2 className="text-lg font-semibold">People You May Know</h2>
          {myIndustry && (
            <span className="ml-auto text-xs text-muted bg-card border border-border px-2 py-0.5 rounded-full">
              {myIndustry.icon ?? ''} {myIndustry.name}
            </span>
          )}
        </div>

        {suggestions.length === 0 ? (
          <Card className="text-center py-10 text-muted">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium mb-1">You&apos;ve connected with everyone in your industry!</p>
            <p className="text-sm">Check back later as more professionals join LankaPros.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {suggestions.map(profile => (
              <Card key={profile.id} className="flex flex-col items-center text-center gap-3 p-4">
                <Link href={`/${profile.username || profile.id}`} className="shrink-0">
                  <Avatar src={profile.avatar_url} name={profile.full_name} size="lg" />
                </Link>
                <div className="min-w-0 w-full">
                  <Link
                    href={`/${profile.username || profile.id}`}
                    className="font-medium hover:text-accent transition-colors text-sm block truncate"
                  >
                    {profile.full_name || 'Anonymous'}
                  </Link>
                  {profile.headline && (
                    <p className="text-xs text-muted line-clamp-2 mt-0.5">{profile.headline}</p>
                  )}
                  {profile.industry && (
                    <span className="inline-block mt-1.5 text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                      {profile.industry.icon ?? ''} {profile.industry.name}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleConnect(profile.id)}
                  loading={connectingIds.has(profile.id)}
                  className="w-full gap-1.5"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Connect
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* My Connections */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          My Connections
          {connections.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted">({connections.length})</span>
          )}
        </h2>

        {connections.length === 0 ? (
          <Card className="text-center py-10 text-muted">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium mb-1">No connections yet</p>
            <p className="text-sm">Start connecting with professionals in your industry above!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {connections.map(conn => (
              <Card key={conn.id} hover className="flex items-center gap-3">
                <Link href={`/${conn.profile.username || conn.profile.id}`} className="shrink-0">
                  <Avatar src={conn.profile.avatar_url} name={conn.profile.full_name} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/${conn.profile.username || conn.profile.id}`}
                    className="font-medium hover:text-accent text-sm transition-colors block truncate"
                  >
                    {conn.profile.full_name || 'Anonymous'}
                  </Link>
                  {conn.profile.headline && (
                    <p className="text-xs text-muted truncate">{conn.profile.headline}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleMessage(conn.profile)}
                  title="Send message"
                  className="shrink-0"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
