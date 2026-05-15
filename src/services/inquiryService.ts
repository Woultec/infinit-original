import { supabase } from './supabase'

export interface Inquiry {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'pending' | 'contacted' | 'approved' | 'rejected'
  zoom_link?: string
  scheduled_date?: string
  created_at: string
  updated_at: string
}

export interface UnavailableDate {
  id: string
  date: string
  reason?: string
  created_by?: string
  created_at: string
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

export async function setInquiryDate(id: string, scheduled_date: string) {
  const { data, error } = await supabase
    .from('inquiries')
    .update({ scheduled_date, updated_at: new Date().toISOString() })
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
  return data as Inquiry
}

export async function deleteInquiry(id: string) {
  const { error } = await supabase
    .from('inquiries')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Unavailable Dates ─────────────────────────────────────────

export async function getUnavailableDates() {
  const { data, error } = await supabase
    .from('unavailable_dates')
    .select('*')
    .order('date', { ascending: true })

  if (error) throw error
  return data as UnavailableDate[]
}

export async function addUnavailableDate(date: string, reason?: string) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('unavailable_dates')
    .insert([{ date, reason, created_by: user?.id }])
    .select()
    .single()

  if (error) throw error
  return data as UnavailableDate
}

export async function removeUnavailableDate(id: string) {
  const { error } = await supabase
    .from('unavailable_dates')
    .delete()
    .eq('id', id)

  if (error) throw error
}
