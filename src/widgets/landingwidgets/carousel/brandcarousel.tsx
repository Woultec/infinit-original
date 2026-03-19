/** Brand logo carousel — replace logos array with real brand data */
const logos = ['Brand A', 'Brand B', 'Brand C', 'Brand D', 'Brand E']

export function BrandCarousel() {
  return (
    <div className="overflow-hidden py-8">
      <div className="flex animate-marquee gap-16">
        {[...logos, ...logos].map((logo, i) => (
          <span key={i} className="whitespace-nowrap text-xl font-bold text-muted-foreground/40">
            {logo}
          </span>
        ))}
      </div>
    </div>
  )
}
