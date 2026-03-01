import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    const [
      { data: profile },
      { data: experiences },
      { data: education },
      { data: skills },
      { data: posts },
      { data: comments },
      { data: connections },
      { data: conversations },
      { data: messages },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('experiences').select('*').eq('user_id', userId),
      supabase.from('education').select('*').eq('user_id', userId),
      supabase.from('skills').select('*').eq('user_id', userId),
      supabase.from('posts').select('*').eq('author_id', userId),
      supabase.from('comments').select('*').eq('author_id', userId),
      supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
      supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`),
      supabase.from('messages').select('*').eq('sender_id', userId),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      account: {
        email: user.email,
        created_at: user.created_at,
      },
      profile,
      experiences: experiences ?? [],
      education: education ?? [],
      skills: skills ?? [],
      posts: posts ?? [],
      comments: comments ?? [],
      connections: connections ?? [],
      conversations: conversations ?? [],
      messages: messages ?? [],
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="lankapros-data-export.json"',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
