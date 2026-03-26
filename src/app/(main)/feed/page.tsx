'use client'

import { useEffect, useState, useCallback, useRef, startTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostComposer from '@/components/feed/PostComposer'
import PostCard from '@/components/feed/PostCard'
import PostCardSkeleton from '@/components/feed/PostCardSkeleton'
import WelcomeBanner from '@/components/feed/WelcomeBanner'
import EmptyFeedState from '@/components/feed/EmptyFeedState'
import SuggestedConnections from '@/components/feed/SuggestedConnections'
import FeedProfileCard from '@/components/feed/FeedProfileCard'
import TrendingWidget from '@/components/feed/TrendingWidget'
import { INDUSTRIES } from '@/lib/constants'
import type { FeedPost, Profile, Industry } from '@/types/database'
import { Loader2 } from 'lucide-react'

const PAGE_SIZE = 20

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [industryFilter, setIndustryFilter] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [firstName, setFirstName] = useState<string>('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [industry, setIndustry] = useState<Industry | null>(null)
  const offsetRef = useRef(0)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)

  const loadPosts = useCallback(async (reset = false) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    setUserId(user.id)
    const offset = reset ? 0 : offsetRef.current

    if (reset) {
      setLoading(true)

      // Fetch profile info for welcome banner + sidebar
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        const first = profileData.full_name?.split(' ')[0] ?? 'there'
        setFirstName(first)
        setIsNewUser(profileData.connection_count === 0 && profileData.post_count === 0)

        // Fetch industry for sidebar
        if (profileData.industry_id) {
          const { data: ind } = await supabase
            .from('industries')
            .select('*')
            .eq('id', profileData.industry_id)
            .single()
          if (ind) setIndustry(ind)
        }
      }
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
    startTransition(() => { void loadPosts(true) })
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

  // Realtime: prepend new posts from other users as they arrive
  useEffect(() => {
    const supabase = createClient()
    let currentUserId: string | null = null
    supabase.auth.getUser().then(({ data: { user } }) => { currentUserId = user?.id ?? null })

    const channel = supabase
      .channel('feed-new-posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          // Skip own posts -- handleNewPost covers those
          if (payload.new?.user_id === currentUserId) return

          // Fetch the new post in FeedPost shape via get_feed
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          const { data } = await supabase.rpc('get_feed', {
            p_user_id: user.id,
            p_page_size: 1,
            p_page_offset: 0,
            p_filter_industry: null,
          })
          if (data?.[0]) {
            startTransition(() => {
              setPosts(prev => {
                // Avoid duplicates
                if (prev.some(p => p.id === data[0].id)) return prev
                return [data[0], ...prev]
              })
              offsetRef.current += 1
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  function handleNewPost(post: FeedPost) {
    setIsNewUser(false)
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

  function handleDeletePost(postId: number) {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  function focusComposer() {
    if (composerRef.current) {
      composerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const textarea = composerRef.current.querySelector('textarea')
      textarea?.focus()
    }
  }

  return (
    <div className="flex gap-5 max-w-6xl mx-auto">
      {/* Left sidebar -- profile card (desktop only) */}
      <aside className="hidden lg:block w-[220px] shrink-0">
        <div className="sticky top-20 space-y-3">
          {profile ? (
            <FeedProfileCard profile={profile} industry={industry} />
          ) : !loading ? null : (
            <div className="rounded-xl bg-card border border-border p-4 animate-pulse">
              <div className="h-16 bg-background rounded-lg mb-3" />
              <div className="h-4 bg-background rounded w-3/4 mb-2" />
              <div className="h-3 bg-background rounded w-1/2" />
            </div>
          )}
        </div>
      </aside>

      {/* Center feed column */}
      <div className="flex-1 min-w-0 max-w-2xl space-y-4">
        {/* Welcome banner -- only for truly new users */}
        {!loading && isNewUser && (
          <WelcomeBanner firstName={firstName} onWritePost={focusComposer} />
        )}

        <div ref={composerRef}>
          <PostComposer onPost={handleNewPost} />
        </div>

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
          <div className="space-y-4">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <>
            <EmptyFeedState />
            {userId && <SuggestedConnections userId={userId} />}
          </>
        ) : (
          <>
            {/* Suggested connections strip when there are fewer than 5 posts */}
            {posts.length < 5 && userId && (
              <SuggestedConnections userId={userId} />
            )}

            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={userId || ''}
                onLikeToggle={handleLikeToggle}
                onCommentAdded={handleCommentAdded}
                onDelete={handleDeletePost}
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

      {/* Right sidebar -- trending + economy (desktop only) */}
      <aside className="hidden xl:block w-[260px] shrink-0">
        <div className="sticky top-20">
          <TrendingWidget />
        </div>
      </aside>
    </div>
  )
}
