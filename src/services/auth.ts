import { supabase } from './supabase'
import type { Role } from '@lib/constants'

/** Sign in with email and password */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

/** Sign out the current user */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** Get the currently authenticated user */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/** Get the role of the current user from metadata */
export function getUserRole(user: { user_metadata?: { role?: Role } } | null): Role | null {
  return user?.user_metadata?.role ?? null
}
