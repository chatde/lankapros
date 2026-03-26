'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import { INDUSTRIES } from '@/lib/constants'
import { formatDate, getInitials } from '@/lib/utils'
import {
  Briefcase,
  MapPin,
  Clock,
  Search,
  Plus,
  X,
  Bookmark,
  BookmarkCheck,
  Building2,
  DollarSign,
  Globe,
  Monitor,
  Users,
  Filter,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Job, Profile } from '@/types/database'

type LocationType = 'all' | 'onsite' | 'remote' | 'hybrid'
type EmploymentType = 'all' | 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'

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

// ── Post Job Modal ──
function PostJobModal({
  userId,
  onClose,
  onPosted,
}: {
  userId: string
  onClose: () => void
  onPosted: (job: Job) => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    location_type: 'onsite' as Job['location_type'],
    employment_type: 'full_time' as Job['employment_type'],
    industry_id: '',
    description: '',
    requirements: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'LKR',
    apply_url: '',
    apply_email: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.company.trim() || !form.location.trim() || !form.description.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          poster_id: userId,
          title: form.title.trim(),
          company: form.company.trim(),
          location: form.location.trim(),
          location_type: form.location_type,
          employment_type: form.employment_type,
          industry_id: form.industry_id ? Number(form.industry_id) : null,
          description: form.description.trim(),
          requirements: form.requirements.trim() || null,
          salary_min: form.salary_min ? Number(form.salary_min) : null,
          salary_max: form.salary_max ? Number(form.salary_max) : null,
          salary_currency: form.salary_currency,
          apply_url: form.apply_url.trim() && /^https?:\/\//.test(form.apply_url.trim()) ? form.apply_url.trim() : null,
          apply_email: form.apply_email.trim() || null,
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        toast.success('Job posted successfully!')
        onPosted(data)
        onClose()
      }
    } catch {
      toast.error('Failed to post job. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 mb-12 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-accent" />
            Post a Job
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-background transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title + Company */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted">Job Title *</label>
              <input
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted">Company *</label>
              <input
                value={form.company}
                onChange={e => update('company', e.target.value)}
                placeholder="e.g. WSO2"
                className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
            </div>
          </div>

          {/* Location + Type */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted">Location *</label>
              <input
                value={form.location}
                onChange={e => update('location', e.target.value)}
                placeholder="e.g. Colombo, Sri Lanka"
                className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted">Work Mode</label>
              <select
                value={form.location_type}
                onChange={e => update('location_type', e.target.value)}
                className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="onsite">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted">Type</label>
              <select
                value={form.employment_type}
                onChange={e => update('employment_type', e.target.value)}
                className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
          </div>

          {/* Industry */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-muted">Industry</label>
            <select
              value={form.industry_id}
              onChange={e => update('industry_id', e.target.value)}
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map((ind, i) => (
                <option key={ind.slug} value={i + 1}>
                  {ind.icon} {ind.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-muted">Description *</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent min-h-[120px] resize-y"
              required
            />
          </div>

          {/* Requirements */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-muted">Requirements (optional)</label>
            <textarea
              value={form.requirements}
              onChange={e => update('requirements', e.target.value)}
              placeholder="Skills, experience, qualifications..."
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent min-h-[80px] resize-y"
            />
          </div>

          {/* Salary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted">Currency</label>
              <select
                value={form.salary_currency}
                onChange={e => update('salary_currency', e.target.value)}
                className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="LKR">LKR (Rs.)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
                <option value="AUD">AUD</option>
                <option value="SGD">SGD</option>
                <option value="AED">AED</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted">Min salary/mo</label>
              <input
                type="number"
                value={form.salary_min}
                onChange={e => update('salary_min', e.target.value)}
                placeholder="e.g. 200000"
                className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted">Max salary/mo</label>
              <input
                type="number"
                value={form.salary_max}
                onChange={e => update('salary_max', e.target.value)}
                placeholder="e.g. 400000"
                className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Apply info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted">Application URL</label>
              <input
                value={form.apply_url}
                onChange={e => update('apply_url', e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted">Application Email</label>
              <input
                type="email"
                value={form.apply_email}
                onChange={e => update('apply_email', e.target.value)}
                placeholder="hr@company.com"
                className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" loading={saving}>
              <Plus className="h-4 w-4 mr-1.5" /> Post Job
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Job Detail Panel ──
function JobDetail({
  job,
  poster,
  userId,
  isSaved,
  onSaveToggle,
  onClose,
}: {
  job: Job
  poster: Profile | null
  userId: string
  isSaved: boolean
  onSaveToggle: (jobId: number) => void
  onClose: () => void
}) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold leading-tight">{job.title}</h2>
          <p className="text-sm text-muted mt-1">{job.company}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onSaveToggle(job.id)}
            className="p-2 rounded-lg hover:bg-background transition-colors"
            title={isSaved ? 'Unsave' : 'Save job'}
          >
            {isSaved ? (
              <BookmarkCheck className="h-5 w-5 text-accent" />
            ) : (
              <Bookmark className="h-5 w-5 text-muted" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-background transition-colors md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium">
          <MapPin className="h-3 w-3" /> {job.location}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-muted">
          {job.location_type === 'remote' ? <Globe className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
          {LOCATION_TYPE_LABELS[job.location_type]}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-muted">
          <Clock className="h-3 w-3" /> {EMPLOYMENT_LABELS[job.employment_type]}
        </span>
        {salary && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 font-medium">
            <DollarSign className="h-3 w-3" /> {salary}
          </span>
        )}
        {job.industry_id && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-muted">
            {INDUSTRIES[job.industry_id - 1]?.icon} {INDUSTRIES[job.industry_id - 1]?.name.split(' ')[0]}
          </span>
        )}
      </div>

      {/* Posted by */}
      {poster && (
        <div className="flex items-center gap-3 py-3 border-y border-border">
          <Avatar src={poster.avatar_url} name={poster.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{poster.full_name || 'Anonymous'}</p>
            <p className="text-xs text-muted">Posted {formatDate(job.created_at)}</p>
          </div>
          {job.application_count > 0 && (
            <span className="text-xs text-muted flex items-center gap-1">
              <Users className="h-3 w-3" /> {job.application_count} applicant{job.application_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <h3 className="font-semibold text-sm mb-2">About this role</h3>
        <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed">{job.description}</p>
      </div>

      {/* Requirements */}
      {job.requirements && (
        <div>
          <h3 className="font-semibold text-sm mb-2">Requirements</h3>
          <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
        </div>
      )}

      {/* Apply buttons */}
      <div className="flex gap-3 pt-2">
        {job.apply_url && (
          <a href={/^https?:\/\//.test(job.apply_url ?? "") ? job.apply_url : "#"} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full gap-1.5">
              <ExternalLink className="h-4 w-4" /> Apply Now
            </Button>
          </a>
        )}
        {job.apply_email && (
          <a href={`mailto:${job.apply_email}?subject=${encodeURIComponent(`Application: ${job.title}`)}`} className="flex-1">
            <Button variant={job.apply_url ? 'secondary' : 'primary'} className="w-full gap-1.5">
              Apply via Email
            </Button>
          </a>
        )}
        {!job.apply_url && !job.apply_email && (
          <Button variant="secondary" disabled className="w-full">
            Contact poster to apply
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Main Jobs Page ──
export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [posters, setPosters] = useState<Map<string, Profile>>(new Map())
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState<LocationType>('all')
  const [employmentFilter, setEmploymentFilter] = useState<EmploymentType>('all')
  const [industryFilter, setIndustryFilter] = useState<number | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showPostModal, setShowPostModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const loadJobs = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [{ data: jobsData }, { data: savesData }] = await Promise.all([
      supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('job_saves')
        .select('job_id')
        .eq('user_id', user.id),
    ])

    if (jobsData) {
      setJobs(jobsData)

      // Fetch poster profiles
      const posterIds = [...new Set(jobsData.map(j => j.poster_id))]
      if (posterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', posterIds)
        if (profiles) {
          setPosters(new Map(profiles.map(p => [p.id, p])))
        }
      }

      // Auto-select first job on desktop
      if (jobsData.length > 0 && window.innerWidth >= 768) {
        setSelectedJob(jobsData[0])
      }
    }

    if (savesData) {
      setSavedJobIds(new Set(savesData.map(s => s.job_id)))
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  async function handleSaveToggle(jobId: number) {
    const supabase = createClient()

    if (savedJobIds.has(jobId)) {
      await supabase.from('job_saves').delete().eq('job_id', jobId).eq('user_id', userId)
      setSavedJobIds(prev => { const next = new Set(prev); next.delete(jobId); return next })
    } else {
      await supabase.from('job_saves').insert({ job_id: jobId, user_id: userId })
      setSavedJobIds(prev => new Set([...prev, jobId]))
    }
  }

  function handleJobPosted(job: Job) {
    setJobs(prev => [job, ...prev])
    setPosters(prev => {
      const next = new Map(prev)
      // poster profile may already be loaded since it's the current user
      return next
    })
  }

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q)

      const matchesLocation = locationFilter === 'all' || job.location_type === locationFilter
      const matchesEmployment = employmentFilter === 'all' || job.employment_type === employmentFilter
      const matchesIndustry = !industryFilter || job.industry_id === industryFilter

      return matchesSearch && matchesLocation && matchesEmployment && matchesIndustry
    })
  }, [jobs, searchQuery, locationFilter, employmentFilter, industryFilter])

  const activeFilterCount = [
    locationFilter !== 'all',
    employmentFilter !== 'all',
    industryFilter !== null,
  ].filter(Boolean).length

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold">Jobs</h1>
            <p className="text-sm text-muted mt-0.5">
              {filteredJobs.length} opportunity{filteredJobs.length !== 1 ? 'ies' : 'y'} in Sri Lanka and beyond
            </p>
          </div>
          <Button onClick={() => setShowPostModal(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Post a Job
          </Button>
        </div>

        {/* Search + Filters */}
        <div className="space-y-3 mb-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title, company, or location..."
                className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-card border-border text-muted hover:text-foreground'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="h-5 min-w-5 px-1 rounded-full bg-accent text-black text-xs flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 p-3 bg-card border border-border rounded-lg animate-fade-in">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-muted">Work Mode</label>
                <select
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value as LocationType)}
                  className="rounded-lg bg-background border border-border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="all">All</option>
                  <option value="onsite">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-muted">Employment</label>
                <select
                  value={employmentFilter}
                  onChange={e => setEmploymentFilter(e.target.value as EmploymentType)}
                  className="rounded-lg bg-background border border-border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="all">All</option>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-muted">Industry</label>
                <select
                  value={industryFilter ?? ''}
                  onChange={e => setIndustryFilter(e.target.value ? Number(e.target.value) : null)}
                  className="rounded-lg bg-background border border-border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">All industries</option>
                  {INDUSTRIES.map((ind, i) => (
                    <option key={ind.slug} value={i + 1}>{ind.icon} {ind.name}</option>
                  ))}
                </select>
              </div>
              {activeFilterCount > 0 && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setLocationFilter('all')
                      setEmploymentFilter('all')
                      setIndustryFilter(null)
                    }}
                    className="text-xs text-accent hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Job list + detail split */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-20 text-muted">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-10 w-10 text-accent" />
            </div>
            <p className="text-xl font-semibold mb-2">No jobs found</p>
            <p className="text-sm text-muted max-w-xs mx-auto">
              {searchQuery || activeFilterCount > 0
                ? 'Try adjusting your search or filters.'
                : 'Be the first to post a job opportunity!'}
            </p>
            {(searchQuery || activeFilterCount > 0) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setLocationFilter('all')
                  setEmploymentFilter('all')
                  setIndustryFilter(null)
                }}
                className="mt-3 text-sm text-accent hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-5">
            {/* Job list */}
            <div className={`space-y-2 ${selectedJob ? 'w-full md:w-[45%] lg:w-[40%]' : 'w-full'} shrink-0`}>
              {filteredJobs.map(job => {
                const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency)
                const isSelected = selectedJob?.id === job.id

                return (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="w-full text-left"
                  >
                    <Card
                      className={`transition-all ${
                        isSelected
                          ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20'
                          : 'hover:border-border hover:bg-card-hover'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Company logo placeholder */}
                        <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 text-accent font-bold text-sm">
                          {job.company_logo_url ? (
                            <img src={job.company_logo_url} alt={job.company} className="w-full h-full rounded-lg object-cover" />
                          ) : (
                            getInitials(job.company)
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm leading-snug">{job.title}</h3>
                          <p className="text-xs text-muted mt-0.5">{job.company}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {LOCATION_TYPE_LABELS[job.location_type]}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border text-muted">
                              {EMPLOYMENT_LABELS[job.employment_type]}
                            </span>
                            {salary && (
                              <span className="text-xs text-green-400 font-medium">{salary}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveToggle(job.id) }}
                            className="p-1.5 rounded-lg hover:bg-background transition-colors"
                          >
                            {savedJobIds.has(job.id) ? (
                              <BookmarkCheck className="h-4 w-4 text-accent" />
                            ) : (
                              <Bookmark className="h-4 w-4 text-muted" />
                            )}
                          </button>
                          <span className="text-[10px] text-muted">{formatDate(job.created_at)}</span>
                        </div>
                      </div>
                    </Card>
                  </button>
                )
              })}
            </div>

            {/* Job detail panel — desktop only (sticky) */}
            {selectedJob && (
              <div className="hidden md:block flex-1 min-w-0">
                <div className="sticky top-20">
                  <Card className="max-h-[calc(100dvh-7rem)] overflow-y-auto">
                    <JobDetail
                      job={selectedJob}
                      poster={posters.get(selectedJob.poster_id) ?? null}
                      userId={userId}
                      isSaved={savedJobIds.has(selectedJob.id)}
                      onSaveToggle={handleSaveToggle}
                      onClose={() => setSelectedJob(null)}
                    />
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile job detail overlay */}
        {selectedJob && (
          <div className="md:hidden fixed inset-0 z-40 bg-background overflow-y-auto pt-4 px-4 pb-24">
            <JobDetail
              job={selectedJob}
              poster={posters.get(selectedJob.poster_id) ?? null}
              userId={userId}
              isSaved={savedJobIds.has(selectedJob.id)}
              onSaveToggle={handleSaveToggle}
              onClose={() => setSelectedJob(null)}
            />
          </div>
        )}
      </div>

      {showPostModal && (
        <PostJobModal
          userId={userId}
          onClose={() => setShowPostModal(false)}
          onPosted={handleJobPosted}
        />
      )}
    </>
  )
}
