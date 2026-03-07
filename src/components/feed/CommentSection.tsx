'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import type { Comment, Profile } from '@/types/database'
import { Loader2, Send } from 'lucide-react'

interface CommentSectionProps {
  postId: number
  postAuthorId: string
  currentUserId: string
  onCommentAdded: () => void
}

type CommentWithAuthor = Comment & { profiles: Pick<Profile, 'full_name' | 'username' | 'avatar_url'> | null }

export default function CommentSection({ postId, postAuthorId, currentUserId, onCommentAdded }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    async function loadComments() {
      const supabase = createClient()
      const { data } = await supabase
        .from('comments')
        .select('*, profiles(full_name, username, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (data) setComments(data as CommentWithAuthor[])
      setLoading(false)
    }

    loadComments()
  }, [postId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setPosting(true)
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: currentUserId,
          content: content.trim(),
        })
        .select('*, profiles(full_name, username, avatar_url)')
        .single()

      if (!error && data) {
        setComments(prev => [...prev, data as CommentWithAuthor])
        setContent('')
        onCommentAdded()

        // Create notification
        if (postAuthorId !== currentUserId) {
          await supabase.from('notifications').insert({
            user_id: postAuthorId,
            type: 'post_comment',
            actor_id: currentUserId,
            entity_type: 'post',
            entity_id: postId,
            message: 'commented on your post',
          })
        }
      }
    } catch (_err) {
      toast.error('Failed to post comment. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      {comments.map(comment => (
        <div key={comment.id} className="flex gap-2">
          <Link href={`/${comment.profiles?.username || comment.author_id}`}>
            <Avatar src={comment.profiles?.avatar_url} name={comment.profiles?.full_name} size="sm" />
          </Link>
          <div className="flex-1 bg-background rounded-lg px-3 py-2">
            <div className="flex items-baseline gap-2">
              <Link
                href={`/${comment.profiles?.username || comment.author_id}`}
                className="text-sm font-semibold hover:text-accent"
              >
                {comment.profiles?.full_name || 'Anonymous'}
              </Link>
              <span className="text-xs text-muted">{formatDate(comment.created_at)}</span>
            </div>
            <p className="text-sm mt-0.5">{comment.content}</p>
          </div>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-background rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-accent"
          maxLength={2000}
        />
        <Button size="sm" type="submit" loading={posting} disabled={!content.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
