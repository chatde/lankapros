import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawRedirect = searchParams.get('redirect') || '/feed'
  // Prevent open redirect — only allow relative paths on same origin
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/feed'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  // Buffer cookies — apply to final response once destination is known
  const pendingCookies: Array<{ name: string; value: string; options?: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet)
        },
      },
    }
  )

  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  let destination = redirect

  if (user) {
    // Check if profile exists — trigger may have failed on first OAuth
    let { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      // Trigger failed — create profile directly using the authenticated session
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: (user.user_metadata?.full_name ?? user.user_metadata?.name ?? null) as string | null,
        avatar_url: (user.user_metadata?.avatar_url ?? null) as string | null,
      })

      const { data: retried } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle()
      profile = retried
    }

    // New user — no username yet, send to profile setup
    if (!profile?.username) {
      destination = '/profile/edit'
    }
  }

  // Apply all buffered cookies to the final response
  const finalResponse = NextResponse.redirect(`${origin}${destination}`)
  for (const { name, value, options } of pendingCookies) {
    finalResponse.cookies.set(name, value, options ?? {})
  }
  return finalResponse
}
