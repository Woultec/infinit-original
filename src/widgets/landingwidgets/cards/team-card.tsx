interface TeamCardProps {
  name: string
  role: string
  image?: string
}

export function TeamCard({ name, role, image }: TeamCardProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
      <div className="h-20 w-20 overflow-hidden rounded-full bg-muted">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
            {name.charAt(0)}
          </div>
        )}
      </div>
      <div>
        <p className="font-semibold">{name}</p>
        <p className="text-sm text-muted-foreground">{role}</p>
      </div>
    </div>
  )
}
