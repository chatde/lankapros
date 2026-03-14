'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ImagePlus, X } from 'lucide-react'
import type { FeedPost } from '@/types/database'

interface PostComposerProps {
  onPost: (post: FeedPost) => void
  groupId?: number
}

export default function PostComposer({ onPost, groupId }: PostComposerProps) {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!content.trim()) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let imageUrl: string | null = null

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(path, imageFile)

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('posts').getPublicUrl(path)
          imageUrl = urlData.publicUrl
        }
      }

      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          content: content.trim(),
          image_url: imageUrl,
          industry_id: groupId || null,
        })
        .select()
        .single()

      if (!error && post) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url, headline')
          .eq('id', user.id)
          .single()

        onPost({
          ...post,
          author_name: profile?.full_name || null,
          author_username: profile?.username || null,
          author_avatar: profile?.avatar_url || null,
          author_headline: profile?.headline || null,
          user_liked: false,
        })

        setContent('')
        setImageFile(null)
        setImagePreview(null)
        toast.success('Post published!')
      }
    } catch (_err) {
      toast.error('Failed to create post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF, and WebP images are allowed.')
      e.target.value = ''
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('Image too large — maximum 5MB.')
      e.target.value = ''
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
  }

  return (
    <Card className="p-4">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && content.trim()) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        placeholder="Share something with your network… (Ctrl+Enter to post)"
        className="w-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted min-h-[80px]"
        maxLength={5000}
      />

      {imagePreview && (
        <div className="relative mt-2 inline-block">
          <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg" />
          <button
            onClick={removeImage}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <label className="flex items-center gap-2 text-muted hover:text-foreground cursor-pointer transition-colors">
          <ImagePlus className="h-5 w-5" />
          <span className="text-sm">Photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </label>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{content.length}/5000</span>
          <Button
            size="sm"
            onClick={handleSubmit}
            loading={loading}
            disabled={!content.trim()}
          >
            Post
          </Button>
        </div>
      </div>
    </Card>
  )
}
