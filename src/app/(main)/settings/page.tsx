'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      setLoading(false)
    }
    loadUser()
  }, [])

  async function handleExport() {
    setExporting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/settings/export')
      if (!res.ok) {
        throw new Error('Failed to export data')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'lankapros-data-export.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSuccess('Data exported successfully.')
    } catch {
      setError('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/delete-account', { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error || 'Failed to delete account')
      }
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account.')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {error && (
        <div className="rounded-lg bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {/* Account Section */}
      <section className="rounded-xl bg-card border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Email</span>
            <span>{user?.email ?? 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Member since</span>
            <span>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A'}
            </span>
          </div>
        </div>
      </section>

      {/* Data Export Section */}
      <section className="rounded-xl bg-card border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Data Export</h2>
        <p className="text-sm text-muted">
          Download a copy of your profile, posts, comments, connections, and messages.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 rounded-lg bg-accent text-black text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'Export My Data'}
        </button>
      </section>

      {/* Delete Account Section */}
      <section className="rounded-xl bg-card border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-danger">Delete Account</h2>
        <p className="text-sm text-muted">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:bg-danger/90 transition-colors"
          >
            Delete My Account
          </button>
        ) : (
          <div className="rounded-lg bg-danger/10 border border-danger/20 p-4 space-y-3">
            <p className="text-sm font-medium text-danger">
              Are you sure? This will permanently delete your account and all your data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:bg-danger/90 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg bg-card border border-border text-sm hover:bg-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
