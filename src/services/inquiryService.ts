import { supabase } from './supabase'

export interface Inquiry {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'pending' | 'contacted' | 'approved' | 'rejected'
  zoom_link?: string
  created_at: string
  updated_at: string
}

export async function getInquiries() {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Inquiry[]
}

export async function updateInquiryStatus(id: string, status: Inquiry['status']) {
  const { data, error } = await supabase
    .from('inquiries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Inquiry
}

export async function sendZoomLink(id: string, zoomLink: string) {
  const { data, error } = await supabase
    .from('inquiries')
    .update({ 
      zoom_link: zoomLink, 
      status: 'contacted',
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  
  // Note: In a real production app, you would trigger an email here 
  // via a Supabase Edge Function using your SMTP provider.
  return data as Inquiry
}

export async function deleteInquiry(id: string) {
  const { error } = await supabase
    .from('inquiries')
    .delete()
    .eq('id', id)

  if (error) throw error
}
