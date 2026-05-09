import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'
import type { Role } from '@lib/constants'

// Secondary client for registration only — doesn't persist session
// This prevents logging out the current admin when creating new users
const registrationClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { 
    auth: { 
      persistSession: false,
      storageKey: 'sb-registration-token' // Unique key to avoid instance conflict warnings
    } 
  }
)

export async function register(
  email: string, 
  password: string, 
  role: Role, 
  firstName: string,
  lastName: string,
  username: string,
  phone: string
) {
  const { data, error } = await registrationClient.auth.signUp({
    email,
    password,
    options: {
      data: { 
        role,
        first_name: firstName,
        last_name: lastName,
        username: username,
        contacts: phone,
        full_name: `${firstName} ${lastName}`
      }
    }
  })
  if (error) throw error
  return data
}

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

export async function sendSupabaseOTP(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // Prevents random people from signing up via login
    },
  })
  if (error) throw error
}

export async function verifySupabaseOTP(email: string, token: string) {
  // 1. Try verifying as a standard login (magiclink)
  let { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'magiclink',
  })

  // 2. If that fails, try verifying as a new signup confirmation
  if (error) {
    const { data: signupData, error: signupError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    })
    
    if (signupError) throw signupError
    return signupData
  }

  return data
}