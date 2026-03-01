'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import ThemeCustomizer from '@/components/profile/ThemeCustomizer'
import { INDUSTRIES, THEME_PATTERNS } from '@/lib/constants'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import type { Profile, Experience, Education } from '@/types/database'

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [educationList, setEducationList] = useState<Education[]>([])
  const [skillsText, setSkillsText] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')

  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setAvatarFile(null); return }

    if (!allowedImageTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.')
      e.target.value = ''
      return
    }
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
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
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('File too large. Maximum size for cover photos is 5MB.')
      e.target.value = ''
      return
    }
    setCoverFile(file)
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

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

      if (p) setProfile(p)
      if (exp) setExperiences(exp)
      if (edu) setEducationList(edu)
      if (skills) setSkillsText(skills.map(s => s.name).join(', '))
      setLoading(false)
    }
    load()
  }, [router])

  function updateProfile(field: keyof Profile, value: string | number | null) {
    if (!profile) return
    setProfile({ ...profile, [field]: value } as Profile)
  }

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setMessage('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let avatarUrl = profile.avatar_url
      let coverUrl = profile.cover_url

      // Upload avatar
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `${user.id}/avatar.${ext}`
        await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = data.publicUrl
      }

      // Upload cover
      if (coverFile) {
        const ext = coverFile.name.split('.').pop()
        const path = `${user.id}/cover.${ext}`
        await supabase.storage.from('covers').upload(path, coverFile, { upsert: true })
        const { data } = supabase.storage.from('covers').getPublicUrl(path)
        coverUrl = data.publicUrl
      }

      // Update profile
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

      // Update skills
      await supabase.from('skills').delete().eq('user_id', user.id)
      const skillNames = skillsText.split(',').map(s => s.trim()).filter(Boolean)
      if (skillNames.length > 0) {
        await supabase.from('skills').insert(
          skillNames.map(name => ({ user_id: user.id, name }))
        )
      }

      toast.success('Profile updated!')
      router.refresh()
    } catch (err) {
      toast.error('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  // Experience CRUD
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

    if (data) setExperiences([data, ...experiences])
  }

  async function updateExperience(id: number, field: string, value: string | boolean | null) {
    const supabase = createClient()
    await supabase.from('experiences').update({ [field]: value }).eq('id', id)
    setExperiences(experiences.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  async function deleteExperience(id: number) {
    const supabase = createClient()
    await supabase.from('experiences').delete().eq('id', id)
    setExperiences(experiences.filter(e => e.id !== id))
  }

  // Education CRUD
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

    if (data) setEducationList([data, ...educationList])
  }

  async function updateEducation(id: number, field: string, value: string | number | null) {
    const supabase = createClient()
    await supabase.from('education').update({ [field]: value }).eq('id', id)
    setEducationList(educationList.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  async function deleteEducation(id: number) {
    const supabase = createClient()
    await supabase.from('education').delete().eq('id', id)
    setEducationList(educationList.filter(e => e.id !== id))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4 mr-1.5" /> Save
        </Button>
      </div>

      {message && (
        <p className={`text-sm ${message.startsWith('Error') ? 'text-danger' : 'text-success'}`}>{message}</p>
      )}

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
