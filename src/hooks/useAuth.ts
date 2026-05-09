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

async function getProfileRole(userId: string): Promise<Role | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile role:', error)
      return null
    }

    return data?.role as Role
  } catch (err) {
    console.error('Unexpected error fetching profile role:', err)
    return null
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
        if (!user) {
          if (mounted) setState({ user: null, role: null, verified: false, loading: false })
          return
        }

        // Fetch role from profiles table (authoritative) and fallback to metadata
        const profileRole = await getProfileRole(user.id)
        
        const metadataRole = getUserRole(user)
        let role = profileRole || metadataRole

        // Fix: If database defaults to 'member' but metadata explicitly says 'admin'
        if (profileRole === 'member' && metadataRole === 'admin') {
          role = 'admin'
        }

        if (mounted) {
          // In Supabase OTP, if you have a user, you are verified
          setState({ user, role, verified: true, loading: false })
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