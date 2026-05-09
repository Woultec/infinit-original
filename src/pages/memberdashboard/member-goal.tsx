import { useEffect, useState } from 'react'
import { getGoals, type Goal } from '@services/goalService'
import { Target, Calendar, Star } from 'lucide-react'

export function MemberGoal() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApprovedGoals()
  }, [])

  async function fetchApprovedGoals() {
    try {
      const data = await getGoals()
      // Only show Active or Completed goals to members
      const approved = data.filter(g => g.status === 'Active' || g.status === 'Completed')
        .sort((a, b) => new Date(a.approved_at || 0).getTime() - new Date(b.approved_at || 0).getTime())
      setGoals(approved)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project Roadmap</h1>
        <p className="text-muted-foreground mt-1">Our strategic milestones and future objectives for Infinity 8K.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground italic">Loading our future...</div>
      ) : goals.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
          <Target className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">The roadmap is currently being updated. Stay tuned!</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 hidden md:block" />

          <div className="space-y-12">
            {goals.map((goal, index) => (
              <div key={goal.id} className={`relative flex flex-col md:flex-row items-center ${
                index % 2 === 0 ? 'md:flex-row-reverse' : ''
              }`}>
                {/* Milestone Dot */}
                <div className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full border-4 border-background bg-primary z-10 -translate-x-1/2 flex items-center justify-center shadow-sm">
                  <Star className="h-3 w-3 text-white fill-current" />
                </div>

                {/* Content Card */}
                <div className={`w-full md:w-[45%] ml-12 md:ml-0 p-6 rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        goal.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
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
                  <p className="text-sm text-muted-foreground leading-relaxed">{goal.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
