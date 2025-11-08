import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid if API key is provided
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("SendGrid initialized successfully");
} else {
  console.log("SendGrid API key not found, falling back to Gmail");
}

// Create nodemailer transporter as fallback
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration (only for nodemailer)
if (!process.env.SENDGRID_API_KEY) {
  transporter.verify((error, success) => {
    if (error) {
      console.log("Email transporter error:", error);
    } else {
      console.log("Email server is ready to send messages");
    }
  });
}

// Helper function to send emails using SendGrid or nodemailer
const sendEmailMessage = async (mailOptions) => {
  if (process.env.SENDGRID_API_KEY) {
    // Use SendGrid
    const msg = {
      to: mailOptions.to,
      from: mailOptions.from,
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html,
    };

    try {
      const response = await sgMail.send(msg);
      console.log(
        "Email sent via SendGrid:",
        response[0].headers["x-message-id"]
      );
      return {
        success: true,
        messageId: response[0].headers["x-message-id"],
        provider: "SendGrid",
      };
    } catch (error) {
      console.error("SendGrid error:", error);
      throw error;
    }
  } else {
    // Use nodemailer (Gmail)
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent via nodemailer:", info.messageId);
      return {
        success: true,
        messageId: info.messageId,
        provider: "nodemailer",
      };
    } catch (error) {
      console.error("Nodemailer error:", error);
      throw error;
    }
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${
      process.env.FRONTEND_URL || "https://qure-design.vercel.app"
    }/reset-password.html?token=${resetToken}`;

    const mailOptions = {
      from: `"Qure Healthcare" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "Password Reset Request - Qure Healthcare System",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body {
              font-family: 'Plus Jakarta Sans', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #3b82f6;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .content {
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background-color: #3b82f6;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 500;
              margin: 20px 0;
              transition: background-color 0.3s ease;
            }
            .button:hover {
              background-color: #2563eb;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
              text-align: center;
            }
            .warning {
              background-color: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              color: #92400e;
            }
            .token {
              background-color: #f3f4f6;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              padding: 10px;
              font-family: monospace;
              font-size: 12px;
              word-break: break-all;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏥 Qure</div>
              <h1 class="title">Reset Your Password</h1>
            </div>
            
            <div class="content">
              <p>Hello,</p>
              
              <p>We received a request to reset your password for your Qure Healthcare account. If you made this request, please follow the instructions below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 16px; color: #1f2937; margin-bottom: 20px;">
                  <strong>To reset your password:</strong>
                </p>
                <ol style="text-align: left; max-width: 400px; margin: 0 auto; color: #374151;">
                  <li style="margin-bottom: 10px;">Go to the Qure Healthcare website</li>
                  <li style="margin-bottom: 10px;">Navigate to the password reset page</li>
                  <li style="margin-bottom: 10px;">Enter this reset code: <strong style="color: #1f2937;">${resetToken}</strong></li>
                  <li>Follow the instructions to create a new password</li>
                </ol>
              </div>
              
              <p><strong>Reset Code:</strong></p>
              <div class="token">${resetToken}</div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link will expire in 10 minutes</li>
                  <li>If you didn't request this password reset, please ignore this email</li>
                  <li>For security, never share this link with anyone</li>
                </ul>
              </div>
              
              <p>If you need to access the reset page directly, you can manually navigate to the password reset section of our website.</p>
            </div>
            
            <div class="footer">
              <p>This email was sent from Qure Healthcare Queue Management System.</p>
              <p>If you have any questions, please contact our support team.</p>
              <p><strong>Qure Healthcare</strong> - Making healthcare accessible for everyone</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Reset Your Password - Qure Healthcare
        
        Hello,
        
        We received a request to reset your password for your Qure Healthcare account.
        
        To reset your password, click the link below:
        ${resetUrl}
        
        Or copy and paste this link into your browser:
        ${resetUrl}
        
        Important:
        - This link will expire in 10 minutes
        - If you didn't request this password reset, please ignore this email
        - For security, never share this link with anyone
        
        If the link doesn't work, you can also manually navigate to the reset password page and use this token:
        ${resetToken}
        
        This email was sent from Qure Healthcare Queue Management System.
        If you have any questions, please contact our support team.
        
        Qure Healthcare - Making healthcare accessible for everyone
      `,
    };

    const result = await sendEmailMessage(mailOptions);
    console.log(
      `Password reset email sent via ${result.provider}:`,
      result.messageId
    );
    return result;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

// Send welcome email (for future use)
export const sendWelcomeEmail = async (email, firstName) => {
  try {
    const mailOptions = {
      from: `"Qure Healthcare" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "Welcome to Qure Healthcare System",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Qure</title>
          <style>
            body {
              font-family: 'Plus Jakarta Sans', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #3b82f6;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .content {
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background-color: #10b981;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 500;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏥 Qure</div>
              <h1 class="title">Welcome to Qure Healthcare!</h1>
            </div>
            
            <div class="content">
              <p>Hello ${firstName},</p>
              
              <p>Welcome to Qure Healthcare Queue Management System! We're excited to have you on board.</p>
              
              <p>With Qure, you can:</p>
              <ul>
                <li>📅 Book appointments easily</li>
                <li>⏰ Track your queue status in real-time</li>
                <li>🏥 Access multiple healthcare providers</li>
                <li>📱 Manage everything from your mobile device</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${
                  process.env.FRONTEND_URL || "https://qure-design.vercel.app"
                }/login.html" class="button">Get Started</a>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing Qure Healthcare!</p>
              <p><strong>Qure Healthcare</strong> - Making healthcare accessible for everyone</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await sendEmailMessage(mailOptions);
    console.log(`Welcome email sent via ${result.provider}:`, result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }
};

// Send access code email to staff
export const sendAccessCodeEmail = async (
  email,
  firstName,
  accessCode,
  hospitalName
) => {
  try {
    const accessUrl = `${
      process.env.FRONTEND_URL || "https://qure-design.vercel.app"
    }/access.html`;

    const mailOptions = {
      from: `"Qure Healthcare" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: `Hospital Access Information - ${hospitalName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Hospital Access Code</title>
          <style>
            body {
              font-family: 'Plus Jakarta Sans', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #3b82f6;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .content {
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background-color: #3b82f6;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 500;
              margin: 20px 0;
              transition: background-color 0.3s ease;
            }
            .button:hover {
              background-color: #2563eb;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
              text-align: center;
            }
            .access-code {
              background-color: #f3f4f6;
              border: 2px solid #3b82f6;
              border-radius: 8px;
              padding: 20px;
              font-family: monospace;
              font-size: 24px;
              font-weight: bold;
              text-align: center;
              color: #1f2937;
              margin: 20px 0;
              letter-spacing: 2px;
            }
            .hospital-info {
              background-color: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              color: #1e40af;
            }
            .warning {
              background-color: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              color: #92400e;
            }
            .steps {
              background-color: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .steps ol {
              margin: 0;
              padding-left: 20px;
            }
            .steps li {
              margin-bottom: 8px;
              color: #166534;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏥 Qure</div>
              <h1 class="title">Your Hospital Access Code</h1>
            </div>
            
            <div class="content">
              <p>Hello ${firstName},</p>
              
              <p>Welcome to the Qure Healthcare staff portal! Your account has been successfully created for <strong>${hospitalName}</strong>.</p>
              
              <div class="hospital-info">
                <strong>🏥 Hospital:</strong> ${hospitalName}<br>
                <strong>👤 Staff Member:</strong> ${firstName}<br>
                <strong>📧 Email:</strong> ${email}
              </div>
              
              <p>To access your hospital dashboard, you'll need to use the <strong>shared access code</strong> for ${hospitalName} below:</p>
              
              <div class="access-code">${accessCode}</div>
              
              <div class="steps">
                <h3 style="margin-top: 0; color: #166534;">How to Access Your Dashboard:</h3>
                <ol>
                  <li>Go to the Qure access page</li>
                  <li>Enter your access code: <strong>${accessCode}</strong></li>
                  <li>Click "Continue" to access your hospital dashboard</li>
                  <li>Start managing queues, appointments, and more!</li>
                </ol>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 16px; color: #1f2937; margin-bottom: 20px;">
                  <strong>To access your dashboard:</strong>
                </p>
                <ol style="text-align: left; max-width: 400px; margin: 0 auto; color: #374151;">
                  <li style="margin-bottom: 10px;">Visit the Qure Healthcare website</li>
                  <li style="margin-bottom: 10px;">Go to the staff access page</li>
                  <li style="margin-bottom: 10px;">Enter your access code: <strong style="color: #1f2937;">${accessCode}</strong></li>
                  <li>Click continue to access your dashboard</li>
                </ol>
              </div>
              
              <div class="warning">
                <strong>🔒 Security Information:</strong>
                <ul>
                  <li>This is a <strong>shared access code</strong> for all ${hospitalName} staff</li>
                  <li>Keep your access code confidential</li>
                  <li>This code is specific to ${hospitalName} only</li>
                  <li>Do not share this code with staff from other hospitals</li>
                  <li>Contact your administrator if you need assistance</li>
                </ul>
              </div>
              
              <p>With your access code, you can:</p>
              <ul>
                <li>📋 Manage patient queues</li>
                <li>📅 Handle appointments</li>
                <li>📊 View analytics and reports</li>
                <li>👥 Manage staff (if authorized)</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>This shared access code was automatically generated for ${hospitalName}.</p>
              <p>All staff members from ${hospitalName} use the same access code.</p>
              <p>If you have any questions, please contact your hospital administrator.</p>
              <p><strong>Qure Healthcare</strong> - Making healthcare accessible for everyone</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Your Hospital Access Code - ${hospitalName}
        
        Hello ${firstName},
        
        Welcome to the Qure Healthcare staff portal! Your account has been successfully created for ${hospitalName}.
        
        Hospital: ${hospitalName}
        Staff Member: ${firstName}
        Email: ${email}
        
        To access your hospital dashboard, use this shared access code for ${hospitalName}:
        
        ${accessCode}
        
        How to Access Your Dashboard:
        1. Go to: ${accessUrl}
        2. Enter your access code: ${accessCode}
        3. Click "Continue" to access your hospital dashboard
        4. Start managing queues, appointments, and more!
        
        Security Information:
        - This is a shared access code for all ${hospitalName} staff
        - Keep your access code confidential
        - This code is specific to ${hospitalName} only
        - Do not share this code with staff from other hospitals
        - Contact your administrator if you need assistance
        
        With your access code, you can:
        - Manage patient queues
        - Handle appointments
        - View analytics and reports
        - Manage staff (if authorized)
        
        This shared access code was automatically generated for ${hospitalName}.
        All staff members from ${hospitalName} use the same access code.
        If you have any questions, please contact your hospital administrator.
        
        Qure Healthcare - Making healthcare accessible for everyone
      `,
    };

    const result = await sendEmailMessage(mailOptions);
    console.log(
      `Access code email sent via ${result.provider}:`,
      result.messageId
    );
    return result;
  } catch (error) {
    console.error("Error sending access code email:", error);
    throw new Error("Failed to send access code email");
  }
};

// Generic send email function
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"Qure Healthcare" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to,
      subject,
      html,
      text,
    };

    const result = await sendEmailMessage(mailOptions);
    console.log(
      `Email sent successfully via ${result.provider}:`,
      result.messageId
    );
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
