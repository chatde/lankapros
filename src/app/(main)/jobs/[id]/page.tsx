'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import { INDUSTRIES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Globe,
  Monitor,
  DollarSign,
  Users,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Loader2,
  Building2,
  Share2,
} from 'lucide-react'
import type { Job, Profile } from '@/types/database'

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Freelance',
}

const LOCATION_TYPE_LABELS: Record<string, string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
}

function formatSalary(min: number | null, max: number | null, currency: string): string {
  if (!min && !max) return ''
  const fmt = (n: number) => {
    if (currency === 'LKR') return `Rs. ${n.toLocaleString()}`
    if (currency === 'USD') return `$${n.toLocaleString()}`
    return `${currency} ${n.toLocaleString()}`
  }
  if (min && max) return `${fmt(min)} - ${fmt(max)}/mo`
  if (min) return `From ${fmt(min)}/mo`
  if (max) return `Up to ${fmt(max)}/mo`
  return ''
}

interface Props {
  params: Promise<{ id: string }>
}

export default function JobDetailPage({ params }: Props) {
  const { id } = use(params)
  const jobId = Number(id)
  const [job, setJob] = useState<Job | null>(null)
  const [poster, setPoster] = useState<Profile | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (!jobData) {
        setLoading(false)
        return
      }
      setJob(jobData)

      const [{ data: posterData }, { data: saveData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', jobData.poster_id).single(),
        supabase.from('job_saves').select('id').eq('job_id', jobId).eq('user_id', user.id).single(),
      ])

      if (posterData) setPoster(posterData)
      setIsSaved(!!saveData)
      setLoading(false)
    }
    load()
  }, [jobId])

  async function handleSaveToggle() {
    if (!job) return
    const supabase = createClient()

    if (isSaved) {
      await supabase.from('job_saves').delete().eq('job_id', job.id).eq('user_id', userId)
      setIsSaved(false)
    } else {
      await supabase.from('job_saves').insert({ job_id: job.id, user_id: userId })
      setIsSaved(true)
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    } catch {
      toast.error('Could not copy link')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 text-muted">
        <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-xl font-semibold mb-2">Job not found</p>
        <p className="text-sm mb-4">This job may have been removed or is no longer active.</p>
        <Link href="/jobs">
          <Button variant="secondary">Browse all jobs</Button>
        </Link>
      </div>
    )
  }

  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      <Card className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold leading-tight">{job.title}</h1>
            <p className="text-muted mt-1 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> {job.company}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleSaveToggle}
              className="p-2.5 rounded-lg hover:bg-background border border-border transition-colors"
              title={isSaved ? 'Unsave' : 'Save job'}
            >
              {isSaved ? <BookmarkCheck className="h-5 w-5 text-accent" /> : <Bookmark className="h-5 w-5 text-muted" />}
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 rounded-lg hover:bg-background border border-border transition-colors"
              title="Share"
            >
              <Share2 className="h-5 w-5 text-muted" />
            </button>
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent font-medium">
            <MapPin className="h-3.5 w-3.5" /> {job.location}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-muted">
            {job.location_type === 'remote' ? <Globe className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
            {LOCATION_TYPE_LABELS[job.location_type]}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-muted">
            <Clock className="h-3.5 w-3.5" /> {EMPLOYMENT_LABELS[job.employment_type]}
          </span>
          {salary && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 font-medium">
              <DollarSign className="h-3.5 w-3.5" /> {salary}
            </span>
          )}
          {job.industry_id && INDUSTRIES[job.industry_id - 1] && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-muted">
              {INDUSTRIES[job.industry_id - 1].icon} {INDUSTRIES[job.industry_id - 1].name}
            </span>
          )}
        </div>

        {/* Posted by */}
        {poster && (
          <div className="flex items-center gap-3 py-4 border-y border-border">
            <Link href={`/${poster.username || poster.id}`}>
              <Avatar src={poster.avatar_url} name={poster.full_name} />
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={`/${poster.username || poster.id}`}
                className="text-sm font-semibold hover:text-accent transition-colors"
              >
                {poster.full_name || 'Anonymous'}
              </Link>
              {poster.headline && <p className="text-xs text-muted truncate">{poster.headline}</p>}
              <p className="text-xs text-muted mt-0.5">Posted {formatDate(job.created_at)}</p>
            </div>
            {job.application_count > 0 && (
              <span className="text-xs text-muted flex items-center gap-1 bg-card border border-border px-2.5 py-1 rounded-full">
                <Users className="h-3 w-3" /> {job.application_count} applicant{job.application_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <h2 className="font-semibold mb-3">About this role</h2>
          <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div>
            <h2 className="font-semibold mb-3">Requirements</h2>
            <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
          </div>
        )}

        {/* Apply buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-border">
          {job.apply_url && (
            <a href={/^https?:\/\//.test(job.apply_url ?? "") ? job.apply_url : "#"} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full gap-1.5" size="lg">
                <ExternalLink className="h-4 w-4" /> Apply Now
              </Button>
            </a>
          )}
          {job.apply_email && (
            <a href={`mailto:${job.apply_email}?subject=${encodeURIComponent(`Application: ${job.title}`)}`} className="flex-1">
              <Button variant={job.apply_url ? 'secondary' : 'primary'} className="w-full gap-1.5" size="lg">
                Apply via Email
              </Button>
            </a>
          )}
          {!job.apply_url && !job.apply_email && (
            <Button variant="secondary" disabled className="w-full" size="lg">
              Contact poster to apply
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
