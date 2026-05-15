import { useEffect, useState } from 'react'
import { 
  getInquiries, updateInquiryStatus, sendZoomLink, deleteInquiry, setInquiryDate,
  getUnavailableDates, addUnavailableDate, removeUnavailableDate,
  type Inquiry, type UnavailableDate 
} from '@services/inquiryService'
import { supabase } from '@services/supabase'
import { useAuth } from '@hooks/useAuth'
import { SUPER_ADMIN_EMAIL } from '@lib/constants'
import { 
  MessageSquare, Video, Mail, Calendar, 
  CheckCircle2, XCircle, Trash2, ExternalLink,
  Search, Clock, User, CalendarOff, Plus, X,
  ChevronDown, ChevronUp, Shield, AlertCircle
} from 'lucide-react'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'

export function AdminInquiry() {
  const { user } = useAuth()
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Zoom Modal State
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [zoomLink, setZoomLink] = useState('')
  const [sending, setSending] = useState(false)

  // Date Picker Modal State
  const [dateInquiry, setDateInquiry] = useState<Inquiry | null>(null)
  const [selectedDate, setSelectedDate] = useState('')

  // Unavailable Dates State
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([])
  const [showUnavailPanel, setShowUnavailPanel] = useState(false)
  const [newUnavailDate, setNewUnavailDate] = useState('')
  const [newUnavailReason, setNewUnavailReason] = useState('')
  const [addingUnavail, setAddingUnavail] = useState(false)

  useEffect(() => {
    fetchInquiries()
    fetchUnavailableDates()
  }, [])

  async function fetchInquiries() {
    try {
      const data = await getInquiries()
      setInquiries(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUnavailableDates() {
    try {
      const data = await getUnavailableDates()
      setUnavailableDates(data)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleStatusUpdate(id: string, status: Inquiry['status']) {
    try {
      const updated = await updateInquiryStatus(id, status)
      setInquiries(prev => prev.map(i => i.id === id ? updated : i))
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleSendZoom() {
    if (!selectedInquiry || !zoomLink) return
    setSending(true)
    
    try {
      // 1. Save zoom link to database
      const updated = await sendZoomLink(selectedInquiry.id, zoomLink)
      setInquiries(prev => prev.map(i => i.id === selectedInquiry.id ? updated : i))
      
      // 2. Send automated email via Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-meeting-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          to: selectedInquiry.email,
          name: selectedInquiry.name,
          subject: selectedInquiry.subject,
          zoomLink: zoomLink
        })
      })

      if (!response.ok) {
        const rawText = await response.text()
        console.error('Edge Function error:', response.status, rawText)
        let errorMsg = `Edge Function error (${response.status}): `
        try {
          const errData = JSON.parse(rawText)
          errorMsg += errData.error || rawText
        } catch {
          errorMsg += rawText
        }
        throw new Error(errorMsg)
      }

      alert('Success! Meeting link saved and invitation email sent automatically to ' + selectedInquiry.email)
      handleCloseModal()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Saved to database, but automated email failed.')
      handleCloseModal()
    } finally {
      setSending(false)
    }
  }


  async function handleSetDate() {
    if (!dateInquiry || !selectedDate) return
    try {
      const updated = await setInquiryDate(dateInquiry.id, selectedDate)
      setInquiries(prev => prev.map(i => i.id === dateInquiry.id ? updated : i))
      handleCloseDateModal()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this inquiry?')) return
    try {
      await deleteInquiry(id)
      setInquiries(prev => prev.filter(i => i.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleAddUnavailDate() {
    if (!newUnavailDate) return
    setAddingUnavail(true)
    try {
      const added = await addUnavailableDate(newUnavailDate, newUnavailReason || undefined)
      setUnavailableDates(prev => [...prev, added].sort((a, b) => a.date.localeCompare(b.date)))
      setNewUnavailDate('')
      setNewUnavailReason('')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setAddingUnavail(false)
    }
  }

  async function handleRemoveUnavailDate(id: string) {
    try {
      await removeUnavailableDate(id)
      setUnavailableDates(prev => prev.filter(d => d.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  function handleCloseModal() {
    setSelectedInquiry(null)
    setZoomLink('')
  }

  function handleCloseDateModal() {
    setDateInquiry(null)
    setSelectedDate('')
  }

  // Check if a date string is unavailable
  function isDateUnavailable(dateStr: string) {
    return unavailableDates.some(ud => ud.date === dateStr)
  }

  // Get today's date in YYYY-MM-DD format
  function getTodayStr() {
    return new Date().toISOString().split('T')[0]
  }

  const filtered = inquiries.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || 
                         i.email.toLowerCase().includes(search.toLowerCase()) ||
                         i.subject.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filterStatus === 'all' || i.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Inquiries</h1>
        <p className="text-muted-foreground">Manage messages and meeting requests from the landing page.</p>
      </div>

      {/* ── Super Admin: Unavailable Dates Panel ── */}
      {isSuperAdmin && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-800/50 overflow-hidden transition-all">
          <button
            onClick={() => setShowUnavailPanel(!showUnavailPanel)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-amber-100/40 dark:hover:bg-amber-900/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
                <CalendarOff className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm flex items-center gap-2">
                  Manage Unavailable Dates
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 text-[9px] font-bold uppercase tracking-wider">Super Admin</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {unavailableDates.length} date{unavailableDates.length !== 1 ? 's' : ''} blocked
                </div>
              </div>
            </div>
            {showUnavailPanel ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {showUnavailPanel && (
            <div className="px-6 pb-6 space-y-4 border-t border-amber-200 dark:border-amber-800/50 pt-4">
              {/* Add New */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date to Block</label>
                  <Input
                    type="date"
                    value={newUnavailDate}
                    onChange={e => setNewUnavailDate(e.target.value)}
                    min={getTodayStr()}
                    className="h-9"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Reason (optional)</label>
                  <Input
                    placeholder="e.g., Holiday, Maintenance..."
                    value={newUnavailReason}
                    onChange={e => setNewUnavailReason(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    size="sm"
                    className="gap-1.5 h-9 bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={!newUnavailDate || addingUnavail}
                    onClick={handleAddUnavailDate}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {addingUnavail ? 'Adding...' : 'Block Date'}
                  </Button>
                </div>
              </div>

              {/* Blocked Dates List */}
              {unavailableDates.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-4 border border-dashed border-amber-300 dark:border-amber-700 rounded-xl">
                  No dates are currently blocked.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {unavailableDates.map(ud => (
                    <div
                      key={ud.id}
                      className="flex items-center justify-between gap-2 bg-white dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl px-3 py-2.5 group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CalendarOff className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">
                            {new Date(ud.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          {ud.reason && (
                            <div className="text-[10px] text-muted-foreground truncate">{ud.reason}</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveUnavailDate(ud.id)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        title="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name, email or subject..." 
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select 
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-10 rounded-lg border bg-background px-3 text-sm outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Permission notice for non-super admins */}
      {!isSuperAdmin && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 p-3 text-xs text-blue-700 dark:text-blue-300">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          <span>Zoom links and inquiry deletion are managed by the Super Admin. You can set dates and update statuses.</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-muted-foreground italic text-sm animate-pulse">
          Fetching inquiries...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-muted/20">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No inquiries found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(inquiry => (
            <div key={inquiry.id} className="group border rounded-2xl bg-card p-5 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center gap-6">
              {/* Status & Date */}
              <div className="flex flex-col gap-2 min-w-[120px]">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit ${
                  inquiry.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                  inquiry.status === 'contacted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                  inquiry.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                }`}>
                  {inquiry.status}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(inquiry.created_at).toLocaleDateString()}
                </div>
                {/* Scheduled Date Badge */}
                {inquiry.scheduled_date && (
                  <div className="flex items-center gap-1.5 text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full w-fit">
                    <Calendar className="h-3 w-3" />
                    {new Date(inquiry.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="flex-1 space-y-1">
                <h3 className="font-bold flex items-center gap-2">
                  {inquiry.name} 
                  <span className="font-normal text-xs text-muted-foreground">&lt;{inquiry.email}&gt;</span>
                </h3>
                <p className="text-sm font-medium">{inquiry.subject}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{inquiry.message}</p>
                
                {inquiry.zoom_link && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg w-fit">
                    <Video className="h-3 w-3" />
                    <span className="truncate max-w-[200px] font-mono">{inquiry.zoom_link}</span>
                    <a href={inquiry.zoom_link} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3 hover:scale-110 transition-transform" />
                    </a>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                {/* Set Date — all admins can use this */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5 text-xs h-8"
                  onClick={() => {
                    setDateInquiry(inquiry)
                    setSelectedDate(inquiry.scheduled_date || '')
                  }}
                >
                  <Calendar className="h-3.5 w-3.5" /> Date
                </Button>

                {/* Meeting — Super Admin only */}
                {isSuperAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5 text-xs h-8"
                    onClick={() => setSelectedInquiry(inquiry)}
                  >
                    <Video className="h-3.5 w-3.5" /> Meeting
                  </Button>
                )}
                
                <div className="flex gap-1 border-l pl-2 ml-2">
                  <button 
                    onClick={() => handleStatusUpdate(inquiry.id, 'approved')}
                    className="p-1.5 text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Approve"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(inquiry.id, 'rejected')}
                    className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Reject"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                  {/* Delete — Super Admin only */}
                  {isSuperAdmin && (
                    <button 
                      onClick={() => handleDelete(inquiry.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Set Date Modal ── */}
      {dateInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card rounded-3xl border shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Schedule Date</h2>
                <p className="text-xs text-muted-foreground">For: {dateInquiry.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Date</label>
                <Input 
                  type="date"
                  value={selectedDate}
                  onChange={e => {
                    const val = e.target.value
                    if (isDateUnavailable(val)) {
                      alert('This date is marked as unavailable. Please choose another date.')
                      return
                    }
                    setSelectedDate(val)
                  }}
                  min={getTodayStr()}
                  autoFocus
                />
              </div>

              {/* Show unavailable dates warning */}
              {unavailableDates.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Unavailable Dates:
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {unavailableDates.map(ud => (
                      <span key={ud.id} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-800/40 rounded-md text-[10px] font-mono">
                        {new Date(ud.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {ud.reason && ` — ${ud.reason}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate && isDateUnavailable(selectedDate) && (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5" />
                  This date is blocked. Choose a different date.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={handleCloseDateModal}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                  disabled={!selectedDate || isDateUnavailable(selectedDate)}
                  onClick={handleSetDate}
                >
                  Set Date
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Zoom Link Modal ── */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card rounded-3xl border shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Schedule Meeting</h2>
                <p className="text-xs text-muted-foreground">For: {selectedInquiry.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Zoom / Meeting Link</label>
                <Input 
                  placeholder="https://zoom.us/j/..." 
                  value={zoomLink}
                  onChange={e => setZoomLink(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="p-4 bg-muted/30 rounded-2xl text-[10px] text-muted-foreground flex gap-3">
                <Mail className="h-4 w-4 shrink-0" />
                <p>This link will be saved to the inquiry record. In a full system, this would trigger an email invitation to {selectedInquiry.email}.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700"
                  disabled={!zoomLink || sending}
                  onClick={handleSendZoom}
                >
                  {sending ? 'Saving...' : 'Send Link'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
