// Cloudflare Worker: Newsletter Signup Handler
// Handles "Stay in the Loop" form submissions

const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're in. Here's where to start.</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #F5F3EE;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F5F3EE;">
<tr><td style="padding: 32px 20px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden;">

    <!-- Header bar -->
    <tr>
        <td style="background-color: #B67550; padding: 20px 36px; text-align: center;">
            <img src="https://indigopalm.co/images/logo-icon-white-feather.png" alt="Indigo Palm Collective" width="48" height="48" style="display: inline-block; width: 48px; height: 48px; object-fit: contain;" />
            <p style="margin: 6px 0 0; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; font-weight: 400; letter-spacing: 0.01em; color: #ffffff;">Indigo Palm Collective</p>
        </td>
    </tr>

    <!-- Hero image -->
    <tr>
        <td style="padding: 0; line-height: 0;">
            <img src="https://indigopalm.co/email-images/cozy-cactus.jpg" alt="The Cozy Cactus pool at golden hour, Indio CA" width="580" style="display: block; width: 100%; max-width: 580px; height: 260px; object-fit: cover;" />
        </td>
    </tr>

    <!-- Intro -->
    <tr>
        <td style="padding: 40px 36px 0;">
            <h1 style="margin: 0 0 18px; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 400; line-height: 1.35; color: #2C2C2C;">You're in. Welcome to our little corner of the desert.</h1>
            <p style="margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #555;">I'm Eann. I own four vacation homes across the Coachella Valley, each one designed with a specific guest in mind:</p>
            <ul style="margin: 0 0 14px; padding-left: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.9; color: #555;">
                <li><a href="https://indigopalm.co/cozy-cactus/?utm_source=newsletter&utm_medium=email&utm_campaign=welcome&utm_content=intro-cozy-cactus" style="color: #B67550; text-decoration: none;">The Cozy Cactus</a> — built for families traveling with young kids</li>
                <li><a href="https://indigopalm.co/terra-luz/?utm_source=newsletter&utm_medium=email&utm_campaign=welcome&utm_content=intro-terra-luz" style="color: #B67550; text-decoration: none;">Terra Luz</a> — Latin-inspired retreat with a Kahlo-blue pool and Old Havana warmth</li>
                <li><a href="https://indigopalm.co/the-sundune/?utm_source=newsletter&utm_medium=email&utm_campaign=welcome&utm_content=intro-sundune" style="color: #B67550; text-decoration: none;">The Sundune</a> — two-bedroom in Palm Springs, 10 minutes from downtown</li>
                <li><a href="https://indigopalm.co/the-well/?utm_source=newsletter&utm_medium=email&utm_campaign=welcome&utm_content=intro-the-well" style="color: #B67550; text-decoration: none;">The Well</a> — quiet one-bedroom for guests who need a real reset, minimum 28 nights</li>
            </ul>
            <p style="margin: 0 0 14px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #555;">Together they're Indigo Palm Collective. Four homes with four distinct personalities, owned and hosted by one person who answers messages.</p>
            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #555;">Expect to hear from me a few times a year: property news, last-minute deals, a restaurant worth the drive, a festival rental about to sell out. Short emails, always a reason to send them.</p>
        </td>
    </tr>

    <!-- Property grid -->
    <tr>
        <td style="padding: 28px 36px 0;">
            <p style="margin: 0 0 14px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #B67550;">The homes</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td width="49%" style="padding-right: 6px; vertical-align: top;">
                        <a href="https://indigopalm.co/cozy-cactus/?utm_source=newsletter&utm_medium=email&utm_campaign=welcome&utm_content=grid-cozy-cactus" style="text-decoration: none; display: block;">
                            <img src="https://indigopalm.co/email-images/cozy-cactus.webp" alt="The Cozy Cactus" width="100%" style="display: block; width: 100%; height: 140px; object-fit: cover; border-radius: 3px;" />
                            <p style="margin: 8px 0 2px; font-family: Georgia, serif; font-size: 14px; color: #2C2C2C;">The Cozy Cactus</p>
                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999;">3 bed &middot; Indio</p>
                        </a>
                    </td>
                    <td width="2%"></td>
                    <td width="49%" style="padding-left: 6px; vertical-align: top;">
                        <a href="https://indigopalm.co/terra-luz/?utm_source=newsletter&utm_medium=email&utm_campaign=welcome&utm_content=grid-terra-luz" style="text-decoration: none; display: block;">
                            <img src="https://indigopalm.co/email-images/casa-moto.jpg" alt="Terra Luz" width="100%" style="display: block; width: 100%; height: 140px; object-fit: cover; border-radius: 3px;" />
                            <p style="margin: 8px 0 2px; font-family: Georgia, serif; font-size: 14px; color: #2C2C2C;">Terra Luz</p>
                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999;">3 bed &middot; Indio</p>
                        </a>
                    </td>
                </tr>
                <tr><td colspan="3" style="padding-top: 12px;"></td></tr>
                <tr>
                    <td width="49%" style="padding-right: 6px; vertical-align: top;">
                        <a href="https://indigopalm.co/the-sundune/?utm_source=newsletter&utm_medium=email&utm_campaign=welcome&utm_content=grid-sundune" style="text-decoration: none; display: block;">
                            <img src="https://indigopalm.co/email-images/ps-retreat.jpg" alt="The Sundune" width="100%" style="display: block; width: 100%; height: 140px; object-fit: cover; border-radius: 3px;" />
                            <p style="margin: 8px 0 2px; font-family: Georgia, serif; font-size: 14px; color: #2C2C2C;">The Sundune</p>
                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999;">2 bed &middot; Palm Springs</p>
                        </a>
                    </td>
                    <td width="2%"></td>
                    <td width="49%" style="padding-left: 6px; vertical-align: top;">
                        <a href="https://indigopalm.co/the-well/?utm_source=newsletter&utm_medium=email&utm_campaign=welcome&utm_content=grid-the-well" style="text-decoration: none; display: block;">
                            <img src="https://indigopalm.co/email-images/the-well.jpg" alt="The Well" width="100%" style="display: block; width: 100%; height: 140px; object-fit: cover; border-radius: 3px;" />
                            <p style="margin: 8px 0 2px; font-family: Georgia, serif; font-size: 14px; color: #2C2C2C;">The Well</p>
                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999;">1 bed &middot; Palm Springs</p>
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding: 32px 36px 0;"><hr style="border: none; border-top: 1px solid #EDE8E0; margin: 0;" /></td></tr>

    <!-- Blog links -->
    <tr>
        <td style="padding: 28px 36px 0;">
            <p style="margin: 0 0 18px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #B67550;">Before you book, start here</p>

            <!-- Blog link 1 -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 14px;">
                <tr>
                    <td style="border-radius: 3px; overflow: hidden; border: 1px solid #EDE8E0;">
                        <a href="https://indigopalm.co/blog/indio-local-gems/?utm_source=newsletter&utm_medium=email&utm_campaign=welcome&utm_content=blog-indio-gems" style="text-decoration: none; display: block;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td width="100" style="vertical-align: top; padding: 0; line-height: 0;">
                                        <img src="https://indigopalm.co/blog/images/indio-sign-miles-ave.webp" alt="Indio local gems" width="100" style="display: block; width: 100px; height: 90px; object-fit: cover;" />
                                    </td>
                                    <td style="padding: 14px 16px; vertical-align: top;">
                                        <p style="margin: 0 0 4px; font-family: Georgia, serif; font-size: 15px; color: #2C2C2C; line-height: 1.3;">10 Indio Spots Most Visitors Never Find</p>
                                        <p style="margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999; line-height: 1.5;">The taco stand by the date farm. The swim spot without the line.</p>
                                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; color: #B67550; letter-spacing: 0.06em;">READ &rarr;</p>
                                    </td>
                                </tr>
                            </table>
                        </a>
                    </td>
                </tr>
            </table>

            <!-- Blog link 2 -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 14px;">
                <tr>
                    <td style="border-radius: 3px; overflow: hidden; border: 1px solid #EDE8E0;">
                        <a href="https://indigopalm.co/blog/palm-springs-vs-indio/?utm_source=newsletter&utm_medium=email&utm_campaign=welcome&utm_content=blog-ps-vs-indio" style="text-decoration: none; display: block;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td width="100" style="vertical-align: top; padding: 0; line-height: 0;">
                                        <img src="https://indigopalm.co/blog/images/ps-boulevard-palms-mountains.webp" alt="Palm Springs vs Indio" width="100" style="display: block; width: 100px; height: 90px; object-fit: cover;" />
                                    </td>
                                    <td style="padding: 14px 16px; vertical-align: top;">
                                        <p style="margin: 0 0 4px; font-family: Georgia, serif; font-size: 15px; color: #2C2C2C; line-height: 1.3;">Palm Springs vs Indio: Which Base Is Right for You?</p>
                                        <p style="margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999; line-height: 1.5;">25 miles apart, 30-40% price difference, very different vibes.</p>
                                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; color: #B67550; letter-spacing: 0.06em;">READ &rarr;</p>
                                    </td>
                                </tr>
                            </table>
                        </a>
                    </td>
                </tr>
            </table>

            <!-- Blog link 3 -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td style="border-radius: 3px; overflow: hidden; border: 1px solid #EDE8E0;">
                        <a href="https://indigopalm.co/blog/beyond-coachella-desert-escape/?utm_source=newsletter&utm_medium=email&utm_campaign=welcome&utm_content=blog-beyond-coachella" style="text-decoration: none; display: block;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td width="100" style="vertical-align: top; padding: 0; line-height: 0;">
                                        <img src="https://indigopalm.co/blog/images/cozy-cactus-pool.webp" alt="Coachella Valley beyond festival season" width="100" style="display: block; width: 100px; height: 90px; object-fit: cover;" />
                                    </td>
                                    <td style="padding: 14px 16px; vertical-align: top;">
                                        <p style="margin: 0 0 4px; font-family: Georgia, serif; font-size: 15px; color: #2C2C2C; line-height: 1.3;">The Coachella Valley Outside Festival Season</p>
                                        <p style="margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999; line-height: 1.5;">Hot springs, date shakes, Joshua Tree day trips.</p>
                                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; color: #B67550; letter-spacing: 0.06em;">READ &rarr;</p>
                                    </td>
                                </tr>
                            </table>
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding: 32px 36px 0;"><hr style="border: none; border-top: 1px solid #EDE8E0; margin: 0;" /></td></tr>

    <!-- Discount code -->
    <tr>
        <td style="padding: 28px 36px 0;">
            <p style="margin: 0 0 14px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #B67550;">Your welcome gift</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td style="padding: 28px; background-color: #B67550; border-radius: 3px; text-align: center;">
                        <p style="margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.7);">10% off your first stay</p>
                        <p style="margin: 0 0 10px; font-family: 'Courier New', Courier, monospace; font-size: 32px; letter-spacing: 0.1em; color: #ffffff; font-weight: 600;">WELCOME10</p>
                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: rgba(255,255,255,0.6);">Enter at checkout on indigopalm.co</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- CTA -->
    <tr>
        <td style="padding: 24px 36px 0; text-align: center;">
            <a href="https://indigopalm.co/?utm_source=newsletter&utm_medium=email&utm_campaign=welcome&utm_content=cta-see-homes" style="display: inline-block; padding: 14px 40px; background-color: #B67550; color: #ffffff; text-decoration: none; border-radius: 3px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 0.06em;">See the homes</a>
        </td>
    </tr>

    <!-- Sign off -->
    <tr>
        <td style="padding: 32px 36px 36px;">
            <p style="margin: 0 0 4px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #555;">See you in the desert.</p>
            <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 18px; color: #2C2C2C;">Eann</p>
        </td>
    </tr>

    <!-- Footer -->
    <tr>
        <td style="padding: 18px 36px; background-color: #F5F3EE; border-top: 2px solid #B67550;">
            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #aaa; line-height: 1.7; text-align: center;">
                Indigo Palm Collective &nbsp;&middot;&nbsp; Coachella Valley, CA<br>
                <a href="https://indigopalm.co" style="color: #B67550; text-decoration: none;">indigopalm.co</a> &nbsp;&middot;&nbsp; <a href="https://instagram.com/indigopalmco" style="color: #B67550; text-decoration: none;">@indigopalmco</a>
            </p>
        </td>
    </tr>

