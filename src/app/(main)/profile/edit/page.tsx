'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import ThemeCustomizer from '@/components/profile/ThemeCustomizer'
import { INDUSTRIES, THEME_PATTERNS } from '@/lib/constants'
import { Plus, Trash2, Save, Loader2, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import type { Profile, Experience, Education } from '@/types/database'

// ---------------------------------------------------------------------------
// Onboarding wizard (shown for new users who have no username yet)
// ---------------------------------------------------------------------------

interface WizardState {
  fullName: string
  username: string
  headline: string
  industryId: string
  location: string
  bio: string
  skills: string
}

interface WizardErrors {
  fullName?: string
  username?: string
  headline?: string
  skills?: string
}

function OnboardingWizard({
  initialName,
  userId,
  onComplete,
}: {
  initialName: string
  userId: string
  onComplete: () => void
}) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [errors, setErrors] = useState<WizardErrors>({})

  const [form, setForm] = useState<WizardState>({
    fullName: initialName,
    username: '',
    headline: '',
    industryId: '',
    location: '',
    bio: '',
    skills: '',
  })

  function update(field: keyof WizardState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  async function checkUsernameUnique(username: string): Promise<boolean> {
    if (!username || username.length < 3) return false
    const supabase = createClient()
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('username', username)
      .neq('id', userId)
    return (count ?? 0) === 0
  }

  async function handleUsernameBlur() {
    const username = form.username.trim()
    if (!username) return
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setErrors(prev => ({ ...prev, username: 'Only letters, numbers, hyphens and underscores' }))
      return
    }
    if (username.length < 3) {
      setErrors(prev => ({ ...prev, username: 'At least 3 characters required' }))
      return
    }
    setCheckingUsername(true)
    const available = await checkUsernameUnique(username)
    setCheckingUsername(false)
    if (!available) {
      setErrors(prev => ({ ...prev, username: 'Username already taken — try another' }))
    }
  }

  function validateStep1(): boolean {
    const next: WizardErrors = {}
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      next.fullName = 'Full name must be at least 2 characters'
    }
    if (!form.username.trim() || form.username.trim().length < 3) {
      next.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(form.username.trim())) {
      next.username = 'Only letters, numbers, hyphens and underscores'
    }
    if (errors.username) {
      next.username = errors.username
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function saveStep1AndNext() {
    if (!validateStep1()) return
    setSaving(true)
    try {
      const supabase = createClient()
      // Re-check uniqueness at save time
      const available = await checkUsernameUnique(form.username.trim())
      if (!available) {
        setErrors(prev => ({ ...prev, username: 'Username already taken — try another' }))
        return
      }
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.fullName.trim(),
          username: form.username.trim().toLowerCase(),
          headline: form.headline.trim() || null,
        })
        .eq('id', userId)
      if (error) {
        toast.error(`Save failed: ${error.message}`)
        return
      }
      setStep(2)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function saveStep2AndNext() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          industry_id: form.industryId ? Number(form.industryId) : null,
          location: form.location.trim() || null,
          bio: form.bio.trim() || null,
        })
        .eq('id', userId)
      if (error) {
        toast.error(`Save failed: ${error.message}`)
        return
      }
      setStep(3)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleFinish() {
    const skillNames = form.skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    if (skillNames.length < 3) {
      setErrors(prev => ({ ...prev, skills: 'Add at least 3 skills to help others find you' }))
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('skills').delete().eq('user_id', userId)
      const { error } = await supabase
        .from('skills')
        .insert(skillNames.map(name => ({ user_id: userId, name })))
      if (error) {
        toast.error(`Save failed: ${error.message}`)
        return
      }
      toast.success('Welcome to LankaPros!')
      router.push('/feed')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const totalSteps = 3
  const progressPct = Math.round((step / totalSteps) * 100)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-accent mb-2">
            <Sparkles className="h-6 w-6" />
            <span className="text-sm font-semibold uppercase tracking-widest">Getting started</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {step === 1 && 'Ayubowan! 🌟 Welcome to LankaPros'}
            {step === 2 && 'Tell us about yourself'}
            {step === 3 && 'Showcase your skills'}
          </h1>
          <p className="text-muted text-sm">
            {step === 1 && "Let's set up your professional identity. This takes under 2 minutes."}
            {step === 2 && 'Help the right people find you on LankaPros.'}
            {step === 3 && 'Add at least 3 skills to help others discover your profile.'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted">
            <span>Step {step} of {totalSteps}</span>
            <span>{progressPct}% complete</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-card border border-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: '#D4A843' }}
            />
          </div>
          {/* Dot indicators */}
          <div className="flex justify-center gap-2 pt-1">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className="h-2 w-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: s <= step ? '#D4A843' : undefined,
                  opacity: s <= step ? 1 : 0.3,
                }}
                aria-hidden
              />
            ))}
          </div>
        </div>

        {/* Step 1 — Welcome / Identity */}
        {step === 1 && (
          <Card className="space-y-5 p-6">
            <Input
              id="wiz-fullname"
              label="Full name"
              value={form.fullName}
              onChange={e => update('fullName', e.target.value)}
              error={errors.fullName}
              placeholder="e.g. Nimal Perera"
              autoFocus
            />
            <div className="space-y-1">
              <Input
                id="wiz-username"
                label="Username"
                value={form.username}
                onChange={e =>
                  update('username', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                }
                onBlur={handleUsernameBlur}
                error={errors.username}
                placeholder="e.g. nimal_perera"
              />
              {checkingUsername && (
                <p className="text-xs text-muted flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking availability…
                </p>
              )}
              {!errors.username && !checkingUsername && form.username.length >= 3 && (
                <p className="text-xs text-green-500">Username looks good!</p>
              )}
            </div>
            <Input
              id="wiz-headline"
              label="Headline (optional)"
              value={form.headline}
              onChange={e => update('headline', e.target.value)}
              placeholder="e.g. Senior Software Engineer at WSO2"
              maxLength={200}
            />
            <div className="flex justify-end pt-2">
              <Button onClick={saveStep1AndNext} loading={saving} size="lg">
                Next <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2 — About you */}
        {step === 2 && (
          <Card className="space-y-5 p-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted" htmlFor="wiz-industry">
                Industry
              </label>
              <select
                id="wiz-industry"
                value={form.industryId}
                onChange={e => update('industryId', e.target.value)}
                className="w-full rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select your industry</option>
                {INDUSTRIES.map((ind, i) => (
                  <option key={ind.slug} value={i + 1}>
                    {ind.icon} {ind.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="wiz-location"
              label="Location"
              value={form.location}
              onChange={e => update('location', e.target.value)}
              placeholder="e.g. Colombo, Sri Lanka"
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted" htmlFor="wiz-bio">
                Bio (optional)
              </label>
              <textarea
                id="wiz-bio"
                value={form.bio}
                onChange={e => update('bio', e.target.value)}
                placeholder="Tell the LankaPros community a bit about yourself…"
                maxLength={2000}
                className="w-full rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent min-h-[100px] resize-y"
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="secondary" onClick={() => setStep(1)} size="lg">
                <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={saveStep2AndNext} loading={saving} size="lg">
                Next <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3 — Skills */}
        {step === 3 && (
          <Card className="space-y-5 p-6">
            <p className="text-sm text-muted">
              Add your professional skills separated by commas. The more specific, the better.
            </p>
            <Input
              id="wiz-skills"
              label="Your skills"
              value={form.skills}
              onChange={e => {
                update('skills', e.target.value)
              }}
              error={errors.skills}
              placeholder="JavaScript, React, Project Management, …"
            />
            <p className="text-xs text-muted">
              {form.skills.split(',').filter(s => s.trim()).length} skill
              {form.skills.split(',').filter(s => s.trim()).length !== 1 ? 's' : ''} added
              {form.skills.split(',').filter(s => s.trim()).length < 3 && (
                <span className="text-accent"> — add at least 3</span>
              )}
            </p>

            <div className="flex justify-between pt-2">
              <Button variant="secondary" onClick={() => setStep(2)} size="lg">
                <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleFinish} loading={saving} size="lg">
                Finish setup
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Full edit form (existing users — unchanged behaviour)
// ---------------------------------------------------------------------------

function ExistingUserEditForm({
  profile: initialProfile,
  experiences: initialExperiences,
  educationList: initialEducationList,
  skillsText: initialSkillsText,
}: {
  profile: Profile
  experiences: Experience[]
  educationList: Education[]
  skillsText: string
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences)
  const [educationList, setEducationList] = useState<Education[]>(initialEducationList)
  const [skillsText, setSkillsText] = useState(initialSkillsText)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setAvatarFile(null); return }
    if (!allowedImageTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.')
      e.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File too large. Maximum size for avatars is 2MB.')
      e.target.value = ''
      return
    }
    setAvatarFile(file)
  }

  function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setCoverFile(null); return }
    if (!allowedImageTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size for cover photos is 5MB.')
      e.target.value = ''
      return
    }
    setCoverFile(file)
  }

  function updateProfile(field: keyof Profile, value: string | number | null) {
    setProfile(prev => ({ ...prev, [field]: value } as Profile))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let avatarUrl = profile.avatar_url
      let coverUrl = profile.cover_url

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `${user.id}/avatar.${ext}`
        await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = data.publicUrl
      }

      if (coverFile) {
        const ext = coverFile.name.split('.').pop()
        const path = `${user.id}/cover.${ext}`
        await supabase.storage.from('covers').upload(path, coverFile, { upsert: true })
        const { data } = supabase.storage.from('covers').getPublicUrl(path)
        coverUrl = data.publicUrl
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          username: profile.username,
          headline: profile.headline,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          industry_id: profile.industry_id,
          avatar_url: avatarUrl,
          cover_url: coverUrl,
          theme_accent: profile.theme_accent,
          theme_bg: profile.theme_bg,
          theme_text: profile.theme_text,
          theme_pattern: profile.theme_pattern,
        })
        .eq('id', user.id)

      if (error) {
        toast.error(`Error: ${error.message}`)
        return
      }

      await supabase.from('skills').delete().eq('user_id', user.id)
      const skillNames = skillsText.split(',').map(s => s.trim()).filter(Boolean)
      if (skillNames.length > 0) {
        await supabase.from('skills').insert(skillNames.map(name => ({ user_id: user.id, name })))
      }

      toast.success('Profile updated!')
      router.refresh()
    } catch {
      toast.error('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  async function addExperience() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('experiences')
      .insert({
        user_id: user.id,
        title: 'New Position',
        company: 'Company',
        start_date: new Date().toISOString().split('T')[0],
        current: true,
      })
      .select()
      .single()
    if (data) setExperiences(prev => [data, ...prev])
  }

  async function updateExperience(id: number, field: string, value: string | boolean | null) {
    const supabase = createClient()
    await supabase.from('experiences').update({ [field]: value }).eq('id', id)
    setExperiences(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  async function deleteExperience(id: number) {
    const supabase = createClient()
    await supabase.from('experiences').delete().eq('id', id)
    setExperiences(prev => prev.filter(e => e.id !== id))
  }

  async function addEducation() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('education')
      .insert({
        user_id: user.id,
        institution: 'Institution',
        start_year: new Date().getFullYear(),
      })
      .select()
      .single()
    if (data) setEducationList(prev => [data, ...prev])
  }

  async function updateEducation(id: number, field: string, value: string | number | null) {
    const supabase = createClient()
    await supabase.from('education').update({ [field]: value }).eq('id', id)
    setEducationList(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  async function deleteEducation(id: number) {
    const supabase = createClient()
    await supabase.from('education').delete().eq('id', id)
    setEducationList(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4 mr-1.5" /> Save
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <h2 className="font-semibold mb-4">Basic Info</h2>
        <div className="space-y-4">
          <Input id="fullName" label="Full name" value={profile.full_name || ''} onChange={e => updateProfile('full_name', e.target.value)} />
          <Input id="username" label="Username" value={profile.username || ''} onChange={e => updateProfile('username', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} />
          <Input id="headline" label="Headline" value={profile.headline || ''} onChange={e => updateProfile('headline', e.target.value)} placeholder="e.g. Senior Software Engineer at WSO2" />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-muted">Bio</label>
            <textarea
              value={profile.bio || ''}
              onChange={e => updateProfile('bio', e.target.value)}
              className="w-full rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent min-h-[100px] resize-y"
              maxLength={2000}
            />
          </div>
          <Input id="location" label="Location" value={profile.location || ''} onChange={e => updateProfile('location', e.target.value)} placeholder="e.g. Colombo, Sri Lanka" />
          <Input id="website" label="Website" value={profile.website || ''} onChange={e => updateProfile('website', e.target.value)} placeholder="https://..." />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-muted">Industry</label>
            <select
              value={profile.industry_id || ''}
              onChange={e => updateProfile('industry_id', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map((ind, i) => (
                <option key={ind.slug} value={i + 1}>{ind.icon} {ind.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Photos */}
      <Card>
        <h2 className="font-semibold mb-4">Photos</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Avatar</label>
            <input type="file" accept="image/*" onChange={handleAvatarSelect} className="text-sm text-muted" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Cover photo</label>
            <input type="file" accept="image/*" onChange={handleCoverSelect} className="text-sm text-muted" />
          </div>
        </div>
      </Card>

      {/* Theme */}
      <ThemeCustomizer
        accent={profile.theme_accent}
        bg={profile.theme_bg}
        text={profile.theme_text}
        pattern={profile.theme_pattern}
        onAccentChange={v => updateProfile('theme_accent', v)}
        onBgChange={v => updateProfile('theme_bg', v)}
        onTextChange={v => updateProfile('theme_text', v)}
        onPatternChange={v => updateProfile('theme_pattern', v)}
      />

      {/* Skills */}
      <Card>
        <h2 className="font-semibold mb-4">Skills</h2>
        <Input
          id="skills"
          label="Comma-separated skills"
          value={skillsText}
          onChange={e => setSkillsText(e.target.value)}
          placeholder="JavaScript, React, Node.js, ..."
        />
      </Card>

      {/* Experience */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Experience</h2>
          <Button size="sm" variant="secondary" onClick={addExperience}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-4">
          {experiences.map(exp => (
            <div key={exp.id} className="border border-border rounded-lg p-3 space-y-3">
              <div className="flex justify-between">
                <Input id={`title-${exp.id}`} label="Title" value={exp.title} onChange={e => updateExperience(exp.id, 'title', e.target.value)} className="flex-1" />
                <button onClick={() => deleteExperience(exp.id)} className="ml-2 p-2 text-muted hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Input id={`company-${exp.id}`} label="Company" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} />
              <Input id={`loc-${exp.id}`} label="Location" value={exp.location || ''} onChange={e => updateExperience(exp.id, 'location', e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input id={`start-${exp.id}`} label="Start date" type="date" value={exp.start_date} onChange={e => updateExperience(exp.id, 'start_date', e.target.value)} />
                <Input id={`end-${exp.id}`} label="End date" type="date" value={exp.end_date || ''} onChange={e => updateExperience(exp.id, 'end_date', e.target.value || null)} disabled={exp.current} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={exp.current} onChange={e => updateExperience(exp.id, 'current', e.target.checked)} className="accent-accent" />
                Currently working here
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Education */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Education</h2>
          <Button size="sm" variant="secondary" onClick={addEducation}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-4">
          {educationList.map(edu => (
            <div key={edu.id} className="border border-border rounded-lg p-3 space-y-3">
              <div className="flex justify-between">
                <Input id={`inst-${edu.id}`} label="Institution" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} className="flex-1" />
                <button onClick={() => deleteEducation(edu.id)} className="ml-2 p-2 text-muted hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Input id={`degree-${edu.id}`} label="Degree" value={edu.degree || ''} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} />
              <Input id={`field-${edu.id}`} label="Field of study" value={edu.field || ''} onChange={e => updateEducation(edu.id, 'field', e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input id={`sy-${edu.id}`} label="Start year" type="number" value={edu.start_year} onChange={e => updateEducation(edu.id, 'start_year', Number(e.target.value))} />
                <Input id={`ey-${edu.id}`} label="End year" type="number" value={edu.end_year || ''} onChange={e => updateEducation(edu.id, 'end_year', e.target.value ? Number(e.target.value) : null)} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4 mr-1.5" /> Save all changes
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page shell — loads data, decides which view to render
// ---------------------------------------------------------------------------

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [creatingProfile, setCreatingProfile] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [educationList, setEducationList] = useState<Education[]>([])
  const [skillsText, setSkillsText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    setUserId(user.id)
    // Prefer display_name → full_name → email prefix as the default full name
    const googleName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email?.split('@')[0] ||
      ''
    setUserName(googleName)

    const [
      { data: p },
      { data: exp },
      { data: edu },
      { data: skills },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('experiences').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
      supabase.from('education').select('*').eq('user_id', user.id).order('start_year', { ascending: false }),
      supabase.from('skills').select('*').eq('user_id', user.id),
    ])

    if (p) {
      setProfile(p)
    } else {
      // Profile row missing (e.g. Google OAuth new user with no trigger) — upsert a blank row
      setCreatingProfile(true)
      const { data: upserted, error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            full_name: googleName || null,
          },
          { onConflict: 'id' }
        )
        .select()
        .single()
      setCreatingProfile(false)

      if (upsertError) {
        toast.error('Could not create your profile. Please try refreshing the page.')
      } else if (upserted) {
        setProfile(upserted)
      }
    }

    if (exp) setExperiences(exp)
    if (edu) setEducationList(edu)
    if (skills) setSkillsText(skills.map((s: { name: string }) => s.name).join(', '))
    setLoading(false)
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading || creatingProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-muted">
          {creatingProfile ? 'Setting up your profile…' : 'Loading…'}
        </p>
      </div>
    )
  }

  // Profile still null after upsert attempt — show a friendly error instead of blank page
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
        <p className="text-foreground font-semibold">We could not load your profile.</p>
        <p className="text-sm text-muted">Please refresh the page or sign out and back in.</p>
        <Button onClick={() => { setLoading(true); loadData() }}>Try again</Button>
      </div>
    )
  }

  // New user — no username set yet → show onboarding wizard
  if (!profile.username) {
    return (
      <OnboardingWizard
        initialName={profile.full_name || userName}
        userId={profile.id}
        onComplete={() => router.push('/feed')}
      />
    )
  }

  // Existing user → full edit form
  return (
    <ExistingUserEditForm
      profile={profile}
      experiences={experiences}
      educationList={educationList}
      skillsText={skillsText}
    />
  )
}
