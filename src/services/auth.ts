import { supabase } from './supabase'
import type { Role } from '@lib/constants'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export function getUserRole(user: { user_metadata?: { role?: Role } } | null): Role | null {
  return user?.user_metadata?.role ?? null
}

export async function sendConfirmationCode(userId: string, email: string): Promise<string> {
  const code = Math.floor(10000000 + Math.random() * 90000000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  // Save code to DB
  const { error } = await supabase
    .from('confirmation_codes')
    .upsert(
      { user_id: userId, code, expires_at: expiresAt, confirmed: false },
      { onConflict: 'user_id' }
    )

  if (error) throw new Error(error.message)

  // Send email via Edge Function
  const { data: emailData, error: emailError } = await supabase.functions.invoke(
    'send-confirmation-email',
    {
      body: { email, code },
    }
  )

  if (emailError) {
    console.error('Email function error:', emailError)
    throw new Error(`Failed to send confirmation email: ${emailError.message}`)
  }

  if (emailData?.error) {
    console.error('Email send error:', emailData.error)
    throw new Error(`Failed to send confirmation email: ${emailData.error}`)
  }

  return code
}

export async function verifyConfirmationCode(userId: string, code: string): Promise<void> {
  const { data, error } = await supabase
    .from('confirmation_codes')
    .select('code, expires_at, confirmed')
    .eq('user_id', userId)
    .single()

  if (error || !data) throw new Error('Code not found. Please sign in again.')
  if (data.confirmed) throw new Error('Code already used. Please sign in again.')
  if (new Date(data.expires_at) < new Date()) throw new Error('Code has expired. Please sign in again.')
  if (data.code !== code) throw new Error('Invalid code. Please try again.')

  const { error: updateError } = await supabase
    .from('confirmation_codes')
    .update({ confirmed: true })
    .eq('user_id', userId)

  if (updateError) throw new Error(updateError.message)
}