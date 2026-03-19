import { useState } from 'react'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { contactSchema, type ContactFormData } from '@lib/validations'
import { supabase } from '@services/supabase'

export function ContactForm() {
  const [form, setForm] = useState<ContactFormData>({
    name: '', email: '', subject: '', message: '',
  })
  const [errors, setErrors] = useState<Partial<ContactFormData>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = contactSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<ContactFormData> = {}
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ContactFormData
        fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      await supabase.from('contacts').insert([result.data])
      setSuccess(true)
      setForm({ name: '', email: '', subject: '', message: '' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl bg-green-500/10 p-6 text-center text-green-600">
        <p className="text-lg font-semibold">Message sent!</p>
        <p className="mt-1 text-sm">We'll get back to you within 24 hours.</p>
        <Button variant="outline" className="mt-4" onClick={() => setSuccess(false)}>
          Send another
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input id="name" name="name" label="Full Name" placeholder="Juan Dela Cruz"
          value={form.name} onChange={handleChange} error={errors.name} />
        <Input id="email" name="email" type="email" label="Email" placeholder="you@example.com"
          value={form.email} onChange={handleChange} error={errors.email} />
      </div>
      <Input id="subject" name="subject" label="Subject" placeholder="How can we help?"
        value={form.subject} onChange={handleChange} error={errors.subject} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-medium">Message</label>
        <textarea
          id="message" name="message" rows={5}
          placeholder="Tell us about your inquiry..."
          value={form.message} onChange={handleChange}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
            placeholder:text-muted-foreground focus:outline-none focus:ring-2
            focus:ring-primary/50 focus:border-primary resize-none"
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
      </div>
      <Button type="submit" loading={loading} size="lg">Submit Inquiry</Button>
    </form>
  )
}
