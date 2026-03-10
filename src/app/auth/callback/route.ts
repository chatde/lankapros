import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawRedirect = searchParams.get('redirect') || '/feed'
  // Prevent open redirect — only allow relative paths on same origin
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/feed'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Auth callback getUser error:', userError)
        return NextResponse.redirect(`${origin}/login?error=auth`)
      }

      if (user) {
        // maybeSingle() returns null data (not an error) when no row exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile?.username) {
          return NextResponse.redirect(`${origin}/profile/edit`)
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`)
    }

    console.error('Auth callback exchangeCodeForSession error:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
