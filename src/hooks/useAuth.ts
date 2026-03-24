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
  const { data } = await supabase
    .from('confirmation_codes')
    .select('confirmed')
    .eq('user_id', userId)
    .eq('confirmed', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return !!data?.confirmed
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    verified: false,
    loading: true,
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null
      const verified = user ? await checkVerified(user.id) : false
      setState({ user, role: getUserRole(user), verified, loading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      const verified = user ? await checkVerified(user.id) : false
      setState({ user, role: getUserRole(user), verified, loading: false })
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}