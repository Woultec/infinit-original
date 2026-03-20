import { ArrowRight, Target, Eye, Heart, Shield } from 'lucide-react'

const values = [
  { icon: Target, title: 'Mission', text: "To create a powerful and exclusive community of 8,000 investors and real estate enthusiasts who support each other in building lasting, generational wealth." },
  { icon: Eye,    title: 'Vision',  text: "To be the Philippines' most trusted and impactful private investment community — where every member thrives and grows together." },
  { icon: Heart,  title: 'Values',  text: 'Integrity, community, and excellence guide every decision we make. We believe wealth is best built together, with transparency and trust at the core.' },
]

const milestones = [
  { year: '2020', title: 'Founded',           desc: 'Infinity 8000 Corporation was established with a vision to democratize access to exclusive investment opportunities.' },
  { year: '2021', title: 'First 500 Members', desc: "Our founding members joined and helped shape the community's values and direction from the very beginning." },
  { year: '2022', title: 'First Major Deals', desc: 'Members collectively facilitated over 100 real estate transactions through the power of our network.' },
  { year: '2023', title: 'Community Expansion', desc: 'Crossed 1,000 verified members and launched our digital member portal for seamless community engagement.' },
  { year: '2024', title: 'Growing Strong',    desc: 'Over 1,200 active investors and 340+ deals facilitated. The community continues to grow toward our 8,000-member vision.' },
]

const team = [
  { name: 'Eduardo Reyes',    role: 'Chief Executive Officer', initial: 'E' },
  { name: 'Maria Cruz',       role: 'Chief Operations Officer', initial: 'M' },
  { name: 'Antonio Bautista', role: 'Head of Investments',      initial: 'A' },
  { name: 'Luz Santiago',     role: 'Community Director',       initial: 'L' },
]

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-20">

      {/* ── HERO BANNER ── */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full border border-white/10" />
          <div className="absolute bottom-0 left-10 w-64 h-64 rounded-full border border-white/10" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block text-[#f5c518] font-semibold text-sm tracking-widest uppercase mb-4">About Us</span>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            More Than a Company.<br />
            <span className="text-[#f5c518]">A Movement.</span>
          </h2>
          <p className="text-white/75 text-lg max-w-2xl mx-auto leading-relaxed">
            Infinity 8000 Corporation was built on the belief that real, lasting wealth
            is created through community, trust, and exclusive access — not by going it alone.
          </p>
        </div>
      </div>

      {/* ── MISSION / VISION / VALUES ── */}
      <div className="bg-[#f4faf0] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-[#4aa027] font-semibold text-sm tracking-widest uppercase mb-3">Who We Are</span>
            <h3 className="text-4xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Guided by Purpose
            </h3>
            <div className="w-16 h-1 bg-[#f5c518] rounded-full mx-auto mt-5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title}
                className="group bg-white rounded-2xl p-8 border border-[#c8e0be] hover:border-[#4aa027] hover:shadow-lg hover:shadow-[#4aa027]/10 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-[#4aa027]/10 group-hover:bg-[#4aa027] flex items-center justify-center mb-5 transition-colors duration-300">
                  <Icon className="w-7 h-7 text-[#4aa027] group-hover:text-white transition-colors duration-300" />
                </div>
                <h4 className="text-xl font-bold text-[#1a1a1a] mb-3">{title}</h4>
                <p className="text-[#4a6040] leading-relaxed text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WHY 8000 ── */}
      <div className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-[#4aa027] font-semibold text-sm tracking-widest uppercase mb-4">Why 8,000?</span>
              <h3 className="text-4xl font-bold text-[#1a1a1a] mb-6 leading-tight"
                style={{ fontFamily: 'Playfair Display, serif' }}>
                The Power of a<br />
                <span className="text-[#4aa027]">Curated Circle</span>
              </h3>
              <div className="space-y-4 text-[#4a6040] leading-relaxed text-sm">
                <p>Large enough to create a powerful network with diverse expertise and resources — small enough to remain exclusive, trusted, and personal.</p>
                <p>In numerology, the number 8 represents abundance, success, and infinite possibilities. Combined with 000, it symbolizes limitless potential waiting to be unlocked.</p>
                <p>Every slot in our community represents a human connection — an investor, a dreamer, a builder. When all 8,000 are united, the possibilities are truly infinite.</p>
              </div>
              <a href="#contact"
                className="group inline-flex items-center gap-3 bg-[#4aa027] hover:bg-[#2d7a0f] text-white font-bold text-sm px-7 py-3.5 rounded-xl mt-8 transition-all duration-200 shadow-md hover:shadow-lg">
                Claim Your Spot <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            {/* Circular badge */}
            <div className="flex items-center justify-center">
              <div className="relative w-72 h-72">
                <div className="absolute inset-0 rounded-full bg-brand-gradient shadow-2xl shadow-[#4aa027]/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-[#f5c518]"
                      style={{ fontFamily: 'Playfair Display, serif' }}>8K</div>
                    <div className="text-white/90 text-sm font-medium tracking-widest uppercase mt-1">Members</div>
                    <div className="text-white/60 text-xs mt-1">Maximum Capacity</div>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-[#4aa027]/30 scale-110" />
                <div className="absolute inset-0 rounded-full border border-[#4aa027]/15 scale-125" />
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} className="absolute w-3 h-3 rounded-full bg-[#f5c518] opacity-70"
                    style={{
                      top: '50%', left: '50%',
                      transform: `rotate(${i * 60}deg) translateY(-155px) translateX(-6px)`,
                    }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TIMELINE ── */}
      <div className="bg-[#f4faf0] py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-[#4aa027] font-semibold text-sm tracking-widest uppercase mb-3">Our Journey</span>
            <h3 className="text-4xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Built Year by Year
            </h3>
            <div className="w-16 h-1 bg-[#f5c518] rounded-full mx-auto mt-5" />
          </div>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-[#c8e0be] md:-translate-x-px" />
            <div className="space-y-10">
              {milestones.map(({ year, title, desc }, i) => (
                <div key={year} className={`relative flex items-start gap-6 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#4aa027] border-4 border-[#f4faf0] z-10 mt-1.5" />
                  <div className="hidden md:block flex-1" />
                  <div className="flex-1 ml-12 md:ml-0 bg-white rounded-2xl p-6 border border-[#c8e0be] hover:border-[#4aa027] transition-colors duration-200">
                    <span className="inline-block bg-[#4aa027] text-white text-xs font-bold px-3 py-1 rounded-full mb-2">{year}</span>
                    <h4 className="font-bold text-[#1a1a1a] text-base mb-1">{title}</h4>
                    <p className="text-[#4a6040] text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TEAM ── */}
      <div className="bg-white py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-[#4aa027] font-semibold text-sm tracking-widest uppercase mb-3">Leadership</span>
            <h3 className="text-4xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Playfair Display, serif' }}>
              The People Behind the Vision
            </h3>
            <div className="w-16 h-1 bg-[#f5c518] rounded-full mx-auto mt-5" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map(({ name, role, initial }) => (
              <div key={name} className="text-center group">
                <div className="w-24 h-24 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-4 shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                  <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>{initial}</span>
                </div>
                <div className="font-bold text-[#1a1a1a] text-sm">{name}</div>
                <div className="text-[#4a6040] text-xs mt-0.5">{role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .bg-brand-gradient {
          background: linear-gradient(135deg, #2d7a0f 0%, #4aa027 55%, #c9a010 100%);
        }
      `}</style>
    </section>
  )
}
