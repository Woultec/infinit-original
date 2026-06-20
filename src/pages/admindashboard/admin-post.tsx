import { useEffect, useState } from 'react'
import { useAuth } from '@hooks/useAuth'
import { SUPER_ADMIN_EMAIL } from '@lib/constants'
import {
  getPosts, addPost, updatePost, deletePost, uploadPostImage, type Post
} from '@services/postService'
import { 
  Plus, CheckCircle2, XCircle, 
  FileText, Users, Trash2,
  Upload, X
} from 'lucide-react'
import { useRef } from 'react'
import { Input } from '@components/ui/Input'
import { Button } from '@components/ui/Button'

export function AdminPost() {
  const { user } = useAuth()
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    title: '',
    body: '',
    audience: 'all' as Post['audience'],
    status: 'Pending' as Post['status']
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const data = await getPosts()
      setPosts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)

    try {
      let image_url = undefined
      if (imageFile) {
        image_url = await uploadPostImage(imageFile)
      }

      const newPost = await addPost({
        ...form,
        created_by: user.id,
        status: isSuperAdmin ? 'Active' : 'Pending',
        image_url,
        published_at: isSuperAdmin ? new Date().toISOString() : undefined
      })
      setPosts(prev => [newPost, ...prev])
      handleCloseModal()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setSaving(false)
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  function handleCloseModal() {
    setShowAddModal(false)
    setImageFile(null)
    setImagePreview(null)
    setForm({ title: '', body: '', audience: 'all', status: 'Pending' })
  }

  async function handleStatusUpdate(id: string, status: Post['status']) {
    try {
      const updates: Partial<Post> = { 
        status, 
        published_at: status === 'Active' ? new Date().toISOString() : undefined 
      }
      const updated = await updatePost(id, updates)
      setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    try {
      await deletePost(id)
      setPosts(prev => prev.filter(p => p.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete post')
    }
  }

  const filtered = posts.filter(p => {
    if (activeTab === 'pending') return p.status === 'Pending'
    if (activeTab === 'active') return p.status === 'Active'
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">Create and manage community posts and news.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Post
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {[
          { id: 'all', label: 'All Posts' },
          { id: 'pending', label: 'Pending Review' },
          { id: 'active', label: 'Live' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.id === 'pending' && posts.filter(p => p.status === 'Pending').length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {posts.filter(p => p.status === 'Pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading posts...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-2xl">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No posts found in this category.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(post => (
            <div key={post.id} className="group flex flex-col rounded-2xl border bg-card hover:shadow-md transition-all overflow-hidden">
              {/* Post Image */}
              {post.image_url && (
                <div className="h-48 w-full overflow-hidden border-b">
                  <img 
                    src={post.image_url} 
                    alt={post.title} 
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}

              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  post.status === 'Active' ? 'bg-green-100 text-green-700' :
                  post.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {post.status}
                </span>
                <div className="flex gap-1">
                   <span className="px-2 py-0.5 bg-muted rounded-full text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> {post.audience}
                   </span>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-2 line-clamp-1">{post.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">{post.body}</p>

              {post.profiles && (
                <div className="mb-4 p-2.5 bg-muted/50 rounded-xl border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Author</p>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {post.profiles.first_name[0]}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold truncate">{post.profiles.first_name} {post.profiles.last_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{post.profiles.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t flex items-center justify-between">
                <div className="flex gap-2 w-full">
                  {isSuperAdmin && post.status === 'Pending' ? (
                    <>
                      <button 
                        onClick={() => handleStatusUpdate(post.id, 'Active')}
                        className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(post.id, 'Rejected')}
                        className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="flex-1 border text-xs font-medium py-2 rounded-lg hover:bg-muted transition-colors">
                        Edit Post
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="p-2 border rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

      {/* Create Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-card rounded-2xl border shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">Create New Announcement</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Post Image (Optional)</label>
                <div 
                  onClick={() => fileRef.current?.click()}
                  className="relative group cursor-pointer aspect-video rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors overflow-hidden flex flex-col items-center justify-center bg-muted/30"
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs font-bold">Change Image</p>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-xs text-muted-foreground">Click to upload image</p>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileRef} 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input 
                  required 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="Enter announcement title" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <textarea 
                  required
                  value={form.body}
                  onChange={e => setForm({...form, body: e.target.value})}
                  className="w-full min-h-[150px] rounded-xl border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="What's the news?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Audience</label>
                  <select 
                    value={form.audience}
                    onChange={e => setForm({...form, audience: e.target.value as any})}
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none"
                  >
                    <option value="all">Everyone</option>
                    <option value="members">Members Only</option>
                    <option value="admins">Admins Only</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Initial Status</label>
                  <div className={`h-10 rounded-lg border bg-muted/50 flex items-center px-3 text-sm font-bold ${
                    isSuperAdmin ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {isSuperAdmin ? 'Active (Direct)' : 'Pending Review'}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? 'Creating...' : 'Post Announcement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
