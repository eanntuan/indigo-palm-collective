import 'dotenv/config';
import { Resend } from 'resend';
import fs from 'fs';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testNewsletterEmail() {
  const testEmail = 'eann.tuan@gmail.com';

  console.log('📧 Testing Newsletter Welcome Email\n');

  try {
    // Read the email template
    const emailTemplate = fs.readFileSync('./email-templates/newsletter-welcome.html', 'utf8');

    console.log('Sending welcome email to:', testEmail);

    const { data, error } = await resend.emails.send({
      from: 'Indigo Palm Collective <hello@indigopalm.co>',
      to: [testEmail],
      subject: 'Welcome to Indigo Palm Collective! 🌴 (Test)',
      html: emailTemplate,
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('\n✅ Email sent successfully!');
    console.log('📬 Email ID:', data.id);
    console.log('\n🎉 Check your inbox at: eann.tuan@gmail.com');
    console.log('\nYou should see:');
    console.log('  • Subject: Welcome to Indigo Palm Collective! 🌴');
    console.log('  • From: Indigo Palm Collective <hello@indigopalm.co>');
    console.log('  • Content: Welcome message with WELCOME10 discount code');

  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

testNewsletterEmail();
