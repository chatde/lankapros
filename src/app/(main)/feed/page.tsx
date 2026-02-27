'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostComposer from '@/components/feed/PostComposer'
import PostCard from '@/components/feed/PostCard'
import { INDUSTRIES } from '@/lib/constants'
import type { FeedPost } from '@/types/database'
import { Loader2 } from 'lucide-react'

const PAGE_SIZE = 20

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [industryFilter, setIndustryFilter] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const offsetRef = useRef(0)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadPosts = useCallback(async (reset = false) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)
    const offset = reset ? 0 : offsetRef.current

    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    const { data, error } = await supabase.rpc('get_feed', {
      p_user_id: user.id,
      p_page_size: PAGE_SIZE,
      p_page_offset: offset,
      p_filter_industry: industryFilter,
    })

    if (!error && data) {
      if (reset) {
        setPosts(data)
        offsetRef.current = data.length
      } else {
        setPosts(prev => [...prev, ...data])
        offsetRef.current += data.length
      }
      setHasMore(data.length === PAGE_SIZE)
    }

    setLoading(false)
    setLoadingMore(false)
  }, [industryFilter])

  useEffect(() => {
    offsetRef.current = 0
    loadPosts(true)
  }, [loadPosts])

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadPosts()
      }
    })

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [hasMore, loadingMore, loadPosts])

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
      prev.map(p =>
        p.id === postId
          ? { ...p, comment_count: p.comment_count + 1 }
          : p
      )
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PostComposer onPost={handleNewPost} />

      {/* Industry filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setIndustryFilter(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${
            industryFilter === null
              ? 'bg-accent text-black'
              : 'bg-card border border-border text-muted hover:text-foreground'
          }`}
        >
          All
        </button>
        {INDUSTRIES.map((ind, i) => (
          <button
            key={ind.slug}
            onClick={() => setIndustryFilter(i + 1)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${
              industryFilter === i + 1
                ? 'bg-accent text-black'
                : 'bg-card border border-border text-muted hover:text-foreground'
            }`}
          >
            {ind.icon} {ind.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p className="text-lg mb-2">No posts yet</p>
          <p className="text-sm">Connect with others or create the first post!</p>
        </div>
      ) : (
        <>
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userId || ''}
              onLikeToggle={handleLikeToggle}
              onCommentAdded={handleCommentAdded}
            />
          ))}
          <div ref={sentinelRef} className="h-4" />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
