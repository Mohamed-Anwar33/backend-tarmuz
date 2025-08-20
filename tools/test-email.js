const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('🔍 Testing Email Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Missing'}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing'}`);
  console.log(`EMAIL_TO: ${process.env.EMAIL_TO ? '✅ Set' : '❌ Missing'}`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n❌ Missing email credentials in .env file');
    console.log('\nTo fix this, add to your .env file:');
    console.log('EMAIL_USER=your-gmail@gmail.com');
    console.log('EMAIL_PASS=your-app-password');
    console.log('EMAIL_TO=recipient@gmail.com');
    console.log('\n📝 Note: Use Gmail App Password, not regular password');
    console.log('Generate App Password: https://myaccount.google.com/apppasswords');
    return;
  }
  
  console.log('\n📤 Testing email send...');
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    
    // Send test email
    const testEmail = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      subject: 'Test Email from Tarmuz Backend',
      text: 'This is a test email to verify the email configuration is working.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #333;">✅ Email Test Successful</h2>
          <p>This is a test email from your Tarmuz backend.</p>
          <p>If you received this, your email configuration is working correctly!</p>
          <hr>
          <small style="color: #666;">Sent at: ${new Date().toLocaleString()}</small>
        </div>
      `
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`Message ID: ${result.messageId}`);
    console.log(`Recipient: ${testEmail.to}`);
    
  } catch (error) {
    console.log('❌ Email test failed:');
    console.log(`Error: ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication failed. Check:');
      console.log('1. Gmail address is correct');
      console.log('2. Using App Password (not regular password)');
      console.log('3. 2-Factor Authentication is enabled');
      console.log('4. App Password is generated and copied correctly');
    }
  }
}

testEmail();