</table>
</td></tr>
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

    // Redirect GET requests (e.g. Googlebot) to main site instead of returning 405
    if (request.method === 'GET') {
      return Response.redirect('https://indigopalm.co/', 301);
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
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      // Save to Google Sheets (non-blocking, don't let this kill the signup)
      saveToGoogleSheets(email, env).catch(err => console.error('Sheets save failed:', err));

      // Send welcome email with WELCOME10
      await sendWelcomeEmail(email, env);

      // Notify owner
      sendOwnerNotification(email, env).catch(err => console.error('Owner notification failed:', err));

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
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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

// Notify owner of new signup via Resend
async function sendOwnerNotification(email, env) {
  const RESEND_API_KEY = env.RESEND_API_KEY;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Indigo Palm Collective <hello@indigopalm.co>',
      to: ['indigopalmco@gmail.com'],
      subject: `New signup: ${email}`,
      html: `<p>New newsletter subscriber: <strong>${email}</strong></p><p>Signed up at ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT</p>`,
    }),
  });
}

// Send welcome email via Resend
async function sendWelcomeEmail(email, env) {
  const RESEND_API_KEY = env.RESEND_API_KEY;

  const emailContent = {
    from: 'Indigo Palm Collective <hello@indigopalm.co>',
    to: [email],
    subject: "You're in. Here's where to start.",
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
