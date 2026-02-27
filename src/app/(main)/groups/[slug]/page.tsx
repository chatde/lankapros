'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostComposer from '@/components/feed/PostComposer'
import PostCard from '@/components/feed/PostCard'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Loader2, Users2 } from 'lucide-react'
import type { Group, FeedPost } from '@/types/database'

interface Props {
  params: Promise<{ slug: string }>
}

export default function GroupDetailPage({ params }: Props) {
  const { slug } = use(params)
  const [group, setGroup] = useState<Group | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: grp } = await supabase
        .from('groups')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!grp) { setLoading(false); return }
      setGroup(grp)

      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', grp.id)
        .eq('user_id', user.id)
        .single()

      setIsMember(!!membership)

      // Load group posts (by industry_id)
      if (grp.industry_id) {
        const { data } = await supabase.rpc('get_feed', {
          p_user_id: user.id,
          p_page_size: 50,
          p_page_offset: 0,
          p_filter_industry: grp.industry_id,
        })
        if (data) setPosts(data)
      }

      setLoading(false)
    }
    load()
  }, [slug])

  async function handleJoinToggle() {
    if (!group) return
    const supabase = createClient()

    if (isMember) {
      await supabase.from('group_members').delete().eq('group_id', group.id).eq('user_id', userId)
      setIsMember(false)
      setGroup({ ...group, member_count: group.member_count - 1 })
    } else {
      await supabase.from('group_members').insert({ group_id: group.id, user_id: userId })
      setIsMember(true)
      setGroup({ ...group, member_count: group.member_count + 1 })
    }
  }

  function handleNewPost(post: FeedPost) {
    setPosts(prev => [post, ...prev])
  }

  function handleLikeToggle(postId: number, liked: boolean) {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, user_liked: liked, like_count: p.like_count + (liked ? 1 : -1) }
          : p
      )
    )
  }

  function handleCommentAdded(postId: number) {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!group) {
    return <div className="text-center py-20 text-muted">Group not found</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center text-3xl">
          {group.icon || '👥'}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{group.name}</h1>
          {group.description && <p className="text-sm text-muted">{group.description}</p>}
          <p className="text-xs text-muted flex items-center gap-1 mt-1">
            <Users2 className="h-3 w-3" /> {group.member_count} members
          </p>
        </div>
        <Button
          variant={isMember ? 'secondary' : 'primary'}
          onClick={handleJoinToggle}
        >
          {isMember ? 'Leave' : 'Join'}
        </Button>
      </Card>

      {isMember && <PostComposer onPost={handleNewPost} groupId={group.industry_id || undefined} />}

      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={userId}
          onLikeToggle={handleLikeToggle}
          onCommentAdded={handleCommentAdded}
        />
      ))}

      {posts.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p>No posts in this group yet</p>
        </div>
      )}
    </div>
  )
}
