'use client'

import { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import type { Profile, Message } from '@/types/database'

interface Props {
  params: Promise<{ id: string }>
}

export default function ChatPage({ params }: Props) {
  const { id } = use(params)
  const conversationId = Number(id)
  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Get conversation
      const { data: convo } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (!convo) return

      const otherId = convo.participant_1 === user.id ? convo.participant_2 : convo.participant_1
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherId)
        .single()

      if (profile) setOtherUser(profile)

      // Load messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgs) setMessages(msgs)

      // Mark as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('read', false)

      setLoading(false)

      // Real-time subscription
      supabase
        .channel(`chat-${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        }, (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => [...prev, newMsg])

          // Mark as read if from other user
          if (newMsg.sender_id !== user.id) {
            supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMsg.id)
              .then()
          }
        })
        .subscribe()
    }
    load()
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || sending) return

    setSending(true)
    try {
      const supabase = createClient()

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim(),
      })

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId)

      // Notify other user
      if (otherUser) {
        await supabase.from('notifications').insert({
          user_id: otherUser.id,
          type: 'message',
          actor_id: userId,
          entity_type: 'conversation',
          entity_id: conversationId,
          message: 'sent you a message',
        })
      }

      setContent('')
    } catch {
      // Silently fail
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Link href="/messages" className="p-2 rounded-lg hover:bg-card">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {otherUser && (
          <Link href={`/${otherUser.username || otherUser.id}`} className="flex items-center gap-2 hover:text-accent">
            <Avatar src={otherUser.avatar_url} name={otherUser.full_name} size="sm" />
            <span className="font-medium">{otherUser.full_name || 'Anonymous'}</span>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map(msg => {
          const isMine = msg.sender_id === userId
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  isMine
                    ? 'bg-accent text-black rounded-br-sm'
                    : 'bg-card border border-border rounded-bl-sm'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-black/50' : 'text-muted'}`}>
                  {formatDate(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-4 border-t border-border">
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-card rounded-lg px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-accent"
          maxLength={5000}
        />
        <Button type="submit" loading={sending} disabled={!content.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
