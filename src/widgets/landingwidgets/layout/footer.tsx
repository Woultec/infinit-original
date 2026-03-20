import { Link } from 'react-router-dom'
import { APP_NAME, NAV_LINKS } from '@lib/constants'
import { Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center shadow-lg">
                <span className="text-white font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>∞</span>
              </div>
              <span className="font-bold text-lg">{APP_NAME}</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              An exclusive investment and real estate community — limited to 8,000 visionary members worldwide.
            </p>
            <div className="mt-6 space-y-2">
              {[
                { icon: MapPin, text: 'Quezon City, Metro Manila, Philippines' },
                { icon: Mail, text: 'info@infinity8000.com' },
                { icon: Phone, text: '+63 (2) 8XXX-XXXX' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-white/50 text-sm">
                  <Icon className="w-4 h-4 text-[#4aa027] flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-5">Company</h4>
            <ul className="space-y-3">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link to={href} className="text-white/60 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-5">Portals</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/member/login" className="text-white/60 hover:text-[#f5c518] text-sm transition-colors">
                  Member Portal
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-white/60 hover:text-white text-sm transition-colors">
                  Admin Portal
                </Link>
              </li>
              <li>
                <Link to="/contacts" className="text-white/60 hover:text-white text-sm transition-colors">
                  Join the Community
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4aa027] animate-pulse" />
            <span className="text-white/30 text-xs">Membership applications open</span>
          </div>
        </div>
      </div>

      <style>{`
        .bg-brand-gradient {
          background: linear-gradient(135deg, #2d7a0f 0%, #4aa027 55%, #c9a010 100%);
        }
      `}</style>
    </footer>
  )
}
