const nodemailer = require("nodemailer");
class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            // port: process.env.SMTP_PORT || 587,
            // secure: process.env.SMTP_SECURE === "false", // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    /**
     * Send password reset email with images
     * @param {string} to 
     * @param {string} resetLink 
     */
    async sendForgotPasswordEmail(to, resetLink) {
        try {
            const mailOptions = {
                from: `"HRMS Support" <${process.env.SMTP_USER}>`,
                to: to,
                subject: "Password Reset Request",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img src="cid:logo" alt="HRMS Logo" style="width: 150px; height: auto;" />
                        </div>
                        <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
                        <p>Hi,</p>
                        <p>We received a request to reset your password. Click the button below to choose a new one:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                        </div>
                        <p>If you didn't request this, you can safely ignore this email.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <div style="text-align: center; color: #777; font-size: 12px;">
                            <p>&copy; 2024 HRMS Management System. All rights reserved.</p>
                            <img src="cid:footer_banner" alt="Footer Banner" style="width: 100%; max-width: 600px; height: auto; margin-top: 10px; border-radius: 5px;" />
                        </div>
                    </div>
                `,
                attachments: [
                    {
                        filename: 'logo.png',
                        path: 'https://placehold.co/200x100?text=HRMS+LOGO', // Placeholder image
                        cid: 'logo' 
                    },
                    {
                        filename: 'footer.png',
                        path: 'https://placehold.co/600x150?text=Professional+HR+Management', // Placeholder banner
                        cid: 'footer_banner'
                    }
                ]
            };
            const info = await this.transporter.sendMail(mailOptions);
            console.log("Email sent: %s", info.messageId);
            return info;
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    }
    /**
     * Send assessment link to candidate
     * @param {string} to - Candidate email
     * @param {Object} data - { full_name, role_title, company_name, assessmentLink }
     */
    async sendAssessmentEmail(to, data) {
        const { full_name, role_title, company_name, assessmentLink } = data;
        try {
            const mailOptions = {
                from: `"HRMS Assessment" <${process.env.SMTP_USER}>`,
                to: to,
                subject: `Assessment for ${role_title} at ${company_name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #333; text-align: center;">Job Application Assessment</h2>
                        <p>Hi ${full_name},</p>
                        <p>Thank you for applying for the <strong>${role_title}</strong> position at <strong>${company_name}</strong>.</p>
                        <p>To move forward in the selection process, please complete the initial assessment by clicking the button below:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${assessmentLink}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Start Assessment</a>
                        </div>
                        <p>This assessment helps us understand your skills better. Please try to complete it as soon as possible.</p>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #555; background: #f9f9f9; padding: 10px; border-radius: 5px;">${assessmentLink}</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <div style="text-align: center; color: #777; font-size: 12px;">
                            <p>&copy; 2024 ${company_name} via HRMS. All rights reserved.</p>
                        </div>
                    </div>
                `
            };
            const info = await this.transporter.sendMail(mailOptions);
            console.log("Assessment Email sent: %s", info.messageId);
            return info;
        } catch (error) {
            console.error("Error sending assessment email:", error);
            // Don't throw if email fails, just log it so application submission doesn't break
        }
    }
}
module.exports = new MailService();
