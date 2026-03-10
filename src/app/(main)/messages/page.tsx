'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import { Loader2, MessageCircle, Search, X } from 'lucide-react'
import type { Profile, Conversation, Message } from '@/types/database'

type ConversationWithDetails = Conversation & {
  otherUser: Profile
  lastMessage: Message | null
  unreadCount: number
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: convos } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (!convos || convos.length === 0) {
        setLoading(false)
        return
      }

      const otherIds = convos.map(c =>
        c.participant_1 === user.id ? c.participant_2 : c.participant_1
      )

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherIds)

      const enriched: ConversationWithDetails[] = await Promise.all(
        convos.map(async (c) => {
          const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1
          const otherUser = profiles?.find(p => p.id === otherId)

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', c.id)
            .neq('sender_id', user.id)
            .eq('read', false)

          return {
            ...c,
            otherUser: otherUser as Profile,
            lastMessage: lastMsg,
            unreadCount: count || 0,
          }
        })
      )

      setConversations(enriched.filter(c => c.otherUser))
      setLoading(false)
    }
    load()
  }, [])

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter(c =>
      c.otherUser.full_name?.toLowerCase().includes(q) ||
      c.otherUser.headline?.toLowerCase().includes(q) ||
      c.lastMessage?.content.toLowerCase().includes(q)
    )
  }, [conversations, searchQuery])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Messages</h1>
        {conversations.length > 0 && (
          <span className="text-sm text-muted">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-10 w-10 text-accent" />
          </div>
          <p className="text-xl font-semibold mb-2">No messages yet</p>
          <p className="text-sm text-muted max-w-xs mx-auto mb-6">
            Start a conversation by visiting someone&apos;s profile or connecting with people in your industry.
          </p>
          <Link
            href="/connections"
            className="inline-flex items-center justify-center rounded-lg font-medium transition-colors h-10 px-4 text-sm bg-card text-foreground border border-border hover:bg-card-hover"
          >
            Find People
          </Link>
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-card rounded-lg pl-9 pr-9 py-2.5 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {filteredConversations.length === 0 ? (
            <div className="text-center py-10 text-muted">
              <p className="font-medium">No conversations match &quot;{searchQuery}&quot;</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-accent hover:underline mt-1"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map(convo => (
                <Link key={convo.id} href={`/messages/${convo.id}`}>
                  <Card hover className="flex items-center gap-3 py-3">
                    <div className="relative shrink-0">
                      <Avatar src={convo.otherUser.avatar_url} name={convo.otherUser.full_name} />
                      {convo.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                          {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`font-medium text-sm truncate ${convo.unreadCount > 0 ? 'text-foreground' : 'text-muted'}`}>
                          {convo.otherUser.full_name || 'Anonymous'}
                        </span>
                        {convo.lastMessage && (
                          <span className="text-xs text-muted shrink-0">{formatDate(convo.lastMessage.created_at)}</span>
                        )}
                      </div>
                      {convo.lastMessage ? (
                        <p className={`text-xs truncate mt-0.5 ${convo.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted'}`}>
                          {convo.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-xs text-muted mt-0.5 italic">No messages yet</p>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
