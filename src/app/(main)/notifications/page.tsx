'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { Bell, Heart, MessageCircle, UserPlus, UserCheck, Users2, Loader2, CheckCheck } from 'lucide-react'
import type { Notification, Profile } from '@/types/database'

type NotificationWithActor = Notification & { actor: Profile | null }

type NotificationGroup = {
  label: string
  items: NotificationWithActor[]
}

const ICON_MAP: Record<string, React.ElementType> = {
  connection_request: UserPlus,
  connection_accepted: UserCheck,
  post_like: Heart,
  post_comment: MessageCircle,
  message: MessageCircle,
  group_invite: Users2,
}

function groupNotifications(notifications: NotificationWithActor[]): NotificationGroup[] {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 6)

  const today: NotificationWithActor[] = []
  const thisWeek: NotificationWithActor[] = []
  const earlier: NotificationWithActor[] = []

  for (const n of notifications) {
    const date = new Date(n.created_at)
    if (date >= startOfToday) {
      today.push(n)
    } else if (date >= startOfWeek) {
      thisWeek.push(n)
    } else {
      earlier.push(n)
    }
  }

  const groups: NotificationGroup[] = []
  if (today.length > 0) groups.push({ label: 'Today', items: today })
  if (thisWeek.length > 0) groups.push({ label: 'This Week', items: thisWeek })
  if (earlier.length > 0) groups.push({ label: 'Earlier', items: earlier })
  return groups
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  const loadNotifications = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

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
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

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

  async function handleNotificationClick(notif: NotificationWithActor) {
    // Mark as read first
    if (!notif.read) {
      const supabase = createClient()
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notif.id)

      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
      )
    }

    // Navigate to relevant page
    router.push(getLink(notif))
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

  const hasUnread = notifications.some(n => !n.read)
  const groups = groupNotifications(notifications)

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  // Show unread count in header
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {hasUnread && (
          <Button size="sm" variant="ghost" onClick={markAllRead} className="gap-1.5">
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Bell className="h-10 w-10 text-accent" />
          </div>
          <p className="text-xl font-semibold mb-2">You&apos;re all caught up!</p>
          <p className="text-sm text-muted max-w-xs mx-auto">
            No new notifications right now. When someone connects, likes, or messages you — it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.label}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 px-1">
                {group.label}
              </h2>
              <div className="space-y-1">
                {group.items.map(notif => {
                  const Icon = ICON_MAP[notif.type] || Bell
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className="w-full text-left"
                    >
                      <Card
                        hover
                        className={`flex items-center gap-3 transition-all ${
                          !notif.read
                            ? 'border-accent/30 bg-accent/5 hover:bg-accent/10'
                            : 'hover:bg-card-hover'
                        }`}
                      >
                        {/* Actor avatar or icon */}
                        <div className="relative shrink-0">
                          {notif.actor ? (
                            <Avatar src={notif.actor.avatar_url} name={notif.actor.full_name} size="sm" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                              <Icon className="h-4 w-4 text-accent" />
                            </div>
                          )}
                          {/* Small icon badge overlay for type */}
                          {notif.actor && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                              <Icon className="h-2.5 w-2.5 text-black" />
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug">
                            <span className="font-semibold">{notif.actor?.full_name || 'Someone'}</span>{' '}
                            <span className="text-muted">{notif.message}</span>
                          </p>
                          <p className="text-xs text-muted mt-0.5">{formatDate(notif.created_at)}</p>
                        </div>

                        {/* Unread indicator */}
                        {!notif.read && (
                          <div className="w-2.5 h-2.5 rounded-full bg-accent shrink-0" />
                        )}
                      </Card>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
