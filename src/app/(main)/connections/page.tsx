'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { UserCheck, UserPlus, X, Loader2 } from 'lucide-react'
import type { Profile } from '@/types/database'

type ConnectionWithProfile = {
  id: number
  requester_id: string
  addressee_id: string
  status: string
  profile: Profile
}

export default function ConnectionsPage() {
  const [pending, setPending] = useState<ConnectionWithProfile[]>([])
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([])
  const [suggestions, setSuggestions] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

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

      if (acceptedData) {
        const otherIds = acceptedData.map(c =>
          c.requester_id === user.id ? c.addressee_id : c.requester_id
        )

        if (otherIds.length > 0) {
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
      }

      // Suggestions: same industry, not connected
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('industry_id')
        .eq('id', user.id)
        .single()

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
          .limit(10)

        if (suggestionsData) setSuggestions(suggestionsData)
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
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Pending requests */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Pending Requests ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map(conn => (
              <Card key={conn.id} className="flex items-center gap-3">
                <Link href={`/${conn.profile.username || conn.profile.id}`}>
                  <Avatar src={conn.profile.avatar_url} name={conn.profile.full_name} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/${conn.profile.username || conn.profile.id}`} className="font-medium hover:text-accent">
                    {conn.profile.full_name || 'Anonymous'}
                  </Link>
                  {conn.profile.headline && <p className="text-xs text-muted truncate">{conn.profile.headline}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAccept(conn.id, conn.requester_id)}>
                    <UserCheck className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleReject(conn.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">People You May Know</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {suggestions.map(profile => (
              <Card key={profile.id} className="flex items-center gap-3">
                <Link href={`/${profile.username || profile.id}`}>
                  <Avatar src={profile.avatar_url} name={profile.full_name} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/${profile.username || profile.id}`} className="font-medium hover:text-accent text-sm">
                    {profile.full_name || 'Anonymous'}
                  </Link>
                  {profile.headline && <p className="text-xs text-muted truncate">{profile.headline}</p>}
                </div>
                <Button size="sm" variant="secondary" onClick={() => handleConnect(profile.id)}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* My connections */}
      <div>
        <h2 className="text-lg font-semibold mb-3">My Connections ({connections.length})</h2>
        {connections.length === 0 ? (
          <p className="text-muted text-center py-8">No connections yet. Start connecting!</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {connections.map(conn => (
              <Card key={conn.id} hover className="flex items-center gap-3">
                <Link href={`/${conn.profile.username || conn.profile.id}`}>
                  <Avatar src={conn.profile.avatar_url} name={conn.profile.full_name} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/${conn.profile.username || conn.profile.id}`} className="font-medium hover:text-accent text-sm">
                    {conn.profile.full_name || 'Anonymous'}
                  </Link>
                  {conn.profile.headline && <p className="text-xs text-muted truncate">{conn.profile.headline}</p>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
