import 'server-only'
import { getResend, FROM_ADDRESS } from './resend'
import {
  renderWelcomeEmail,
  renderPaymentFailedEmail,
  renderSubscriptionExpiredEmail,
} from './templates'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'

type Db = SupabaseClient<Database>

// Fetch user profile name and email
async function fetchUserProfile(db: Db, userId: string) {
  const { data, error } = await db
    .from('user_profiles')
    .select('email, name')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error(`[email.service] Error fetching user profile for ${userId}:`, error)
    return null
  }
  return data
}

/**
 * Sends a welcome email when a user subscribes.
 */
export async function sendWelcomeEmail(
  db: Db,
  userId: string,
  planName: string,
  appUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const profile = await fetchUserProfile(db, userId)
    if (!profile || !profile.email) {
      console.warn(`[email.service] Could not send welcome email: user profile or email missing for user ${userId}`)
      return { ok: false, error: 'User profile or email not found' }
    }

    const name = profile.name || 'Estudante'
    const template = renderWelcomeEmail(name, planName, appUrl)

    const resend = getResend()
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: profile.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    if (result.error) {
      console.error('[email.service] Resend welcome email error:', result.error)
      return { ok: false, error: result.error.message }
    }

    return { ok: true }
  } catch (err: unknown) {
    console.error('[email.service] Unexpected error in sendWelcomeEmail:', err)
    return { ok: false, error: (err as Error).message }
  }
}

/**
 * Sends a notification if payment fails (invoice.payment_failed).
 */
export async function sendPaymentFailedEmail(
  db: Db,
  userId: string,
  billingUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const profile = await fetchUserProfile(db, userId)
    if (!profile || !profile.email) {
      console.warn(`[email.service] Could not send payment failed email: user profile or email missing for user ${userId}`)
      return { ok: false, error: 'User profile or email not found' }
    }

    const name = profile.name || 'Estudante'
    const template = renderPaymentFailedEmail(name, billingUrl)

    const resend = getResend()
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: profile.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    if (result.error) {
      console.error('[email.service] Resend payment failed email error:', result.error)
      return { ok: false, error: result.error.message }
    }

    return { ok: true }
  } catch (err: unknown) {
    console.error('[email.service] Unexpected error in sendPaymentFailedEmail:', err)
    return { ok: false, error: (err as Error).message }
  }
}

/**
 * Sends an email confirming the subscription was canceled or expired.
 */
export async function sendSubscriptionExpiredEmail(
  db: Db,
  userId: string,
  appUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const profile = await fetchUserProfile(db, userId)
    if (!profile || !profile.email) {
      console.warn(`[email.service] Could not send expired email: user profile or email missing for user ${userId}`)
      return { ok: false, error: 'User profile or email not found' }
    }

    const name = profile.name || 'Estudante'
    const template = renderSubscriptionExpiredEmail(name, appUrl)

    const resend = getResend()
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: profile.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    if (result.error) {
      console.error('[email.service] Resend subscription expired email error:', result.error)
      return { ok: false, error: result.error.message }
    }

    return { ok: true }
  } catch (err: unknown) {
    console.error('[email.service] Unexpected error in sendSubscriptionExpiredEmail:', err)
    return { ok: false, error: (err as Error).message }
  }
}
