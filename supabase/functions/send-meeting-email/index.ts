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

    // SMTP Configuration
    const SMTP_HOSTNAME = 'smtp.gmail.com'
    const SMTP_PORT = 465 // Using SSL/TLS port
    const SMTP_USERNAME = Deno.env.get('SMTP_USERNAME')
    const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD')

    if (!SMTP_USERNAME || !SMTP_PASSWORD) {
      throw new Error('SMTP credentials not found in secrets')
    }

    // Initialize Denomailer client (Modern Deno-compatible library)
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOSTNAME,
        port: SMTP_PORT,
        tls: true,
        auth: {
          username: SMTP_USERNAME,
          password: SMTP_PASSWORD,
        },
      },
    })

    await client.send({
      from: SMTP_USERNAME,
      to: to,
      subject: `Meeting Invitation: ${subject}`,
      content: `Hello ${name}, your meeting link is: ${zoomLink}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #1a1a1a;">Hello ${name},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Thank you for your inquiry regarding <strong>"${subject}"</strong>.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            We would like to invite you to a virtual meeting to discuss this further.
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${zoomLink}" style="background-color: #4aa027; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Join Zoom Meeting
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Link: <a href="${zoomLink}">${zoomLink}</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            &copy; Infinity 8K Corporation
          </p>
        </div>
      `,
    })

    await client.close()

    return new Response(
      JSON.stringify({ message: 'Email sent successfully via Denomailer' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('SMTP Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
