import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/neon'
import type { Profile, Experience, Education, Skill, Post, Comment, Connection, Conversation, Message } from '@/types/database'

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
      db.from<Profile>('profiles').select('*').eq('id', userId).single(),
      db.from<Experience>('experiences').select('*').eq('user_id', userId),
      db.from<Education>('education').select('*').eq('user_id', userId),
      db.from<Skill>('skills').select('*').eq('user_id', userId),
      db.from<Post>('posts').select('*').eq('author_id', userId),
      db.from<Comment>('comments').select('*').eq('author_id', userId),
      db.from<Connection>('connections').select('*').or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
      db.from<Conversation>('conversations').select('*').or(`participant_1.eq.${userId},participant_2.eq.${userId}`),
      db.from<Message>('messages').select('*').eq('sender_id', userId),
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
