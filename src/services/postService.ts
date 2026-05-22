import { supabase } from './supabase'

export interface Post {
  id: string
  created_by: string
  title: string
  body: string
  audience: 'all' | 'members' | 'admins'
  status: 'Active' | 'Pending' | 'Rejected' | 'Draft'
  is_published?: boolean
  image_url?: string
  created_at: string
  published_at?: string
  profiles?: {
    first_name: string
    last_name: string
    email: string
  }
}

/** Live announcements for the member news feed */
export async function getMemberAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      profiles:created_by (
        first_name,
        last_name
      )
    `)
    .eq('status', 'Active')
    .in('audience', ['all', 'members'])
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Post[]
}

export async function getPosts() {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      profiles:created_by (
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Post[]
}

export async function addPost(post: Omit<Post, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('announcements')
    .insert([post])
    .select()
    .single()

  if (error) throw error
  return data as Post
}

export async function updatePost(id: string, updates: Partial<Post>) {
  const { data, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Post
}

export async function deletePost(id: string) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function uploadPostImage(file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `post-images/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('announcements')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('announcements')
    .getPublicUrl(filePath)

  return data.publicUrl
}
