'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Loader2, Users2, Search } from 'lucide-react'
import type { Group } from '@/types/database'

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [myGroupIds, setMyGroupIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [{ data: allGroups }, { data: memberships }] = await Promise.all([
        supabase.from('groups').select('*').order('member_count', { ascending: false }),
        supabase.from('group_members').select('group_id').eq('user_id', user.id),
      ])

      if (allGroups) setGroups(allGroups)
      if (memberships) setMyGroupIds(new Set(memberships.map(m => m.group_id)))
      setLoading(false)
    }
    load()
  }, [])

  async function handleJoin(groupId: number) {
    const supabase = createClient()
    await supabase.from('group_members').insert({ group_id: groupId, user_id: userId })
    setMyGroupIds(prev => new Set([...prev, groupId]))
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, member_count: g.member_count + 1 } : g))
  }

  async function handleLeave(groupId: number) {
    const supabase = createClient()
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
    setMyGroupIds(prev => { const next = new Set(prev); next.delete(groupId); return next })
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, member_count: g.member_count - 1 } : g))
  }

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Industry Groups</h1>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map(group => (
          <Card key={group.id} className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl shrink-0">
                {group.icon || '👥'}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/groups/${group.slug}`} className="font-semibold hover:text-accent text-sm">
                  {group.name}
                </Link>
                <p className="text-xs text-muted mt-0.5">{group.description}</p>
                <p className="text-xs text-muted flex items-center gap-1 mt-1">
                  <Users2 className="h-3 w-3" /> {group.member_count} members
                </p>
              </div>
            </div>
            {myGroupIds.has(group.id) ? (
              <Button size="sm" variant="secondary" onClick={() => handleLeave(group.id)}>
                Leave
              </Button>
            ) : (
              <Button size="sm" onClick={() => handleJoin(group.id)}>
                Join
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
