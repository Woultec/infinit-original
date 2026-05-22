import { useEffect, useState } from 'react'
import { getMemberAnnouncements, type Post } from '@services/postService'
import { Newspaper, Calendar, User } from 'lucide-react'

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function authorName(post: Post) {
  if (!post.profiles) return 'Infinity 8K'
  return `${post.profiles.first_name} ${post.profiles.last_name}`.trim()
}

export function MemberNews() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    getMemberAnnouncements()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">News Feed</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Updates and announcements from the team
        </p>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading news...</p>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
          <Newspaper className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">No announcements yet. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => {
            const expanded = expandedId === post.id
            const longBody = post.body.length > 280
            const displayDate = post.published_at || post.created_at

            return (
              <article
                key={post.id}
                className="rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {post.image_url && (
                  <div className="aspect-[2/1] w-full overflow-hidden border-b bg-muted">
                    <img
                      src={post.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="p-5 sm:p-6">
                  <h2 className="text-xl font-semibold mb-3 leading-snug">{post.title}</h2>

                  <p
                    className={`text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed ${
                      !expanded && longBody ? 'line-clamp-6' : ''
                    }`}
                  >
                    {post.body}
                  </p>

                  {longBody && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : post.id)}
                      className="mt-2 text-sm font-medium text-primary hover:underline"
                    >
                      {expanded ? 'Show less' : 'Read more'}
                    </button>
                  )}

                  <footer className="mt-5 pt-4 border-t flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {authorName(post)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(displayDate)}
                    </span>
                  </footer>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
