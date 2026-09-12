import { useEffect, useState } from 'react'
import { subscribeToUserCollection } from '../lib/firestore'

const initialActivity = { resumes: [], atsReports: [], interviewSessions: [], testAttempts: [], mentorshipBookings: [] }

export default function useDashboardActivity(userId) {
  const [activity, setActivity] = useState(initialActivity)
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) {
      setActivity(initialActivity)
      setLoading(false)
      setError('')
      return undefined
    }
    setActivity(initialActivity)
    setLoading(true)
    setError('')
    const subscriptions = [
      ['resumes', 'updatedAt'],
      ['atsReports', 'createdAt'],
      ['interviewSessions', 'createdAt'],
      ['testAttempts', 'createdAt'],
      ['mentorshipBookings', 'createdAt'],
    ].map(([collectionName, sortField]) => subscribeToUserCollection(collectionName, userId, (items) => {
      setActivity((current) => ({ ...current, [collectionName]: items }))
      setLoading(false)
    }, () => { setError('Some activity could not be loaded. Check your Firestore indexes or connection.'); setLoading(false) }, sortField))
    return () => subscriptions.forEach((unsubscribe) => unsubscribe())
  }, [userId])

  return { activity, loading, error }
}

export function getTimestamp(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  return new Date(value)
}

export function formatActivityDate(value) {
  const date = getTimestamp(value)
  return date && !Number.isNaN(date.valueOf()) ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date) : 'Recently updated'
}
