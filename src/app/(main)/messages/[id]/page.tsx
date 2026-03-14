'use client'

import { useEffect, useState, useRef, use, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
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
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

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

      // Defense-in-depth: verify current user is a participant
      if (convo.participant_1 !== user.id && convo.participant_2 !== user.id) return

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
    scrollToBottom(loading ? 'instant' : 'smooth')
  }, [messages, scrollToBottom, loading])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || sending) return

    setSending(true)
    const messageToSend = content.trim()
    setContent('')

    try {
      const supabase = createClient()

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: messageToSend,
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

      inputRef.current?.focus()
    } catch {
      toast.error('Failed to send message. Please try again.')
      setContent(messageToSend)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  // Group messages by date for date separators
  function getDateLabel(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (msgDate.getTime() === today.getTime()) return 'Today'
    if (msgDate.getTime() === yesterday.getTime()) return 'Yesterday'
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100dvh - 10rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border shrink-0">
        <Link href="/messages" className="p-2 rounded-lg hover:bg-card transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {otherUser ? (
          <Link
            href={`/${otherUser.username || otherUser.id}`}
            className="flex items-center gap-2.5 hover:text-accent transition-colors flex-1 min-w-0"
          >
            <Avatar src={otherUser.avatar_url} name={otherUser.full_name} size="sm" />
            <div className="min-w-0">
              <p className="font-semibold text-sm">{otherUser.full_name || 'Anonymous'}</p>
              {otherUser.headline && (
                <p className="text-xs text-muted truncate">{otherUser.headline}</p>
              )}
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted text-center px-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-3">
              {otherUser && <Avatar src={otherUser.avatar_url} name={otherUser.full_name} size="lg" />}
            </div>
            <p className="font-medium text-sm">
              This is the start of your conversation with {otherUser?.full_name || 'this person'}.
            </p>
            <p className="text-xs mt-1">Say hello!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isMine = msg.sender_id === userId
              const prevMsg = index > 0 ? messages[index - 1] : null
              const showDateSep =
                !prevMsg ||
                getDateLabel(msg.created_at) !== getDateLabel(prevMsg.created_at)
              const isConsecutive =
                prevMsg &&
                prevMsg.sender_id === msg.sender_id &&
                !showDateSep

              return (
                <div key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted font-medium shrink-0">
                        {getDateLabel(msg.created_at)}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  <div
                    className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} ${
                      isConsecutive ? 'mt-0.5' : 'mt-3'
                    }`}
                  >
                    {/* Show avatar for received messages on first in a group */}
                    {!isMine && (
                      <div className="w-7 shrink-0">
                        {!isConsecutive && otherUser && (
                          <Avatar src={otherUser.avatar_url} name={otherUser.full_name} size="sm" className="w-7 h-7" />
                        )}
                      </div>
                    )}

                    <div
                      className={`max-w-[72%] px-3.5 py-2 text-sm ${
                        isMine
                          ? 'bg-accent text-black rounded-2xl rounded-br-sm'
                          : 'bg-card border border-border rounded-2xl rounded-bl-sm'
                      } ${isConsecutive ? (isMine ? 'rounded-tr-lg' : 'rounded-tl-lg') : ''}`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-black/50' : 'text-muted'}`}>
                        {formatDate(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-border shrink-0">
        <input
          ref={inputRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${otherUser?.full_name?.split(' ')[0] ?? ''}...`}
          className="flex-1 bg-card rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted"
          maxLength={5000}
          autoComplete="off"
        />
        <Button
          type="submit"
          loading={sending}
          disabled={!content.trim()}
          className="rounded-xl px-3.5"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
