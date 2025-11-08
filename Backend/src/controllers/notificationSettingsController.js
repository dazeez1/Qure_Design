import { Appointment } from "../models/Appointment.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { sendEmail } from "../utils/email.js";
import cron from "node-cron";

// ===== APPOINTMENT REMINDER SYSTEM =====

// Function to send appointment reminder email
const sendAppointmentReminder = async (appointment) => {
  try {
    const patient = await User.findById(appointment.patient);
    if (!patient || !patient.email) {
      console.log(`No email found for patient ${appointment.patient}`);
      return;
    }

    const appointmentDate = new Date(appointment.appointmentDate);
    const appointmentTime = appointment.appointmentTime;
    const hospitalName = appointment.hospitalName || "Our Hospital";

    // Create professional email template
    const emailTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Reminder - ${hospitalName}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
              ${hospitalName}
            </h1>
            <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">
              Your Health, Our Priority
            </p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background-color: #dbeafe; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px;">📅</span>
              </div>
              <h2 style="color: #1e3a8a; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">
                Appointment Reminder
              </h2>
              <p style="color: #6b7280; font-size: 16px; margin: 0;">
                Hello <strong style="color: #1e3a8a;">${patient.firstName} ${
      patient.lastName
    }</strong>,
              </p>
            </div>
            
            <!-- Appointment Details Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
              <h3 style="color: #1e3a8a; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">
                Your Appointment Details
              </h3>
              
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: center; padding: 12px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                  <span style="font-size: 18px; margin-right: 12px;">📅</span>
                  <div>
                    <div style="font-weight: 600; color: #1e3a8a; font-size: 14px;">DATE</div>
                    <div style="color: #374151; font-size: 16px;">${appointmentDate.toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}</div>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; padding: 12px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #10b981;">
                  <span style="font-size: 18px; margin-right: 12px;">🕐</span>
                  <div>
                    <div style="font-weight: 600; color: #1e3a8a; font-size: 14px;">TIME</div>
                    <div style="color: #374151; font-size: 16px;">${appointmentTime}</div>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; padding: 12px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #f59e0b;">
                  <span style="font-size: 18px; margin-right: 12px;">👨‍⚕️</span>
                  <div>
                    <div style="font-weight: 600; color: #1e3a8a; font-size: 14px;">DOCTOR</div>
                    <div style="color: #374151; font-size: 16px;">${
                      appointment.doctor
                    }</div>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; padding: 12px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #8b5cf6;">
                  <span style="font-size: 18px; margin-right: 12px;">🏥</span>
                  <div>
                    <div style="font-weight: 600; color: #1e3a8a; font-size: 14px;">DEPARTMENT</div>
                    <div style="color: #374151; font-size: 16px;">${
                      appointment.specialty
                    }</div>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; padding: 12px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #ef4444;">
                  <span style="font-size: 18px; margin-right: 12px;">📍</span>
                  <div>
                    <div style="font-weight: 600; color: #1e3a8a; font-size: 14px;">LOCATION</div>
                    <div style="color: #374151; font-size: 16px;">${hospitalName}</div>
                  </div>
                </div>
              </div>
              
              ${
                appointment.notes
                  ? `
                <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                  <div style="font-weight: 600; color: #92400e; font-size: 14px; margin-bottom: 5px;">📝 NOTES</div>
                  <div style="color: #92400e; font-size: 14px;">${appointment.notes}</div>
                </div>
              `
                  : ""
              }
            </div>
            
            <!-- Important Notice -->
            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
              <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
                Important Reminder
              </h4>
              <p style="color: #1e40af; margin: 0; font-size: 16px; font-weight: 500;">
                Please arrive 15 minutes early for your appointment to complete any necessary paperwork.
              </p>
            </div>
            
            <!-- Contact Information -->
            <div style="text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 12px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                Need to reschedule or cancel? Contact us immediately.
              </p>
              <p style="color: #1e3a8a; font-size: 16px; font-weight: 600; margin: 0;">
                Thank you for choosing ${hospitalName}
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
            <p style="color: #e0e7ff; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await sendEmail({
      to: patient.email,
      subject: `Appointment Reminder - ${appointmentDate.toLocaleDateString()} at ${appointmentTime}`,
      html: emailTemplate,
    });

    // Create notification record
    await Notification.create({
      user: patient._id,
      title: "Appointment Reminder Sent",
      message: `Reminder email sent for your appointment with ${
        appointment.doctor
      } on ${appointmentDate.toLocaleDateString()} at ${appointmentTime}`,
      type: "appointment_reminder",
      priority: "medium",
      relatedEntity: {
        type: "appointment",
        id: appointment._id,
      },
    });

    console.log(
      `Appointment reminder sent to ${patient.email} for appointment ${appointment._id}`
    );
  } catch (error) {
    console.error(
      `Error sending appointment reminder for appointment ${appointment._id}:`,
      error
    );
  }
};

