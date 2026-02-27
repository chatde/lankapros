'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { Bell, Heart, MessageCircle, UserPlus, UserCheck, Users2, Loader2, CheckCheck } from 'lucide-react'
import type { Notification, Profile } from '@/types/database'

type NotificationWithActor = Notification & { actor: Profile | null }

const ICON_MAP = {
  connection_request: UserPlus,
  connection_accepted: UserCheck,
  post_like: Heart,
  post_comment: MessageCircle,
  message: MessageCircle,
  group_invite: Users2,
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!notifs) { setLoading(false); return }

      const actorIds = [...new Set(notifs.filter(n => n.actor_id).map(n => n.actor_id as string))]
      let actorsMap = new Map<string, Profile>()

      if (actorIds.length > 0) {
        const { data: actors } = await supabase
          .from('profiles')
          .select('*')
          .in('id', actorIds)

        if (actors) {
          actorsMap = new Map(actors.map(a => [a.id, a]))
        }
      }

      setNotifications(notifs.map(n => ({
        ...n,
        actor: n.actor_id ? actorsMap.get(n.actor_id) || null : null,
      })))

      setLoading(false)

      // Subscribe to new notifications
      supabase
        .channel('notifications-page')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, async (payload) => {
          const newNotif = payload.new as Notification
          let actor: Profile | null = null

          if (newNotif.actor_id) {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newNotif.actor_id)
              .single()
            actor = data
          }

          setNotifications(prev => [{ ...newNotif, actor }, ...prev])
        })
        .subscribe()
    }
    load()
  }, [])

  async function markAllRead() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function getLink(notif: NotificationWithActor): string {
    if (notif.type === 'connection_request' || notif.type === 'connection_accepted') {
      return notif.actor?.username ? `/${notif.actor.username}` : '/connections'
    }
    if (notif.type === 'post_like' || notif.type === 'post_comment') {
      return '/feed'
    }
    if (notif.type === 'message') {
      return notif.entity_id ? `/messages/${notif.entity_id}` : '/messages'
    }
    return '/notifications'
  }

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
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.some(n => !n.read) && (
          <Button size="sm" variant="ghost" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-1.5" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg mb-1">No notifications</p>
          <p className="text-sm">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map(notif => {
            const Icon = ICON_MAP[notif.type] || Bell
            return (
              <Link key={notif.id} href={getLink(notif)}>
                <Card
                  hover
                  className={`flex items-center gap-3 ${!notif.read ? 'border-accent/30 bg-accent/5' : ''}`}
                >
                  {notif.actor ? (
                    <Avatar src={notif.actor.avatar_url} name={notif.actor.full_name} size="sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-accent" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{notif.actor?.full_name || 'Someone'}</span>{' '}
                      <span className="text-muted">{notif.message}</span>
                    </p>
                    <p className="text-xs text-muted">{formatDate(notif.created_at)}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                  )}
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
