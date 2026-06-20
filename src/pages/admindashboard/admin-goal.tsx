import { useEffect, useState } from 'react'
import { useAuth } from '@hooks/useAuth'
import { SUPER_ADMIN_EMAIL } from '@lib/constants'
import {
  getGoals, addGoal, updateGoal, deleteGoal, type Goal
} from '@services/goalService'
import { 
  Plus, CheckCircle2, XCircle, Clock, 
  Target, Calendar, Trash2,
  Star, Shield
} from 'lucide-react'
import { Input } from '@components/ui/Input'
import { Button } from '@components/ui/Button'

export function AdminGoal() {
  const { user } = useAuth()
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'roadmap' | 'pending'>('roadmap')
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    milestone_date: '',
    priority: 'Medium' as Goal['priority'],
    status: 'Pending' as Goal['status']
  })

  useEffect(() => {
    fetchGoals()
  }, [])

  async function fetchGoals() {
    try {
      const data = await getGoals()
      setGoals(data)
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
      const newPost = {
        ...form,
        created_by: user.id,
        status: isSuperAdmin ? 'Active' as const : 'Pending' as const,
        approved_at: isSuperAdmin ? new Date().toISOString() : undefined
      }
      const newGoal = await addGoal(newPost)
      
      setGoals(prev => {
        const updated = [...prev, newGoal]
        // Sort by approval date if active, otherwise by creation date
        return updated.sort((a, b) => {
          if (a.status === 'Active' && b.status === 'Active') {
            return new Date(a.approved_at || 0).getTime() - new Date(b.approved_at || 0).getTime()
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
      })
      setShowAddModal(false)
      setForm({ title: '', description: '', milestone_date: '', priority: 'Medium', status: 'Pending' })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save goal')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusUpdate(id: string, status: Goal['status']) {
    try {
      const updates: Partial<Goal> = { 
        status,
        approved_at: status === 'Active' ? new Date().toISOString() : undefined
      }
      const updated = await updateGoal(id, updates)
      setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updated } : g))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this goal?')) return
    try {
      await deleteGoal(id)
      setGoals(prev => prev.filter(g => g.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete goal')
    }
  }

  const filteredGoals = goals.filter(g => {
    if (activeTab === 'roadmap') return g.status === 'Active' || g.status === 'Completed'
    if (activeTab === 'pending') {
      const isPendingOrRejected = g.status === 'Pending' || g.status === 'Rejected'
      if (!isPendingOrRejected) return false
      
      // Super Admin sees all pending/rejected
      if (isSuperAdmin) return true
      
      // Regular Admin only sees their own pending/rejected
      return g.created_by === user?.id
    }
    return true
  }).sort((a, b) => {
    if (activeTab === 'roadmap') {
      // Sort by approval date (first approved = first in line)
      return new Date(a.approved_at || 0).getTime() - new Date(b.approved_at || 0).getTime()
    }
    // For pending, sort by submission date
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roadmap Goals</h1>
          <p className="text-muted-foreground mt-1">Strategic milestones and future objectives for Infinity 8K.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Propose Goal
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {[
          { id: 'roadmap', label: 'Main Roadmap' },
          { id: 'pending', label: 'Proposals & Pending' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-[2px] flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.id === 'pending' && goals.filter(g => g.status === 'Pending').length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {goals.filter(g => g.status === 'Pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading roadmap...</div>
      ) : filteredGoals.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
          <Target className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No goals found in this category.</p>
        </div>
      ) : activeTab === 'roadmap' ? (
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 hidden md:block" />

          <div className="space-y-12">
            {filteredGoals.map((goal, index) => (
              <div key={goal.id} className={`relative flex flex-col md:flex-row items-center ${
                index % 2 === 0 ? 'md:flex-row-reverse' : ''
              }`}>
                {/* Milestone Dot */}
                <div className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full border-4 border-background bg-primary z-10 -translate-x-1/2 flex items-center justify-center shadow-sm">
                  <Star className="h-3 w-3 text-white fill-current" />
                </div>

                {/* Content Card */}
                <div className={`w-full md:w-[45%] ml-12 md:ml-0 p-6 rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md ${
                  goal.status === 'Pending' ? 'border-amber-200 bg-amber-50/30' : ''
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        goal.status === 'Active' ? 'bg-green-100 text-green-700' :
                        goal.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                        goal.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {goal.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        goal.priority === 'High' ? 'bg-red-100 text-red-600' :
                        goal.priority === 'Medium' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {goal.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(goal.milestone_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{goal.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{goal.description}</p>

                  <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground italic">
                      <Clock className="h-3 w-3" />
                      Submitted: {new Date(goal.created_at).toLocaleDateString()}
                    </div>
                    {goal.approved_at && (
                      <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Approved: {new Date(goal.approved_at).toLocaleDateString()}
                      </div>
                    )}
                    {goal.profiles && (
                      <div className="text-[10px] text-muted-foreground italic">
                        Proposed by: {goal.profiles.first_name} {goal.profiles.last_name}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 border-t pt-4">
                    {isSuperAdmin && goal.status === 'Pending' ? (
                      <>
                        <button 
                          onClick={() => handleStatusUpdate(goal.id, 'Active')}
                          className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(goal.id, 'Rejected')}
                          className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </>
                    ) : (
                      <>
                        {isSuperAdmin && goal.status === 'Active' && (
                          <button 
                            onClick={() => handleStatusUpdate(goal.id, 'Completed')}
                            className="flex-1 border-blue-200 text-blue-600 text-xs font-bold py-2 rounded-lg hover:bg-blue-50 transition-colors border"
                          >
                            Mark Completed
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button 
                            onClick={() => handleDelete(goal.id)}
                            className="p-2 border rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Pending List View (Simple Grid) */
        <div className="grid gap-6 md:grid-cols-2">
           {filteredGoals.map((goal) => (
             <div key={goal.id} className="p-6 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        goal.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {goal.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(goal.milestone_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{goal.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{goal.description}</p>

                  <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground italic">
                      <Clock className="h-3 w-3" />
                      Submitted: {new Date(goal.created_at).toLocaleDateString()}
                    </div>
                    {goal.profiles && (
                      <div className="text-[10px] text-muted-foreground italic">
                        Proposed by: {goal.profiles.first_name} {goal.profiles.last_name}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 border-t pt-4">
                    {isSuperAdmin && goal.status === 'Pending' ? (
                      <>
                        <button 
                          onClick={() => handleStatusUpdate(goal.id, 'Active')}
                          className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(goal.id, 'Rejected')}
                          className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleDelete(goal.id)}
                        className="w-full py-2 border rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-xs font-bold"
                      >
                        Delete Proposal
                      </button>
                    )}
                  </div>
             </div>
           ))}
        </div>
      )}

      {/* Create Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card rounded-3xl border shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold">New Roadmap Goal</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Goal Title</label>
                <Input 
                  required 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="e.g. Launch Mobile App" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  required
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full min-h-[120px] rounded-xl border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Describe the objective and impact..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Date</label>
                  <Input 
                    type="date"
                    required
                    value={form.milestone_date}
                    onChange={e => setForm({...form, milestone_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select 
                    value={form.priority}
                    onChange={e => setForm({...form, priority: e.target.value as any})}
                    className="w-full h-10 rounded-xl border bg-background px-3 text-sm outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-2xl border border-dashed flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div className="text-xs">
                  <p className="font-bold text-muted-foreground uppercase">Submission Rule</p>
                  <p className="text-muted-foreground">
                    {isSuperAdmin ? 'Directly publishing as Super Admin.' : 'Will be sent to Super Admin for approval.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 rounded-xl" disabled={saving}>
                  {saving ? 'Saving...' : 'Submit Goal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )

  function handleCloseModal() {
    setShowAddModal(false)
    setForm({ title: '', description: '', milestone_date: '', priority: 'Medium', status: 'Pending' })
  }
}