// Function to check and send appointment reminders
export const checkAndSendAppointmentReminders = async () => {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

    // Find appointments that are scheduled between 1-2 hours from now
    // and haven't had a reminder sent yet
    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: oneHourFromNow,
        $lt: twoHoursFromNow,
      },
      status: { $in: ["scheduled", "confirmed"] },
      reminderSent: { $ne: true }, // Only appointments that haven't had reminders sent
    }).populate("patient", "firstName lastName email");

    console.log(`Found ${appointments.length} appointments needing reminders`);

    // Send reminders for each appointment
    for (const appointment of appointments) {
      await sendAppointmentReminder(appointment);

      // Mark reminder as sent
      appointment.reminderSent = true;
      await appointment.save();
    }

    return {
      success: true,
      message: `Processed ${appointments.length} appointment reminders`,
      count: appointments.length,
    };
  } catch (error) {
    console.error("Error checking appointment reminders:", error);
    return {
      success: false,
      message: "Error processing appointment reminders",
      error: error.message,
    };
  }
};

// Manual trigger for appointment reminders (for testing)
export const triggerAppointmentReminders = async (req, res) => {
  try {
    const result = await checkAndSendAppointmentReminders();

    res.json({
      success: result.success,
      message: result.message,
      data: {
        processedCount: result.count,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Manual trigger appointment reminders error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get notification settings for hospital
export const getNotificationSettings = async (req, res) => {
  try {
    const { hospitalName } = req.user;

    // For now, return default settings
    // In the future, this could be stored in a database
    const settings = {
      appointmentReminders: {
        enabled: true,
        sendTime: "1 hour before",
        emailTemplate: "default",
      },
      patientChannels: {
        email: true,
        sms: false,
        push: false,
      },
      staffChannels: {
        announcements: true,
        overcapacityAlerts: true,
        systemUpdates: true,
      },
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get notification settings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req, res) => {
  try {
    const { hospitalName } = req.user;
    const settings = req.body;

    // For now, just return success
    // In the future, this would save to database
    console.log(`Notification settings updated for ${hospitalName}:`, settings);

    res.json({
      success: true,
      message: "Notification settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Update notification settings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Send test notification
export const sendTestNotification = async (req, res) => {
  try {
    const { hospitalName } = req.user;
    const { email, type } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required for test notification",
      });
    }

    let subject, html;

    if (type === "appointment_reminder") {
      subject = "Test Appointment Reminder - Qure System";
      html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Appointment Reminder - ${hospitalName}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                ${hospitalName}
              </h1>
              <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">
                Your Health, Our Priority
              </p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background-color: #dbeafe; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 24px;">📧</span>
                </div>
                <h2 style="color: #1e3a8a; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">
                  Test Email Successful
                </h2>
                <p style="color: #6b7280; font-size: 16px; margin: 0;">
                  Your notification system is working perfectly!
                </p>
              </div>
              
              <!-- Test Details Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                <h3 style="color: #1e3a8a; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">
                  Test Details
                </h3>
                
                <div style="display: grid; gap: 15px;">
                  <div style="display: flex; align-items: center; padding: 12px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #10b981;">
                    <span style="font-size: 18px; margin-right: 12px;">✅</span>
                    <div>
                      <div style="font-weight: 600; color: #1e3a8a; font-size: 14px;">STATUS</div>
                      <div style="color: #374151; font-size: 16px;">Email System Working</div>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: center; padding: 12px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <span style="font-size: 18px; margin-right: 12px;">🏥</span>
                    <div>
                      <div style="font-weight: 600; color: #1e3a8a; font-size: 14px;">HOSPITAL</div>
                      <div style="color: #374151; font-size: 16px;">${hospitalName}</div>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: center; padding: 12px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <span style="font-size: 18px; margin-right: 12px;">📅</span>
                    <div>
                      <div style="font-weight: 600; color: #1e3a8a; font-size: 14px;">SENT AT</div>
                      <div style="color: #374151; font-size: 16px;">${new Date().toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: center; padding: 12px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #8b5cf6;">
                    <span style="font-size: 18px; margin-right: 12px;">🔔</span>
                    <div>
                      <div style="font-weight: 600; color: #1e3a8a; font-size: 14px;">TYPE</div>
                      <div style="color: #374151; font-size: 16px;">Appointment Reminder Test</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Success Message -->
              <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 10px;">🎉</div>
                <h4 style="color: #065f46; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
                  System Ready!
                </h4>
                <p style="color: #065f46; margin: 0; font-size: 16px; font-weight: 500;">
                  Your appointment reminder system is now active and will automatically send reminders to patients.
                </p>
              </div>
              
              <!-- Information -->
              <div style="text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 12px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  This is a test email to verify your notification system is working correctly.
                </p>
                <p style="color: #1e3a8a; font-size: 16px; font-weight: 600; margin: 0;">
                  Thank you for using Qure Healthcare Management System
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
              <p style="color: #e0e7ff; font-size: 12px; margin: 0;">
                This is an automated test message from the Qure system.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = "Test Notification - Qure System";
      html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Notification - ${hospitalName}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                ${hospitalName}
              </h1>
              <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">
                Your Health, Our Priority
              </p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background-color: #dbeafe; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 24px;">🔔</span>
                </div>
                <h2 style="color: #1e3a8a; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">
                  Test Notification
                </h2>
                <p style="color: #6b7280; font-size: 16px; margin: 0;">
                  Your notification system is working perfectly!
                </p>
              </div>
              
              <!-- Test Details Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                <h3 style="color: #1e3a8a; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">
                  Test Details
                </h3>
                
                <div style="display: grid; gap: 15px;">
                  <div style="display: flex; align-items: center; padding: 12px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #10b981;">
                    <span style="font-size: 18px; margin-right: 12px;">✅</span>
                    <div>
                      <div style="font-weight: 600; color: #1e3a8a; font-size: 14px;">STATUS</div>
                      <div style="color: #374151; font-size: 16px;">Notification System Working</div>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: center; padding: 12px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <span style="font-size: 18px; margin-right: 12px;">🏥</span>
                    <div>
                      <div style="font-weight: 600; color: #1e3a8a; font-size: 14px;">HOSPITAL</div>
                      <div style="color: #374151; font-size: 16px;">${hospitalName}</div>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: center; padding: 12px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <span style="font-size: 18px; margin-right: 12px;">📅</span>
                    <div>
                      <div style="font-weight: 600; color: #1e3a8a; font-size: 14px;">SENT AT</div>
                      <div style="color: #374151; font-size: 16px;">${new Date().toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Success Message -->
              <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 10px;">🎉</div>
                <h4 style="color: #065f46; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
                  System Ready!
                </h4>
                <p style="color: #065f46; margin: 0; font-size: 16px; font-weight: 500;">
                  Your notification system is now active and ready to send notifications.
                </p>
              </div>
              
              <!-- Information -->
              <div style="text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 12px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  This is a test notification to verify your system is working correctly.
                </p>
                <p style="color: #1e3a8a; font-size: 16px; font-weight: 600; margin: 0;">
                  Thank you for using Qure Healthcare Management System
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
              <p style="color: #e0e7ff; font-size: 12px; margin: 0;">
                This is an automated test message from the Qure system.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    await sendEmail({
      to: email,
      subject: subject,
      html: html,
    });

    res.json({
      success: true,
      message: "Test notification sent successfully",
    });
  } catch (error) {
    console.error("Send test notification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Setup cron job for appointment reminders (runs every 30 minutes)
export const setupAppointmentReminderCron = () => {
  // Run every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("Running appointment reminder check...");
    const result = await checkAndSendAppointmentReminders();
    console.log("Appointment reminder check completed:", result);
  });

  console.log("Appointment reminder cron job scheduled (every 30 minutes)");
};
