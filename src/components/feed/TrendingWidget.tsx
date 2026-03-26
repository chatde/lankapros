'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import { INDUSTRIES } from '@/lib/constants'
import { TrendingUp, Users, Briefcase, Loader2 } from 'lucide-react'

interface TrendingGroup {
  id: number
  name: string
  icon: string | null
  member_count: number
}

export default function TrendingWidget() {
  const [topGroups, setTopGroups] = useState<TrendingGroup[]>([])
  const [recentJobCount, setRecentJobCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [{ data: groups }, { count: jobCount }] = await Promise.all([
        supabase
          .from('groups')
          .select('id, name, icon, member_count')
          .order('member_count', { ascending: false })
          .limit(5),
        supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
      ])

      if (groups) setTopGroups(groups)
      setRecentJobCount(jobCount ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <Card>
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Trending industries */}
      <Card className="p-0">
        <div className="p-3 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Trending Groups
          </h3>
        </div>
        <div className="divide-y divide-border">
          {topGroups.map(group => (
            <Link
              key={group.id}
              href={`/groups/${group.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')}`}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-card-hover transition-colors"
            >
              <span className="text-base shrink-0">{group.icon || '👥'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{group.name}</p>
                <p className="text-[10px] text-muted flex items-center gap-1">
                  <Users className="h-2.5 w-2.5" /> {group.member_count}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Jobs widget */}
      <Card>
        <Link href="/jobs" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Briefcase className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium group-hover:text-accent transition-colors">
              {recentJobCount > 0 ? `${recentJobCount} active job${recentJobCount !== 1 ? 's' : ''}` : 'Browse Jobs'}
            </p>
            <p className="text-xs text-muted">Find your next opportunity</p>
          </div>
        </Link>
      </Card>

      {/* Economy quick link */}
      <Card>
        <Link href="/economy" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium group-hover:text-accent transition-colors">Economy Dashboard</p>
            <p className="text-xs text-muted">LKR rates, CSE, macro data</p>
          </div>
        </Link>
      </Card>

      {/* Footer links */}
      <div className="text-[10px] text-muted px-1 space-y-1">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <Link href="/terms" className="hover:text-accent transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-accent transition-colors">Privacy</Link>
          <Link href="/economy" className="hover:text-accent transition-colors">Economy</Link>
        </div>
        <p>LankaPros 2024-{new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
