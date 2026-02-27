'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import { Loader2, MessageCircle } from 'lucide-react'
import type { Profile, Conversation, Message } from '@/types/database'

type ConversationWithDetails = Conversation & {
  otherUser: Profile
  lastMessage: Message | null
  unreadCount: number
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg mb-1">No messages yet</p>
          <p className="text-sm">Start a conversation from someone&apos;s profile</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map(convo => (
            <Link key={convo.id} href={`/messages/${convo.id}`}>
              <Card hover className="flex items-center gap-3">
                <div className="relative">
                  <Avatar src={convo.otherUser.avatar_url} name={convo.otherUser.full_name} />
                  {convo.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-danger text-white text-[10px] flex items-center justify-center">
                      {convo.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <span className={`font-medium text-sm ${convo.unreadCount > 0 ? 'text-foreground' : 'text-muted'}`}>
                      {convo.otherUser.full_name || 'Anonymous'}
                    </span>
                    {convo.lastMessage && (
                      <span className="text-xs text-muted">{formatDate(convo.lastMessage.created_at)}</span>
                    )}
                  </div>
                  {convo.lastMessage && (
                    <p className={`text-xs truncate ${convo.unreadCount > 0 ? 'text-foreground' : 'text-muted'}`}>
                      {convo.lastMessage.content}
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
