'use client'

import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import type { Profile, Industry } from '@/types/database'

interface FeedProfileCardProps {
  profile: Profile
  industry: Industry | null
}

export default function FeedProfileCard({ profile, industry }: FeedProfileCardProps) {
  const profileHref = profile.username ? `/${profile.username}` : '/profile/edit'

  // Sanitize user-controlled CSS values to prevent CSS injection
  const safeAccent = /^#[0-9a-fA-F]{6}$/.test(profile.theme_accent ?? '') ? profile.theme_accent : '#6366f1'
  const safeBg = /^#[0-9a-fA-F]{6}$/.test(profile.theme_bg ?? '') ? profile.theme_bg : '#0f0f0f'
  const safeCoverUrl = profile.cover_url && /^https?:\/\//.test(profile.cover_url) ? profile.cover_url : null

  return (
    <Card className="p-0 overflow-hidden">
      {/* Mini cover / gradient banner */}
      <div
        className="h-16 w-full"
        style={{
          background: safeCoverUrl
            ? `url(${CSS.escape(safeCoverUrl)}) center/cover no-repeat`
            : `linear-gradient(135deg, ${safeAccent}55 0%, ${safeBg} 100%)`,
        }}
      />

      <div className="px-4 pb-4 -mt-6">
        <Link href={profileHref} className="block">
          <Avatar
            src={profile.avatar_url}
            name={profile.full_name}
            size="lg"
            className="border-2 border-card"
          />
        </Link>

        <Link href={profileHref} className="block mt-2">
          <h3 className="font-semibold text-sm hover:text-accent transition-colors">
            {profile.full_name || 'Set up your profile'}
          </h3>
        </Link>
        {profile.headline && (
          <p className="text-xs text-muted mt-0.5 line-clamp-2">{profile.headline}</p>
        )}
        {industry && (
          <span className="inline-block mt-1.5 text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
            {industry.icon ?? ''} {industry.name}
          </span>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted">
          <Link href={profileHref} className="hover:text-accent transition-colors">
            <span className="font-semibold text-foreground">{profile.connection_count}</span> connections
          </Link>
          <span>
            <span className="font-semibold text-foreground">{profile.post_count}</span> posts
          </span>
        </div>
      </div>
    </Card>
  )
}
