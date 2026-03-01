'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { MapPin, Globe, Briefcase, GraduationCap, Pencil, UserPlus, UserCheck, MessageCircle, Clock } from 'lucide-react'
import type { Profile, Experience, Education, Skill, Industry } from '@/types/database'

interface ProfileViewProps {
  profile: Profile
  experiences: Experience[]
  education: Education[]
  skills: Skill[]
  industry: Industry | null
  currentUserId: string | null
  connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected'
}

export default function ProfileView({
  profile,
  experiences,
  education,
  skills,
  industry,
  currentUserId,
  connectionStatus: initialStatus,
}: ProfileViewProps) {
  const router = useRouter()
  const [connectionStatus, setConnectionStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const isOwn = currentUserId === profile.id

  const themeStyle = {
    '--profile-accent': profile.theme_accent,
    '--profile-bg': profile.theme_bg,
    '--profile-text': profile.theme_text,
  } as React.CSSProperties

  const patternClass = profile.theme_pattern !== 'none' ? `pattern-${profile.theme_pattern}` : ''

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
    } catch (err) {
      toast.error('Failed to send connection request.')
    } finally {
      setLoading(false)
    }
  }

  async function handleMessage() {
    if (!currentUserId) return

    const supabase = createClient()

    // Find or create conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1.eq.${currentUserId},participant_2.eq.${profile.id}),and(participant_1.eq.${profile.id},participant_2.eq.${currentUserId})`)
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

  return (
    <div style={themeStyle} className="max-w-3xl mx-auto space-y-4">
      {/* Cover + Avatar */}
      <Card className={`relative overflow-hidden p-0 ${patternClass}`}>
        <div
          className="h-32 md:h-48"
          style={{
            background: profile.cover_url
              ? `url(${profile.cover_url}) center/cover`
              : `linear-gradient(135deg, ${profile.theme_accent}40, ${profile.theme_bg})`,
          }}
        />
        <div className="px-4 pb-4 -mt-12 md:-mt-16 relative">
          <div className="flex items-end gap-4">
            <Avatar src={profile.avatar_url} name={profile.full_name} size="xl" className="border-4 border-card" />
            <div className="flex-1 pt-14 md:pt-18">
              <h1 className="text-xl md:text-2xl font-bold">{profile.full_name || 'Unnamed'}</h1>
              {profile.headline && <p className="text-muted text-sm">{profile.headline}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {profile.location}
              </span>
            )}
            {industry && (
              <span className="flex items-center gap-1">
                {industry.icon} {industry.name}
              </span>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-accent">
                <Globe className="h-3.5 w-3.5" /> Website
              </a>
            )}
            <span>{profile.connection_count} connections</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
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
                    <UserCheck className="h-4 w-4 mr-1.5" /> Connected
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={handleMessage}>
                  <MessageCircle className="h-4 w-4 mr-1.5" /> Message
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Bio */}
      {profile.bio && (
        <Card>
          <h2 className="font-semibold mb-2">About</h2>
          <p className="text-sm text-muted whitespace-pre-wrap">{profile.bio}</p>
        </Card>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <Card>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Experience
          </h2>
          <div className="space-y-4">
            {experiences.map(exp => (
              <div key={exp.id} className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Briefcase className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium">{exp.title}</h3>
                  <p className="text-sm text-muted">{exp.company}</p>
                  <p className="text-xs text-muted">
                    {new Date(exp.start_date).getFullYear()} — {exp.current ? 'Present' : exp.end_date ? new Date(exp.end_date).getFullYear() : ''}
                    {exp.location && ` · ${exp.location}`}
                  </p>
                  {exp.description && <p className="text-sm text-muted mt-1">{exp.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Education */}
      {education.length > 0 && (
        <Card>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Education
          </h2>
          <div className="space-y-4">
            {education.map(edu => (
              <div key={edu.id} className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium">{edu.institution}</h3>
                  {(edu.degree || edu.field) && (
                    <p className="text-sm text-muted">{[edu.degree, edu.field].filter(Boolean).join(', ')}</p>
                  )}
                  <p className="text-xs text-muted">
                    {edu.start_year} — {edu.end_year || 'Present'}
                  </p>
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
            {skills.map(skill => (
              <span
                key={skill.id}
                className="px-3 py-1 rounded-full text-sm bg-accent/10 text-accent border border-accent/20"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
