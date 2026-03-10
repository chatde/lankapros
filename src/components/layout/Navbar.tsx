'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import { Home, Users, MessageCircle, Bell, LogOut, Settings, TrendingUp, Users2, User } from 'lucide-react'
import type { Profile } from '@/types/database'

const navItems = [
  { label: 'Feed', href: '/feed', icon: Home },
  { label: 'Connections', href: '/connections', icon: Users },
  { label: 'Messages', href: '/messages', icon: MessageCircle },
  { label: 'Groups', href: '/groups', icon: Users2 },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Economy', href: '/economy', icon: TrendingUp },
]

// Only the 4 most important links in the mobile bottom bar
const mobileNavItems = [
  { label: 'Feed', href: '/feed', icon: Home },
  { label: 'Connect', href: '/connections', icon: Users },
  { label: 'Messages', href: '/messages', icon: MessageCircle },
  { label: 'Alerts', href: '/notifications', icon: Bell },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) setProfile(data)

      // Unread notifications count
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)

      setUnreadNotifications(notifCount || 0)

      // Unread messages count
      const { data: convos } = await supabase
        .from('conversations')
        .select('id')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)

      if (convos && convos.length > 0) {
        const { count: msgCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', convos.map(c => c.id))
          .neq('sender_id', user.id)
          .eq('read', false)

        setUnreadMessages(msgCount || 0)
      }

      // Subscribe to real-time notifications
      supabase
        .channel('navbar-notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          setUnreadNotifications(prev => prev + 1)
        })
        .subscribe()

      // Subscribe to real-time messages
      supabase
        .channel('navbar-messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, (payload) => {
          const msg = payload.new as { sender_id: string }
          if (msg.sender_id !== user.id) {
            setUnreadMessages(prev => prev + 1)
          }
        })
        .subscribe()
    }

    loadProfile()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function getBadge(href: string): number {
    if (href === '/notifications') return unreadNotifications
    if (href === '/messages') return unreadMessages
    return 0
  }

  const profileHref = profile?.username ? `/${profile.username}` : '/profile/edit'

  return (
    <>
      {/* Top navbar — always visible */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/feed" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-black font-bold text-sm">LP</span>
            </div>
            <span className="font-bold text-lg hidden sm:block">Lanka<span className="text-accent">Pros</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon
              const badge = getBadge(item.href)
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex flex-col items-center px-3 py-1.5 rounded-lg text-xs transition-colors',
                    isActive
                      ? 'text-accent bg-accent/10'
                      : 'text-muted hover:text-foreground hover:bg-card'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="mt-0.5">{item.label}</span>
                  {/* Active underline indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-accent" />
                  )}
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Avatar — shown on both mobile and desktop when logged in */}
            {profile && (
              <Link href={profileHref} className="flex items-center" title={profile.full_name || 'Profile'}>
                <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" className="w-7 h-7" />
              </Link>
            )}

            <Link
              href="/settings"
              className={cn(
                'hidden md:flex p-2 rounded-lg transition-colors',
                pathname.startsWith('/settings')
                  ? 'text-accent bg-accent/10'
                  : 'text-muted hover:text-foreground hover:bg-card'
              )}
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>

            <button
              onClick={handleSignOut}
              className="hidden md:flex p-2 rounded-lg text-muted hover:text-red-400 hover:bg-card transition-colors"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav — only on small screens */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map(item => {
            const Icon = item.icon
            const badge = getBadge(item.href)
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0',
                  isActive ? 'text-accent' : 'text-muted'
                )}
              >
                <Icon className={cn('h-6 w-6', isActive && 'stroke-[2.5]')} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {badge > 0 && (
                  <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Profile tab */}
          <Link
            href={profileHref}
            className={cn(
              'relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0',
              (pathname.startsWith('/profile') || (profile?.username && pathname === `/${profile.username}`))
                ? 'text-accent'
                : 'text-muted'
            )}
          >
            {profile ? (
              <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" className="w-6 h-6" />
            ) : (
              <User className="h-6 w-6" />
            )}
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
