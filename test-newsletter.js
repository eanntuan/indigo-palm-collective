import 'dotenv/config';
import { Resend } from 'resend';
import fs from 'fs';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testNewsletterSignup() {
  const testEmail = 'eann.tuan@gmail.com'; // Your email for testing

  console.log('🧪 Testing Newsletter Signup Flow\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Step 1: Simulate saving to Google Sheets
    console.log('📊 Step 1: Save to Google Sheets');
    await saveToGoogleSheets(testEmail);
    console.log('✅ Email saved to Google Sheet\n');

    // Step 2: Send welcome email
    console.log('📧 Step 2: Send welcome email');
    await sendWelcomeEmail(testEmail);
    console.log('✅ Welcome email sent!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 Newsletter signup test successful!\n');
    console.log('Check your inbox at: eann.tuan@gmail.com');
    console.log('Check your Google Sheet for the new entry\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nFull error:', error);
  }
}

// Save to Google Sheets via Apps Script webhook
async function saveToGoogleSheets(email) {
  const WEBHOOK_URL = process.env.SHEETS_WEBHOOK_URL;

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Sheets webhook error: ${error}`);
  }

  const text = await response.text();
  return { success: true, response: text };
}

// Send welcome email
async function sendWelcomeEmail(email) {
  // Read the email template
  const emailTemplate = fs.readFileSync('./email-templates/newsletter-welcome.html', 'utf8');

  const { data, error } = await resend.emails.send({
    from: 'Indigo Palm Collective <hello@indigopalm.co>',
    to: [email],
    subject: 'Welcome to Indigo Palm Collective! 🌴',
    html: emailTemplate,
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }

  return data;
}

// Run the test
testNewsletterSignup();
