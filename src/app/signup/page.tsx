'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { signUpSchema } from '@/lib/validations'
import AuthLayout from '@/components/layout/AuthLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const parsed = signUpSchema.safeParse({ email, password, fullName, username })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // Check username availability — maybeSingle() returns null (not an error) when no rows found
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle()

      if (checkError) {
        setError('Could not verify username availability. Please try again.')
        return
      }
      if (existing) {
        setError('Username is already taken')
        return
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!data.user) {
        // Email confirmation required — user created but session not active yet
        setConfirmationSent(true)
        return
      }

      // Session is active — update profile with username
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username, full_name: fullName })
        .eq('id', data.user.id)

      if (profileError) {
        // Account created but username save failed — let them set it in profile/edit
        console.error('Profile update error:', profileError)
      }

      router.push('/profile/edit')
      router.refresh()
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
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
        <Card className="p-6 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-xl font-semibold mb-2">Check your email</h2>
          <p className="text-sm text-muted mb-4">
            We sent a confirmation link to <span className="text-foreground">{email}</span>.
            Click it to activate your account.
          </p>
          <p className="text-xs text-muted">
            Already confirmed?{' '}
            <Link href="/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1">Join LankaPros</h2>
        <p className="text-sm text-muted mb-4">Ayubowan! Connect with Sri Lankan professionals</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="fullName"
            label="Full name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Kamal Perera"
          />
          <Input
            id="username"
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            placeholder="kamalperera"
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
