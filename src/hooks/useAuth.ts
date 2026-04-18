import { useEffect, useState } from 'react'
import { supabase } from '@services/supabase'
import { getUserRole } from '@services/auth'
import type { User } from '@supabase/supabase-js'
import type { Role } from '@lib/constants'

interface AuthState {
  user: User | null
  role: Role | null
  verified: boolean   // ← new
  loading: boolean
}

async function checkVerified(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('confirmation_codes')
      .select('confirmed')
      .eq('user_id', userId)
      .eq('confirmed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // If error is PGRST116 (no rows), it just means not verified yet
      if (error.code === 'PGRST116') return false
      console.error('Check verified error:', error)
      return false
    }

    return !!data?.confirmed
  } catch (err) {
    console.error('Unexpected error checking verification:', err)
    return false
  }
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    verified: false,
    loading: true,
  })

  useEffect(() => {
    let mounted = true

    const updateState = async (session: any) => {
      try {
        const user = session?.user ?? null
        const verified = user ? await checkVerified(user.id) : false
        const role = getUserRole(user)

        if (mounted) {
          setState({ user, role, verified, loading: false })
        }
      } catch (err) {
        console.error('Auth update error:', err)
        if (mounted) {
          setState(prev => ({ ...prev, loading: false }))
        }
      }
    }

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateState(session)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateState(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return state
}