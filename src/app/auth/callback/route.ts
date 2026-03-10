import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawRedirect = searchParams.get('redirect') || '/feed'
  // Prevent open redirect — only allow relative paths on same origin
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/feed'

  if (code) {
    const response = NextResponse.redirect(`${origin}${redirect}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // maybeSingle() returns null data (not an error) when no row exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile?.username) {
          const editResponse = NextResponse.redirect(`${origin}/profile/edit`)
          response.cookies.getAll().forEach(({ name, value, ...options }) =>
            editResponse.cookies.set(name, value, options)
          )
          return editResponse
        }
      }

      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
