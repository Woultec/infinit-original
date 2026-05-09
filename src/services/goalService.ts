import { supabase } from './supabase'

export interface Goal {
  id: string
  created_by: string
  title: string
  description: string
  milestone_date: string
  status: 'Active' | 'Pending' | 'Rejected' | 'Completed'
  priority: 'Low' | 'Medium' | 'High'
  created_at: string
  approved_at?: string
  profiles?: {
    first_name: string
    last_name: string
    email: string
  }
}

export async function getGoals() {
  const { data, error } = await supabase
    .from('goals')
    .select(`
      *,
      profiles:created_by (
        first_name,
        last_name,
        email
      )
    `)
    .order('milestone_date', { ascending: true })

  if (error) throw error
  return data as Goal[]
}

export async function addGoal(goal: Omit<Goal, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('goals')
    .insert([goal])
    .select()
    .single()

  if (error) throw error
  return data as Goal
}

export async function updateGoal(id: string, updates: Partial<Goal>) {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Goal
}

export async function deleteGoal(id: string) {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)

  if (error) throw error
}
