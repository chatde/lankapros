import { redirect } from 'next/navigation'

/**
 * /network redirects to /connections which has the full Network experience:
 * pending requests, suggestions, and connections list.
 */
export default function NetworkPage() {
  redirect('/connections')
}
