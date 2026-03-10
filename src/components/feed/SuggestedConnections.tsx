'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import type { Profile } from '@/types/database'

interface SuggestedProfile extends Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url' | 'headline'> {}

interface SuggestedConnectionsProps {
  userId: string
}

export default function SuggestedConnections({ userId }: SuggestedConnectionsProps) {
  const [profiles, setProfiles] = useState<SuggestedProfile[]>([])
  const [requested, setRequested] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const loadSuggestions = useCallback(async () => {
    const supabase = createClient()

    // Get IDs of users already connected (or pending)
    const { data: existingConnections } = await supabase
      .from('connections')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

    const connectedIds = new Set<string>([userId])
    if (existingConnections) {
      for (const conn of existingConnections) {
        connectedIds.add(conn.requester_id)
        connectedIds.add(conn.addressee_id)
      }
    }

    // Fetch 5 random profiles not in connected set
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, headline')
      .not('id', 'in', `(${Array.from(connectedIds).join(',')})`)
      .limit(20)

    if (data && data.length > 0) {
      // Shuffle and take 5
      const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 5)
      setProfiles(shuffled)
    }

    setLoading(false)
  }, [userId])

  useEffect(() => {
    void loadSuggestions()
  }, [loadSuggestions])

  async function handleConnect(targetId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('connections').insert({
      requester_id: userId,
      addressee_id: targetId,
      status: 'pending',
    })

    if (error) {
      toast.error('Could not send request. Please try again.')
    } else {
      toast.success('Connection request sent!')
      setRequested(prev => new Set(prev).add(targetId))
    }
  }

  if (loading || profiles.length === 0) return null

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">People you may know</h3>

      {/* Horizontal scroll strip */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className="shrink-0 flex flex-col items-center gap-2 rounded-lg border border-border bg-card-hover p-3 w-36 text-center"
          >
            <Link href={`/profile/${profile.username ?? profile.id}`}>
              <Avatar
                src={profile.avatar_url}
                name={profile.full_name ?? undefined}
                size="lg"
                className="cursor-pointer hover:ring-2 hover:ring-[#D4A843] transition-all"
              />
            </Link>

            <div className="w-full">
              <Link
                href={`/profile/${profile.username ?? profile.id}`}
                className="block text-xs font-semibold text-foreground hover:text-[#D4A843] transition-colors truncate"
              >
                {profile.full_name ?? 'LankaPros Member'}
              </Link>
              {profile.headline && (
                <p className="text-[10px] text-muted mt-0.5 line-clamp-2 leading-snug">
                  {profile.headline}
                </p>
              )}
            </div>

            <Button
              size="sm"
              variant={requested.has(profile.id) ? 'secondary' : 'primary'}
              disabled={requested.has(profile.id)}
              onClick={() => { void handleConnect(profile.id) }}
              className="w-full text-xs"
            >
              {requested.has(profile.id) ? 'Requested' : 'Connect'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
