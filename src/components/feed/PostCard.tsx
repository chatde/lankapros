'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import CommentSection from '@/components/feed/CommentSection'
import { Heart, MessageCircle, Trash2 } from 'lucide-react'
import type { FeedPost } from '@/types/database'

interface PostCardProps {
  post: FeedPost
  currentUserId: string
  onLikeToggle: (postId: number, liked: boolean) => void
  onCommentAdded: (postId: number) => void
  onDelete?: (postId: number) => void
}

export default function PostCard({ post, currentUserId, onLikeToggle, onCommentAdded, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [liking, setLiking] = useState(false)

  async function handleLike() {
    if (liking) return
    setLiking(true)

    try {
      const supabase = createClient()

      if (post.user_liked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId)

        onLikeToggle(post.id, false)
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: currentUserId })

        onLikeToggle(post.id, true)

        // Create notification
        if (post.author_id !== currentUserId) {
          await supabase.from('notifications').insert({
            user_id: post.author_id,
            type: 'post_like',
            actor_id: currentUserId,
            entity_type: 'post',
            entity_id: post.id,
            message: 'liked your post',
          })
        }
      }
    } catch (_err) {
      toast.error('Failed to update like. Please try again.')
    } finally {
      setLiking(false)
    }
  }

  async function handleDelete() {
    const supabase = createClient()
    const { error } = await supabase.from('posts').delete().eq('id', post.id).eq('author_id', currentUserId)
    if (!error && onDelete) {
      onDelete(post.id)
    }
  }

  return (
    <Card className="animate-fade-in">
      {/* Author header */}
      <div className="flex items-start gap-3 mb-3">
        <Link href={`/${post.author_username || post.author_id}`}>
          <Avatar src={post.author_avatar} name={post.author_name} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/${post.author_username || post.author_id}`}
            className="font-semibold hover:text-accent transition-colors"
          >
            {post.author_name || 'Anonymous'}
          </Link>
          {post.author_headline && (
            <p className="text-xs text-muted truncate">{post.author_headline}</p>
          )}
          <p className="text-xs text-muted">{formatDate(post.created_at)}</p>
        </div>
        {post.author_id === currentUserId && (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-card-hover transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="whitespace-pre-wrap break-words mb-3">{post.content}</p>

      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post image"
          className="rounded-lg w-full max-h-96 object-cover mb-3"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            post.user_liked ? 'text-danger' : 'text-muted hover:text-danger'
          }`}
        >
          <Heart className={`h-4 w-4 ${post.user_liked ? 'fill-current' : ''}`} />
          <span>{post.like_count}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.comment_count}</span>
        </button>
      </div>

      {showComments && (
        <CommentSection
          postId={post.id}
          postAuthorId={post.author_id}
          currentUserId={currentUserId}
          onCommentAdded={() => onCommentAdded(post.id)}
        />
      )}
    </Card>
  )
}
