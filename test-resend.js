import 'dotenv/config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmail() {
  try {
    console.log('📧 Sending test email via Resend...\n');

    const { data, error } = await resend.emails.send({
      from: 'Indigo Palm Collective <hello@indigopalm.co>',
      to: ['eann.tuan@gmail.com'], // Your Resend account email
      subject: '🎉 Resend Email Test - Indigo Palm Collective',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #B67550;">Welcome to Indigo Palm Collective!</h1>

          <p>This is a test email from your new Resend integration.</p>

          <h2 style="color: #325CD9;">What's Next?</h2>
          <ul>
            <li>✅ Resend is working perfectly</li>
            <li>📝 Newsletter signup automation</li>
            <li>📅 Booking request emails</li>
            <li>💳 Stripe payment link delivery</li>
          </ul>

          <hr style="border: 1px solid #F5F3EE; margin: 20px 0;">

          <p style="color: #666; font-size: 14px;">
            Sent from your Indigo Palm booking system
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('📬 Email ID:', data.id);
    console.log('📧 Check your inbox at: indigopalmco@gmail.com\n');
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
  }
}

sendTestEmail();
