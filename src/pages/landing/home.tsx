import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, TrendingUp, Shield, Star, ChevronDown, Users } from 'lucide-react'

function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const p = Math.min((ts - startTime) / duration, 1)
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

const features = [
  { icon: Building2, title: 'Real Estate Community', desc: 'Access exclusive property deals, investment opportunities, and market insights available only to our 8,000 members.' },
  { icon: TrendingUp, title: 'Growth-Focused Network', desc: 'Connect with fellow investors, share strategies, and grow your portfolio within a curated community of like-minded individuals.' },
  { icon: Shield, title: 'Verified & Secure', desc: 'Every member is vetted. Your investments and personal information are protected by enterprise-grade security.' },
  { icon: Star, title: 'Premium Benefits', desc: 'Enjoy priority access to new listings, member-exclusive events, and dedicated support from our corporate team.' },
]

const testimonials = [
  { name: 'Ricardo M.', role: 'Real Estate Investor', text: 'Infinity 8000 opened doors I never knew existed. The community alone is worth every peso.' },
  { name: 'Maria Santos', role: 'Business Owner', text: "The network here is incredible. I've closed three deals through connections I made as a member." },
  { name: 'Jose Reyes', role: 'Property Developer', text: "A truly exclusive community. The quality of members and opportunities here is unmatched." },
]

