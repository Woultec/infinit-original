import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, name, subject, zoomLink } = await req.json()

    // Use the same SMTP credentials configured in Supabase Auth settings
    const SMTP_HOSTNAME = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
    const SMTP_PORT = Number(Deno.env.get('SMTP_PORT')) || 465
    const SMTP_USER = Deno.env.get('SMTP_SUPERADMIN') || Deno.env.get('SMTP_USERNAME')
    const SMTP_PASS = Deno.env.get('SMTP_PASSWORD')

    if (!SMTP_USER || !SMTP_PASS) {
      throw new Error(
        `SMTP credentials missing. Found SMTP_SUPERADMIN=${!!Deno.env.get('SMTP_SUPERADMIN')}, SMTP_USERNAME=${!!Deno.env.get('SMTP_USERNAME')}, SMTP_PASSWORD=${!!Deno.env.get('SMTP_PASSWORD')}`
      )
    }

    console.log(`Connecting to ${SMTP_HOSTNAME}:${SMTP_PORT} as ${SMTP_USER}`)

    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOSTNAME,
        port: SMTP_PORT,
        tls: true,
        auth: {
          username: SMTP_USER,
          password: SMTP_PASS,
        },
      },
    })

    await client.send({
      from: SMTP_USER,
      to: to,
      subject: `Meeting Invitation: ${subject}`,
      content: `Hello ${name}, your meeting link is: ${zoomLink}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #2d7a0f, #4aa027); color: white; font-weight: bold; font-size: 18px; padding: 10px 20px; border-radius: 8px;">
              ∞ Infinity 8K
            </div>
          </div>
          <h2 style="color: #1a1a1a;">Hello ${name},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Thank you for your inquiry regarding <strong>"${subject}"</strong>.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            We would like to invite you to a virtual meeting to discuss this further.
          </p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${zoomLink}" style="display: inline-block; background-color: #4aa027; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Join Zoom Meeting
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Or copy this link: <a href="${zoomLink}" style="color: #4aa027;">${zoomLink}</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            &copy; Infinity 8K Corporation — All rights reserved.
          </p>
        </div>
      `,
    })

    await client.close()

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('SMTP Error Details:', error)
    return new Response(
      JSON.stringify({ error: String(error?.message || error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
