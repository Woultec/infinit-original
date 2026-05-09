import { useEffect, useState } from 'react'
import { getInquiries, updateInquiryStatus, sendZoomLink, deleteInquiry, type Inquiry } from '@services/inquiryService'
import { 
  MessageSquare, Video, Mail, Calendar, 
  CheckCircle2, XCircle, Trash2, ExternalLink,
  Search, Filter, Clock, User
} from 'lucide-react'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'

export function AdminInquiry() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Zoom Modal State
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [zoomLink, setZoomLink] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchInquiries()
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

  async function handleStatusUpdate(id: string, status: Inquiry['status']) {
    try {
      const updated = await updateInquiryStatus(id, status)
      setInquiries(prev => prev.map(i => i.id === id ? updated : i))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSendZoom() {
    if (!selectedInquiry || !zoomLink) return
    setSending(true)
    
    try {
      // 1. Update the database
      const updated = await sendZoomLink(selectedInquiry.id, zoomLink)
      setInquiries(prev => prev.map(i => i.id === selectedInquiry.id ? updated : i))
      
      // 2. Call the Edge Function to send the Zoom link via email
      const response = await fetch('https://orvbwekhrjvnziwtlyzc.supabase.co/functions/v1/send-meeting-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: selectedInquiry.email,
          name: selectedInquiry.name,
          subject: selectedInquiry.subject,
          zoomLink: zoomLink
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to send automated email.')
      }

      alert('Success! Meeting link saved and invitation email sent automatically via your Gmail.')
      handleCloseModal()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Saved to database, but automated email failed. Check your SMTP settings.')
      handleCloseModal()
    } finally {
      setSending(false)
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

  function handleCloseModal() {
    setSelectedInquiry(null)
    setZoomLink('')
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
                  inquiry.status === 'approved' ? 'bg-green-100 text-green-700' :
                  inquiry.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                  inquiry.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {inquiry.status}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(inquiry.created_at).toLocaleDateString()}
                </div>
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
                  <div className="mt-2 flex items-center gap-2 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-lg w-fit">
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5 text-xs h-8"
                  onClick={() => setSelectedInquiry(inquiry)}
                >
                  <Video className="h-3.5 w-3.5" /> Meeting
                </Button>
                
                <div className="flex gap-1 border-l pl-2 ml-2">
                  <button 
                    onClick={() => handleStatusUpdate(inquiry.id, 'approved')}
                    className="p-1.5 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Approve"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(inquiry.id, 'rejected')}
                    className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Reject"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(inquiry.id)}
                    className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zoom Link Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card rounded-3xl border shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
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
