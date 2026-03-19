import { useEffect, useState } from 'react'
import { supabase } from '@services/supabase'
import { getUserRole } from '@services/auth'
import type { User } from '@supabase/supabase-js'
import type { Role } from '@lib/constants'

interface AuthState {
  user: User | null
  role: Role | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null
      setState({
        user,
        role: getUserRole(user),
        loading: false,
      })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setState({
        user,
        role: getUserRole(user),
        loading: false,
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}
