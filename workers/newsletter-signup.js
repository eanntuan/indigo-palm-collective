// Cloudflare Worker: Newsletter Signup Handler
// Handles "Stay in the Loop" form submissions

// Import the email template (you'll need to upload this as a Worker asset)
const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Indigo Palm Collective Newsletter 🌵</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #f5f3ee;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f3ee;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #738561 0%, #adbab7 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 300; letter-spacing: 2px;">INDIGO PALM COLLECTIVE</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-style: italic;">Curated stays across Coachella Valley</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #2c2c2c; font-size: 24px; font-weight: 400;">Welcome to our community!</h2>
                            <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">You're now in the loop for new properties, exclusive offers, last-minute deals, and desert getaway inspiration.</p>

                            <!-- Benefits List -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <p style="margin: 0; color: #555; font-size: 16px; line-height: 1.8;">
                                            ✓ New property launches<br>
                                            ✓ Exclusive offers & last-minute deals<br>
                                            ✓ Desert getaway inspiration<br>
                                            ✓ Special events in Coachella Valley
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Discount Code Box -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #B67550 0%, #325CD9 100%); padding: 30px; border-radius: 8px; text-align: center;">
                                        <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Your Welcome Gift</p>
                                        <h3 style="margin: 10px 0; color: #ffffff; font-size: 36px; letter-spacing: 3px; font-family: 'Courier New', monospace;">WELCOME10</h3>
                                        <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 18px;">10% off your first booking</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="https://indigopalm.co" style="display: inline-block; padding: 16px 40px; background-color: #d2635b; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; letter-spacing: 1px;">Explore Our Homes</a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0 0 0; color: #555; font-size: 16px; line-height: 1.6;">Ready to book? Email us at <a href="mailto:indigopalmco@gmail.com" style="color: #d2635b; text-decoration: none;">indigopalmco@gmail.com</a></p>
                            <p style="margin: 20px 0 0 0; color: #555; font-size: 16px; line-height: 1.6;">See you in the desert!<br><strong>Indigo Palm Collective Team</strong></p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2c2c2c; padding: 30px; text-align: center;">
                            <p style="margin: 0 0 10px 0; color: rgba(255,255,255,0.7); font-size: 14px;">Indigo Palm Collective | Coachella Valley</p>
                            <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                                <a href="https://indigopalm.co" style="color: rgba(255,255,255,0.7); text-decoration: none;">Website</a> •
                                <a href="https://instagram.com/indigopalmco" style="color: rgba(255,255,255,0.7); text-decoration: none;">Instagram</a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { email } = await request.json();

      // Validate email
      if (!email || !email.includes('@')) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid email address'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Save to Google Sheets
      await saveToGoogleSheets(email, env);

      // Send welcome email with WELCOME10
      await sendWelcomeEmail(email, env);

      return new Response(JSON.stringify({
        success: true,
        message: 'Welcome email sent! Check your inbox.'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      console.error('Newsletter signup error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Signup failed. Please try again.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

// Save email to Google Sheets via Apps Script webhook
async function saveToGoogleSheets(email, env) {
  const WEBHOOK_URL = env.SHEETS_WEBHOOK_URL;

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error('Failed to save to Google Sheets');
  }

  return await response.json();
}

// Send welcome email via Resend
async function sendWelcomeEmail(email, env) {
  const RESEND_API_KEY = env.RESEND_API_KEY;

  const emailContent = {
    from: 'Indigo Palm Collective <hello@indigopalm.co>',
    to: [email],
    subject: 'Welcome to Indigo Palm Collective! 🌴',
    html: EMAIL_TEMPLATE,
  };

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailContent),
  });
}
