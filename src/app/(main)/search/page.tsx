'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import { Search as SearchIcon, Loader2, Users, FileText, Users2 } from 'lucide-react'
import type { Profile, Post, Group } from '@/types/database'

type Tab = 'people' | 'posts' | 'groups'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('people')
  const [people, setPeople] = useState<Profile[]>([])
  const [posts, setPosts] = useState<(Post & { profiles?: Pick<Profile, 'full_name' | 'username' | 'avatar_url'> })[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const supabase = createClient()

      const [{ data: peopleData }, { data: postsData }, { data: groupsData }] = await Promise.all([
        supabase.rpc('search_profiles', { search_query: query, result_limit: 20 }),
        supabase.rpc('search_posts', { search_query: query, result_limit: 20 }),
        supabase.from('groups').select('*').ilike('name', `%${query}%`),
      ])

      if (peopleData) setPeople(peopleData)

      if (postsData && postsData.length > 0) {
        const typedPosts = postsData as Post[]
        const authorIds = [...new Set(typedPosts.map((p: Post) => p.author_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', authorIds)

        const typedProfiles = (profiles || []) as Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url'>[]
        setPosts(typedPosts.map((p: Post) => ({
          ...p,
          profiles: typedProfiles.find((pr) => pr.id === p.author_id),
        })))
      } else {
        setPosts([])
      }

      if (groupsData) setGroups(groupsData)
    } catch (_err) {
      toast.error('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'people', label: 'People', count: people.length, icon: <Users className="h-4 w-4" /> },
    { key: 'posts', label: 'Posts', count: posts.length, icon: <FileText className="h-4 w-4" /> },
    { key: 'groups', label: 'Groups', count: groups.length, icon: <Users2 className="h-4 w-4" /> },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search people, posts, or groups..."
          className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          autoFocus
        />
      </form>

      {searched && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-border">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-foreground'
                }`}
              >
                {t.icon}
                {t.label}
                <span className="text-xs">({t.count})</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : (
            <div className="space-y-2">
              {tab === 'people' && (
                people.length === 0 ? (
                  <p className="text-center py-8 text-muted">No people found</p>
                ) : (
                  people.map(p => (
                    <Link key={p.id} href={`/${p.username || p.id}`}>
                      <Card hover className="flex items-center gap-3">
                        <Avatar src={p.avatar_url} name={p.full_name} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{p.full_name || 'Anonymous'}</p>
                          {p.headline && <p className="text-xs text-muted truncate">{p.headline}</p>}
                          {p.location && <p className="text-xs text-muted">{p.location}</p>}
                        </div>
                      </Card>
                    </Link>
                  ))
                )
              )}

              {tab === 'posts' && (
                posts.length === 0 ? (
                  <p className="text-center py-8 text-muted">No posts found</p>
                ) : (
                  posts.map(p => (
                    <Card key={p.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar
                          src={p.profiles?.avatar_url}
                          name={p.profiles?.full_name}
                          size="sm"
                        />
                        <Link
                          href={`/${p.profiles?.username || p.author_id}`}
                          className="text-sm font-medium hover:text-accent"
                        >
                          {p.profiles?.full_name || 'Anonymous'}
                        </Link>
                      </div>
                      <p className="text-sm line-clamp-3">{p.content}</p>
                    </Card>
                  ))
                )
              )}

              {tab === 'groups' && (
                groups.length === 0 ? (
                  <p className="text-center py-8 text-muted">No groups found</p>
                ) : (
                  groups.map(g => (
                    <Link key={g.id} href={`/groups/${g.slug}`}>
                      <Card hover className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-xl">
                          {g.icon || '👥'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{g.name}</p>
                          <p className="text-xs text-muted">{g.member_count} members</p>
                        </div>
                      </Card>
                    </Link>
                  ))
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
