'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import AuthLayout from '@/components/layout/AuthLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

// Username is NOT collected here — the onboarding wizard (profile/edit) handles it.
// This keeps signup simple and ensures ALL new users go through the wizard.
const signupFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
})

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const parsed = signupFormSchema.safeParse({ email, password, fullName })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          // Ensure confirmation email lands back on the onboarding wizard
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/profile/edit`,
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      // No active session = email confirmation required
      // (data.user exists but data.session is null when confirmation is pending)
      if (!data.session) {
        setConfirmationSent(true)
        return
      }

      // Session active (email confirmation disabled in project settings)
      // Go straight to onboarding wizard
      router.push('/profile/edit')
      router.refresh()
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || resending) return
    setResending(true)
    try {
      const supabase = createClient()
      await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/profile/edit`,
        },
      })
      // Start 60-second cooldown to prevent spam
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch {
      // Supabase rate-limits silently — no need to surface this error
    } finally {
      setResending(false)
    }
  }

  async function handleGoogleSignup() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/profile/edit`,
      },
    })
    if (error) {
      setError('Could not connect to Google. Please try again or use email.')
    }
  }

  if (confirmationSent) {
    return (
      <AuthLayout>
        <Card className="p-6 text-center space-y-4">
          <div className="text-5xl" role="img" aria-label="Email sent">📬</div>
          <div>
            <h2 className="text-xl font-semibold mb-1">Check your email</h2>
            <p className="text-sm text-muted">
              We sent a confirmation link to{' '}
              <span className="text-foreground font-medium">{email}</span>.
              Click it to activate your account — then you&apos;ll be guided through your profile setup.
            </p>
          </div>
          <div className="border-t border-border pt-3 space-y-2 text-xs text-muted">
            <p>
              Didn&apos;t receive it? Check your spam folder, or{' '}
              <button
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="text-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0
                  ? `resend in ${resendCooldown}s`
                  : resending
                  ? 'sending…'
                  : 'resend the email'}
              </button>
            </p>
            <p>
              Already confirmed?{' '}
              <Link href="/login" className="text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1">Join LankaPros</h2>
        <p className="text-sm text-muted mb-4">
          Ayubowan! Connect with Sri Lankan professionals
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="fullName"
            label="Full name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Kamal Perera"
            autoFocus
          />
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">
            Create account
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted">or</span>
          </div>
        </div>

        <Button variant="secondary" onClick={handleGoogleSignup} className="w-full">
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </AuthLayout>
  )
}