export function HomeSection() {
  const statsRef = useRef<HTMLDivElement>(null)
  const [statsVisible, setStatsVisible] = useState(false)
  const members   = useCounter(8000, 2500, statsVisible)
  const investors = useCounter(1240, 2000, statsVisible)
  const deals     = useCounter(340,  1800, statsVisible)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsVisible(true) },
      { threshold: 0.3 }
    )
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* ── HERO ── */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full border border-white/10" />
          <div className="absolute -top-20 -right-20 w-[480px] h-[480px] rounded-full border border-white/10" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full border border-white/10" />
          <div className="absolute top-20 right-1/4 w-3 h-3 rounded-full bg-[#f5c518] opacity-60" />
          <div className="absolute bottom-40 left-1/4 w-2 h-2 rounded-full bg-[#f5c518] opacity-40" />
          <div className="absolute top-1/2 right-16 w-4 h-4 rounded-full bg-[#f5c518] opacity-30" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8"
            style={{ animation: 'fadeSlideDown 0.6s ease both' }}>
            <span className="w-2 h-2 rounded-full bg-[#f5c518] animate-pulse" />
            <span className="text-white/90 text-sm font-medium tracking-wide">Limited to 8,000 Members Worldwide</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6"
            style={{ animation: 'fadeSlideDown 0.6s ease 0.1s both', fontFamily: 'Playfair Display, serif' }}>
            Build Wealth.<br />
            <span className="text-[#f5c518]">Join the Circle.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ animation: 'fadeSlideDown 0.6s ease 0.2s both' }}>
            Infinity 8000 Corporation is an exclusive real estate and investment community —
            limited to 8,000 visionary members who are serious about building lasting wealth.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ animation: 'fadeSlideDown 0.6s ease 0.3s both' }}>
            <a href="#contact"
              className="group inline-flex items-center gap-3 bg-[#f5c518] hover:bg-[#e0b010] text-[#1a1a1a] font-bold text-base px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:-translate-y-0.5">
              Apply for Membership <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#about"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium text-base px-8 py-4 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-200">
              Learn More
            </a>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
            <span className="text-white text-xs tracking-widest uppercase">Scroll</span>
            <ChevronDown className="w-4 h-4 text-white animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} className="bg-[#1a1a1a] py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-3 divide-x divide-white/10">
            {[
              { value: members,   suffix: '',  label: 'Maximum Members',  note: 'Exclusive slots available' },
              { value: investors, suffix: '+', label: 'Active Investors',  note: 'Growing every month' },
              { value: deals,     suffix: '+', label: 'Deals Facilitated', note: 'And counting' },
            ].map(({ value, suffix, label, note }) => (
              <div key={label} className="text-center px-4 md:px-8 py-4">
                <div className="text-3xl md:text-5xl font-bold text-[#f5c518]"
                  style={{ fontFamily: 'Playfair Display, serif' }}>
                  {value.toLocaleString()}{suffix}
                </div>
                <div className="text-white font-semibold mt-1 text-sm md:text-base">{label}</div>
                <div className="text-white/40 text-xs mt-0.5 hidden md:block">{note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-[#f4faf0] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-[#4aa027] font-semibold text-sm tracking-widest uppercase mb-3">Why Join Us</span>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a]"
              style={{ fontFamily: 'Playfair Display, serif' }}>
              Everything You Need<br />
              <span className="text-[#4aa027]">to Grow Your Wealth</span>
            </h2>
            <div className="w-16 h-1 bg-[#f5c518] rounded-full mx-auto mt-6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="group bg-white rounded-2xl p-8 border border-[#c8e0be] hover:border-[#4aa027] hover:shadow-xl hover:shadow-[#4aa027]/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-xl bg-[#4aa027]/10 group-hover:bg-[#4aa027] flex items-center justify-center mb-5 transition-colors duration-300">
                  <Icon className="w-7 h-7 text-[#4aa027] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">{title}</h3>
                <p className="text-[#4a6040] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-[#4aa027] font-semibold text-sm tracking-widest uppercase mb-3">Member Stories</span>
            <h2 className="text-4xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Hear from Our Community
            </h2>
            <div className="w-16 h-1 bg-[#f5c518] rounded-full mx-auto mt-5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text }) => (
              <div key={name} className="bg-[#f4faf0] rounded-2xl p-8 border border-[#c8e0be] hover:border-[#4aa027] hover:shadow-lg transition-all duration-300">
                <div className="text-[#f5c518] text-4xl font-serif leading-none mb-4">"</div>
                <p className="text-[#4a6040] leading-relaxed mb-6 italic text-sm">{text}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#c8e0be]">
                  <div className="w-10 h-10 rounded-full bg-[#4aa027] flex items-center justify-center text-white font-bold text-sm">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-[#1a1a1a] text-sm">{name}</div>
                    <div className="text-[#4a6040] text-xs">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
     {/* ── CTA BAND ── */}
<section className="relative py-24 overflow-hidden bg-[#1a1a1a]">
  {/* Subtle grid pattern */}
  <div className="absolute inset-0 opacity-10 pointer-events-none"
    style={{
      backgroundImage: 'linear-gradient(#4aa027 1px, transparent 1px), linear-gradient(90deg, #4aa027 1px, transparent 1px)',
      backgroundSize: '60px 60px',
    }} />

  {/* Glow blobs */}
  <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-[#4aa027]/20 blur-3xl pointer-events-none" />
  <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-[#f5c518]/10 blur-3xl pointer-events-none" />

  <div className="relative z-10 max-w-6xl mx-auto px-6">
    <div className="flex flex-col lg:flex-row items-center justify-between gap-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm px-10 py-14">

      {/* Left: text */}
      <div className="flex-1 text-center lg:text-left">
        <div className="inline-flex items-center gap-2 bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-[#f5c518] animate-pulse" />
          <span className="text-[#f5c518] text-xs font-bold tracking-widest uppercase">Membership Slots Filling Fast</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4"
          style={{ fontFamily: 'Playfair Display, serif' }}>
          Spots Are Limited.<br />
          <span className="text-[#f5c518]">Don't Miss Your Chance.</span>
        </h2>
        <p className="text-white/60 text-base leading-relaxed max-w-md mx-auto lg:mx-0">
          Once all 8,000 membership slots are filled, new applications close permanently.
          Secure your place in the Philippines' most exclusive investment community.
        </p>
      </div>

      {/* Vertical divider */}
      <div className="hidden lg:block w-px h-40 bg-white/10 flex-shrink-0" />

      {/* Right: progress + CTA */}
      <div className="flex-shrink-0 flex flex-col items-center gap-6 w-full lg:w-72">
        <div className="w-full">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-white/50 font-medium">Slots Taken</span>
            <span className="text-[#f5c518] font-bold">1,240 / 8,000</span>
          </div>
          <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#4aa027] to-[#f5c518] rounded-full"
              style={{ width: '15.5%', transition: 'width 1.5s ease' }} />
          </div>
          <p className="text-white/30 text-xs mt-1.5 text-right">6,760 slots remaining</p>
        </div>

        <a href="#contact"
          className="group w-full inline-flex items-center justify-center gap-3 bg-[#f5c518] hover:bg-[#e0b010] text-[#1a1a1a] font-bold text-base px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-[#f5c518]/20 hover:-translate-y-0.5">
          Apply for Membership
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
        <p className="text-white/30 text-xs text-center">
          Free to inquire · No commitment required
        </p>
      </div>

    </div>
  </div>
</section>

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .bg-brand-gradient {
          background: linear-gradient(135deg, #2d7a0f 0%, #4aa027 55%, #c9a010 100%);
        }
      `}</style>
    </>
  )
}
