'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import {
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  Pencil,
  UserPlus,
  UserCheck,
  MessageCircle,
  Clock,
  Heart,
  FileText,
} from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'
import type { Profile, Experience, Education, Skill, Industry, Post } from '@/types/database'

interface ProfileViewProps {
  profile: Profile
  experiences: Experience[]
  education: Education[]
  skills: Skill[]
  industry: Industry | null
  currentUserId: string | null
  connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected'
  posts: Post[]
}

type TabId = 'about' | 'posts'

// Compact read-only post card used in the profile Posts tab
function ProfilePostCard({ post, profileName, profileAvatar, profileUsername }: {
  post: Post
  profileName: string | null
  profileAvatar: string | null
  profileUsername: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const MAX_CHARS = 240
  const isLong = post.content.length > MAX_CHARS
  const displayContent = isLong && !expanded ? post.content.slice(0, MAX_CHARS) + '…' : post.content

  return (
    <Card className="animate-fade-in">
      <div className="flex items-start gap-3 mb-3">
        <Link href={`/${profileUsername || '#'}`}>
          <Avatar src={profileAvatar} name={profileName} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm">{profileName || 'Anonymous'}</span>
          <p className="text-xs text-muted">{formatDate(post.created_at)}</p>
        </div>
      </div>

      <p className="whitespace-pre-wrap break-words text-sm mb-2">{displayContent}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-accent hover:underline mb-2"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post image"
          className="rounded-lg w-full max-h-72 object-cover mb-3"
        />
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-border text-muted text-xs">
        <span className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" /> {post.like_count}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" /> {post.comment_count}
        </span>
      </div>
    </Card>
  )
}

export default function ProfileView({
  profile,
  experiences,
  education,
  skills,
  industry,
  currentUserId,
  connectionStatus: initialStatus,
  posts,
}: ProfileViewProps) {
  const router = useRouter()
  const [connectionStatus, setConnectionStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const [bioExpanded, setBioExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('about')

  const isOwn = currentUserId === profile.id

  // Apply per-profile CSS variables so theme colours cascade to all children
  const themeStyle = {
    '--profile-accent': profile.theme_accent,
    '--profile-bg': profile.theme_bg,
    '--profile-text': profile.theme_text,
  } as React.CSSProperties

  const patternClass = profile.theme_pattern !== 'none' ? `pattern-${profile.theme_pattern}` : ''

  // Bio truncation
  const BIO_LIMIT = 200
  const bioIsLong = (profile.bio ?? '').length > BIO_LIMIT
  const bioDisplay =
    bioIsLong && !bioExpanded ? profile.bio!.slice(0, BIO_LIMIT) + '…' : profile.bio

  async function handleConnect() {
    if (!currentUserId) return
    setLoading(true)

    try {
      const supabase = createClient()

      if (connectionStatus === 'none') {
        await supabase.from('connections').insert({
          requester_id: currentUserId,
          addressee_id: profile.id,
        })
        setConnectionStatus('pending_sent')

        await supabase.from('notifications').insert({
          user_id: profile.id,
          type: 'connection_request',
          actor_id: currentUserId,
          message: 'sent you a connection request',
        })
      } else if (connectionStatus === 'pending_received') {
        await supabase
          .from('connections')
          .update({ status: 'accepted' })
          .eq('requester_id', profile.id)
          .eq('addressee_id', currentUserId)

        setConnectionStatus('connected')

        await supabase.from('notifications').insert({
          user_id: profile.id,
          type: 'connection_accepted',
          actor_id: currentUserId,
          message: 'accepted your connection request',
        })
      }
    } catch (_err) {
      toast.error('Failed to send connection request.')
    } finally {
      setLoading(false)
    }
  }

  async function handleMessage() {
    if (!currentUserId) return

    const supabase = createClient()

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(participant_1.eq.${currentUserId},participant_2.eq.${profile.id}),and(participant_1.eq.${profile.id},participant_2.eq.${currentUserId})`
      )
      .single()

    if (existing) {
      router.push(`/messages/${existing.id}`)
    } else {
      const { data: newConvo } = await supabase
        .from('conversations')
        .insert({
          participant_1: currentUserId,
          participant_2: profile.id,
        })
        .select()
        .single()

      if (newConvo) {
        router.push(`/messages/${newConvo.id}`)
      }
    }
  }

  // Derive month+year string from an ISO date string
  function monthYear(isoDate: string): string {
    const d = new Date(isoDate)
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Coloured initials circle for experience / education logos
  function InitialCircle({ text, hue }: { text: string; hue: number }) {
    return (
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm text-white"
        style={{ background: `hsl(${hue}, 55%, 38%)` }}
      >
        {getInitials(text).slice(0, 2)}
      </div>
    )
  }

  // Simple deterministic hue from a string
  function strHue(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
    return h
  }

  return (
    <div style={themeStyle} className="max-w-3xl mx-auto space-y-4">
      {/* ── Cover + Avatar hero card ── */}
      <Card className={`relative overflow-hidden p-0 ${patternClass}`}>
        {/* Cover image or gradient */}
        <div
          className="h-36 md:h-52 w-full"
          style={{
            background: profile.cover_url
              ? `url(${profile.cover_url}) center/cover no-repeat`
              : `linear-gradient(135deg, ${profile.theme_accent}55 0%, ${profile.theme_bg} 100%)`,
          }}
        />

        {/* Avatar + name row — avatar overlaps the cover bottom */}
        <div className="px-4 md:px-6 pb-5 -mt-14 md:-mt-16 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name}
              size="xl"
              className="border-4 border-card shadow-lg"
            />

            {/* Name / headline pushed down on mobile, aligned on desktop */}
            <div className="flex-1 sm:pt-16">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold leading-tight">
                    {profile.full_name || 'Unnamed'}
                  </h1>
                  {profile.headline && (
                    <p className="text-muted text-sm mt-0.5">{profile.headline}</p>
                  )}
                </div>

                {/* Action buttons — top-right on desktop */}
                <div className="flex gap-2 flex-wrap">
                  {isOwn ? (
                    <Link href="/profile/edit">
                      <Button variant="secondary" size="sm">
                        <Pencil className="h-4 w-4 mr-1.5" /> Edit profile
                      </Button>
                    </Link>
                  ) : currentUserId ? (
                    <>
                      {connectionStatus === 'none' && (
                        <Button size="sm" onClick={handleConnect} loading={loading}>
                          <UserPlus className="h-4 w-4 mr-1.5" /> Connect
                        </Button>
                      )}
                      {connectionStatus === 'pending_sent' && (
                        <Button size="sm" variant="secondary" disabled>
                          <Clock className="h-4 w-4 mr-1.5" /> Pending
                        </Button>
                      )}
                      {connectionStatus === 'pending_received' && (
                        <Button size="sm" onClick={handleConnect} loading={loading}>
                          <UserCheck className="h-4 w-4 mr-1.5" /> Accept
                        </Button>
                      )}
                      {connectionStatus === 'connected' && (
                        <Button size="sm" variant="secondary" disabled>
                          <UserCheck className="h-4 w-4 mr-1.5" /> Connected ✓
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" onClick={handleMessage}>
                        <MessageCircle className="h-4 w-4 mr-1.5" /> Message
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats bar ── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-sm text-muted border-t border-border pt-3">
            <span className="font-medium text-foreground">
              {profile.connection_count.toLocaleString()}
              <span className="font-normal text-muted ml-1">connections</span>
            </span>
            <span className="hidden sm:inline text-border">·</span>
            <span className="font-medium text-foreground">
              {profile.post_count.toLocaleString()}
              <span className="font-normal text-muted ml-1">posts</span>
            </span>
            {industry && (
              <>
                <span className="hidden sm:inline text-border">·</span>
                <span className="flex items-center gap-1">
                  {industry.icon && <span>{industry.icon}</span>}
                  {industry.name}
                </span>
              </>
            )}
            {profile.location && (
              <>
                <span className="hidden sm:inline text-border">·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {profile.location}
                </span>
              </>
            )}
            {profile.website && (
              <>
                <span className="hidden sm:inline text-border">·</span>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-accent transition-colors"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0" /> Website
                </a>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* ── Tab nav ── */}
      <div className="flex border-b border-border gap-1">
        {(['about', 'posts'] as TabId[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {tab === 'posts' ? (
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Posts
                {posts.length > 0 && (
                  <span className="ml-1 bg-accent/15 text-accent text-xs px-1.5 py-0.5 rounded-full">
                    {posts.length}
                  </span>
                )}
              </span>
            ) : (
              'About'
            )}
          </button>
        ))}
      </div>

      {/* ── About tab ── */}
      {activeTab === 'about' && (
        <>
          {/* Bio */}
          {profile.bio && (
            <Card>
              <h2 className="font-semibold mb-2">About</h2>
              <p className="text-sm text-muted whitespace-pre-wrap">{bioDisplay}</p>
              {bioIsLong && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="text-xs text-accent hover:underline mt-1"
                >
                  {bioExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </Card>
          )}

          {/* Experience */}
          {experiences.length > 0 && (
            <Card>
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-accent" /> Experience
              </h2>
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border" aria-hidden />

                <div className="space-y-6">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="flex gap-4 relative">
                      <InitialCircle text={exp.company} hue={strHue(exp.company)} />
                      <div className="flex-1 pb-1">
                        <h3 className="font-semibold text-sm leading-snug">{exp.title}</h3>
                        <p className="text-sm text-muted">{exp.company}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {monthYear(exp.start_date)} —{' '}
                          {exp.current
                            ? 'Present'
                            : exp.end_date
                            ? monthYear(exp.end_date)
                            : ''}
                          {exp.location && ` · ${exp.location}`}
                        </p>
                        {exp.description && (
                          <p className="text-sm text-muted mt-1.5 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Education */}
          {education.length > 0 && (
            <Card>
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-accent" /> Education
              </h2>
              <div className="space-y-5">
                {education.map((edu) => (
                  <div key={edu.id} className="flex gap-4">
                    <InitialCircle text={edu.institution} hue={strHue(edu.institution)} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm leading-snug">{edu.institution}</h3>
                      {(edu.degree || edu.field) && (
                        <p className="text-sm text-muted">
                          {[edu.degree, edu.field].filter(Boolean).join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-muted mt-0.5">
                        {edu.start_year} — {edu.end_year ?? 'Present'}
                      </p>
                      {edu.description && (
                        <p className="text-sm text-muted mt-1.5 leading-relaxed">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <Card>
              <h2 className="font-semibold mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-3 py-1 rounded-full text-sm border transition-colors"
                    style={{
                      borderColor: `${profile.theme_accent}55`,
                      color: profile.theme_accent,
                      background: `${profile.theme_accent}12`,
                    }}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Empty state */}
          {!profile.bio && experiences.length === 0 && education.length === 0 && skills.length === 0 && (
            <Card className="text-center py-10 text-muted text-sm">
              Nothing here yet.{' '}
              {isOwn && (
                <Link href="/profile/edit" className="text-accent hover:underline">
                  Fill in your profile
                </Link>
              )}
            </Card>
          )}
        </>
      )}

      {/* ── Posts tab ── */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card className="text-center py-10 text-muted text-sm">
              No posts yet.
            </Card>
          ) : (
            posts.map((post) => (
              <ProfilePostCard
                key={post.id}
                post={post}
                profileName={profile.full_name}
                profileAvatar={profile.avatar_url}
                profileUsername={profile.username}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
