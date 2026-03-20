import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, ArrowRight, CheckCircle } from 'lucide-react'
import { contactSchema, type ContactFormData } from '@lib/validations'
import { supabase } from '@services/supabase'

const contactInfo = [
  { icon: MapPin, label: 'Office Address', value: 'Quezon City, Metro Manila, Philippines' },
  { icon: Phone,  label: 'Phone',          value: '+63 (2) 8XXX-XXXX' },
  { icon: Mail,   label: 'Email',           value: 'info@infinity8000.com' },
  { icon: Clock,  label: 'Office Hours',   value: 'Mon–Fri, 9:00 AM – 6:00 PM PHT' },
]

const faqs = [
  { q: 'How do I become a member?',           a: 'Submit an inquiry through this page. Our team will review your application and contact you within 24–48 hours to discuss next steps.' },
  { q: 'Is there a membership fee?',           a: 'Yes. Membership fees vary depending on the tier you apply for. Details will be shared during your consultation with our team.' },
  { q: 'What happens after I submit an inquiry?', a: "You'll receive a confirmation email and one of our representatives will reach out to schedule a call or meeting with you." },
  { q: 'Can I refer someone to the community?', a: 'Absolutely! Existing members can refer qualified individuals. Ask your member representative about our referral program.' },
]

export function ContactSection() {
  const [form, setForm]     = useState<ContactFormData>({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState<Partial<ContactFormData>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = contactSchema.safeParse(form)
    if (!result.success) {
      const fe: Partial<ContactFormData> = {}
      result.error.errors.forEach(err => { fe[err.path[0] as keyof ContactFormData] = err.message })
      setErrors(fe)
      return
    }
    setLoading(true)
    try {
      await supabase.from('contacts').insert([result.data])
      setSuccess(true)
    } catch (_) {
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" className="scroll-mt-20">

      {/* ── HERO BANNER ── */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-white/10" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full border border-white/10 -translate-x-1/3" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <span className="inline-block text-[#f5c518] font-semibold text-sm tracking-widest uppercase mb-4">Get in Touch</span>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-5"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            Let's Start Your<br />
            <span className="text-[#f5c518]">Journey Together</span>
          </h2>
          <p className="text-white/75 text-lg">
            Have questions about membership or investment opportunities?
            Our team is ready to guide you every step of the way.
          </p>
        </div>
      </div>

      {/* ── FORM + INFO ── */}
      <div className="bg-[#f4faf0] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-5">
              <div>
                <h3 className="text-2xl font-bold text-[#1a1a1a] mb-2"
                  style={{ fontFamily: 'Playfair Display, serif' }}>Contact Information</h3>
                <p className="text-[#4a6040] text-sm leading-relaxed">
                  Reach us directly or fill out the form and we'll get back to you within one business day.
                </p>
              </div>
              {contactInfo.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4 bg-white rounded-xl p-4 border border-[#c8e0be]">
                  <div className="w-10 h-10 rounded-lg bg-[#4aa027]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#4aa027]" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#4a6040] uppercase tracking-wide mb-0.5">{label}</div>
                    <div className="text-[#1a1a1a] font-medium text-sm">{value}</div>
                  </div>
                </div>
              ))}
              <div className="bg-[#4aa027] rounded-xl p-5 text-white">
                <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>24 hrs</div>
                <div className="text-white/90 font-medium text-sm">Average Response Time</div>
                <div className="text-white/60 text-xs mt-1">Our team responds to all inquiries within one business day.</div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              {success ? (
                <div className="bg-white rounded-2xl border border-[#c8e0be] p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-20 h-20 rounded-full bg-[#4aa027]/10 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-10 h-10 text-[#4aa027]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1a1a1a] mb-2"
                    style={{ fontFamily: 'Playfair Display, serif' }}>Inquiry Received!</h3>
                  <p className="text-[#4a6040] mb-6 max-w-sm text-sm">
                    Thank you for reaching out. Our team will review your message and contact you within 24 hours.
                  </p>
                  <button
                    onClick={() => { setSuccess(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                    className="inline-flex items-center gap-2 text-[#4aa027] font-semibold hover:underline text-sm">
                    Send another inquiry <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#c8e0be] p-8 shadow-sm">
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-6">Send Us a Message</h3>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[#1a1a1a]">Full Name</label>
                        <input name="name" value={form.name} onChange={handleChange}
                          placeholder="Juan Dela Cruz"
                          className={`h-11 rounded-xl border px-4 text-sm bg-[#f4faf0] text-[#1a1a1a] placeholder:text-[#8ab87a] focus:outline-none focus:ring-2 focus:ring-[#4aa027]/40 focus:border-[#4aa027] transition-colors ${errors.name ? 'border-red-400' : 'border-[#c8e0be]'}`} />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[#1a1a1a]">Email Address</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange}
                          placeholder="you@example.com"
                          className={`h-11 rounded-xl border px-4 text-sm bg-[#f4faf0] text-[#1a1a1a] placeholder:text-[#8ab87a] focus:outline-none focus:ring-2 focus:ring-[#4aa027]/40 focus:border-[#4aa027] transition-colors ${errors.email ? 'border-red-400' : 'border-[#c8e0be]'}`} />
                        {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#1a1a1a]">Subject</label>
                      <select name="subject" value={form.subject} onChange={handleChange}
                        className={`h-11 rounded-xl border px-4 text-sm bg-[#f4faf0] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#4aa027]/40 focus:border-[#4aa027] transition-colors ${errors.subject ? 'border-red-400' : 'border-[#c8e0be]'}`}>
                        <option value="">Select a topic...</option>
                        <option>Membership Inquiry</option>
                        <option>Investment Opportunities</option>
                        <option>Partnership Proposal</option>
                        <option>General Question</option>
                        <option>Other</option>
                      </select>
                      {errors.subject && <span className="text-red-500 text-xs">{errors.subject}</span>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#1a1a1a]">Message</label>
                      <textarea name="message" value={form.message} onChange={handleChange}
                        rows={5} placeholder="Tell us about yourself and what you're looking for..."
                        className={`rounded-xl border px-4 py-3 text-sm bg-[#f4faf0] text-[#1a1a1a] placeholder:text-[#8ab87a] focus:outline-none focus:ring-2 focus:ring-[#4aa027]/40 focus:border-[#4aa027] transition-colors resize-none ${errors.message ? 'border-red-400' : 'border-[#c8e0be]'}`} />
                      {errors.message && <span className="text-red-500 text-xs">{errors.message}</span>}
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full h-12 bg-[#4aa027] hover:bg-[#2d7a0f] disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-md hover:shadow-lg">
                      {loading
                        ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : <>Submit Inquiry <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-[#4aa027] font-semibold text-sm tracking-widest uppercase mb-3">FAQ</span>
            <h3 className="text-4xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Common Questions
            </h3>
            <div className="w-16 h-1 bg-[#f5c518] rounded-full mx-auto mt-5" />
          </div>
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="rounded-2xl border border-[#c8e0be] overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-[#f4faf0] hover:bg-[#e6f2df] transition-colors">
                  <span className="font-semibold text-[#1a1a1a] text-sm">{q}</span>
                  <span className={`text-[#4aa027] text-xl font-bold flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 bg-white border-t border-[#c8e0be]">
                    <p className="pt-4 text-[#4a6040] text-sm leading-relaxed">{a}</p>
                  </div>
                )}
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
