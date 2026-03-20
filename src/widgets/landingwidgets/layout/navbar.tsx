import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Home',    href: '#home'    },
  { label: 'About',   href: '#about'   },
  { label: 'Contact', href: '#contact' },
]

export function Navbar() {
  const [scrolled, setScrolled]         = useState(false)
  const [menuOpen, setMenuOpen]         = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Active section tracker via IntersectionObserver
  useEffect(() => {
    const ids = ['home', 'about', 'contact']
    const observers = ids.map(id => {
      const el = document.getElementById(id)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { threshold: 0.25, rootMargin: '-80px 0px 0px 0px' }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const id = href.replace('#', '')
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#1a1a1a]/95 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-transparent'
    }`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo — clicks scroll back to top */}
        <a href="#home" onClick={e => scrollTo(e, '#home')} className="flex items-center gap-3 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-white font-bold text-base" style={{ fontFamily: 'Playfair Display, serif' }}>∞</span>
          </div>
          <span className="font-bold text-white text-sm tracking-tight leading-tight hidden sm:block">
            Infinity<br /><span className="text-[#f5c518]">8000 Corp.</span>
          </span>
        </a>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive = activeSection === href.replace('#', '')
            return (
              <a key={href} href={href} onClick={e => scrollTo(e, href)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer select-none ${
                  isActive ? 'text-[#f5c518]' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}>
                {label}
                {isActive && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#f5c518] rounded-full" />
                )}
              </a>
            )
          })}
        </nav>

        {/* Member login — only visible CTA */}
        <div className="hidden md:flex">
          <Link to="/member/login"
            className="inline-flex items-center gap-2 bg-[#f5c518] hover:bg-[#e0b010] text-[#1a1a1a] font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:-translate-y-px">
            Member Login
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-[#1a1a1a]/98 backdrop-blur-md border-t border-white/10 px-6 py-4 space-y-1">
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive = activeSection === href.replace('#', '')
            return (
              <a key={href} href={href} onClick={e => scrollTo(e, href)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  isActive ? 'text-[#f5c518] bg-white/10' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}>
                {label}
              </a>
            )
          })}
          <div className="pt-3 border-t border-white/10">
            <Link to="/member/login" onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-bold bg-[#f5c518] text-[#1a1a1a] text-center">
              Member Login
            </Link>
          </div>
        </div>
      )}

      <style>{`
        .bg-brand-gradient {
          background: linear-gradient(135deg, #2d7a0f 0%, #4aa027 55%, #c9a010 100%);
        }
      `}</style>
    </header>
  )
}
