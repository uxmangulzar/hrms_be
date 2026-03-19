const nodemailer = require("nodemailer");
const SettingService = require("./SettingService");

class MailService {
    /**
     * Get transporter for a specific company or global default
     */
    async getTransporter(companyId = null) {
        // Try to fetch company specific SMTP settings
        const hostSet = await SettingService.getSettingByKey('smtp_host', companyId);
        const portSet = await SettingService.getSettingByKey('smtp_port', companyId);
        const userSet = await SettingService.getSettingByKey('smtp_user', companyId);
        const passSet = await SettingService.getSettingByKey('smtp_pass', companyId);

        const config = {
            host: hostSet ? hostSet.setting_value : (process.env.SMTP_HOST || "smtp.gmail.com"),
            port: portSet ? parseInt(portSet.setting_value) : (parseInt(process.env.SMTP_PORT) || 587),
            auth: {
                user: userSet ? userSet.setting_value : process.env.SMTP_USER,
                pass: passSet ? passSet.setting_value : process.env.SMTP_PASS,
            }
        };

        return nodemailer.createTransport(config);
    }

    /**
     * Send password reset email with images
     */
    async sendForgotPasswordEmail(to, resetLink) {
        try {
            const transporter = await this.getTransporter(); // Uses global settings
            const fromEmail = process.env.SMTP_USER;
            const mailOptions = {
                from: `"HRMS Support" <${fromEmail}>`,
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
                        path: 'https://placehold.co/200x100?text=HRMS+LOGO',
                        cid: 'logo' 
                    },
                    {
                        filename: 'footer.png',
                        path: 'https://placehold.co/600x150?text=Professional+HR+Management',
                        cid: 'footer_banner'
                    }
                ]
            };
            const info = await transporter.sendMail(mailOptions);
            return info;
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    }

    /**
     * Send assessment link to candidate
     * @param {string} to - Candidate email
     * @param {Object} data - { full_name, role_title, company_name, assessmentLink, company_id }
     */
    async sendAssessmentEmail(to, data) {
        const { full_name, role_title, company_name, assessmentLink, company_id } = data;
        try {
            const transporter = await this.getTransporter(company_id);
            const userSet = await SettingService.getSettingByKey('smtp_user', company_id);
            const fromEmail = userSet ? userSet.setting_value : process.env.SMTP_USER;

            const mailOptions = {
                from: `"${company_name} Assessment" <${fromEmail}>`,
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
            const info = await transporter.sendMail(mailOptions);
            return info;
        } catch (error) {
            console.error("Error sending assessment email:", error);
        }
    }

    /**
     * Send interview invitation email with Zoom link
     * @param {string} to - Candidate email
     * @param {Object} data - { full_name, role_title, company_name, meeting_link, scheduled_at, duration, company_id }
     */
    async sendInterviewEmail(to, data) {
        const { full_name, role_title, company_name, meeting_link, scheduled_at, duration, company_id } = data;
        const formattedDate = new Date(scheduled_at).toLocaleString();
        try {
            const transporter = await this.getTransporter(company_id);
            const userSet = await SettingService.getSettingByKey('smtp_user', company_id);
            const fromEmail = userSet ? userSet.setting_value : process.env.SMTP_USER;

            const mailOptions = {
                from: `"${company_name} Recruitment" <${fromEmail}>`,
                to: to,
                subject: `Interview Invitation: ${role_title} at ${company_name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #007bff; text-align: center;">Interview Invitation</h2>
                        <p>Hi ${full_name},</p>
                        <p>We are pleased to invite you for an interview for the <strong>${role_title}</strong> position at <strong>${company_name}</strong>.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formattedDate}</p>
                            <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration} minutes</p>
                            <p style="margin: 5px 0;"><strong>Format:</strong> Video Call (Zoom)</p>
                        </div>
                        
                        <p>Please join the meeting using the button below at the scheduled time:</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${meeting_link}" style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Join Zoom Meeting</a>
                        </div>
                        
                        <p>If you have any issues joining, please reply to this email.</p>
                        
                        <p>Best regards,<br>The Recruitment Team<br>${company_name}</p>
                        
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <div style="text-align: center; color: #777; font-size: 11px;">
                            <p>Powered by HRMS Management System</p>
                        </div>
                    </div>
                `
            };
            const info = await transporter.sendMail(mailOptions);
            return info;
        } catch (error) {
            console.error("Error sending interview email:", error);
        }
    }
    /**
     * Send interview invitation email to Interviewer
     * @param {string} to - Interviewer email
     * @param {Object} data - { interviewer_name, candidate_name, role_title, company_name, start_url, scheduled_at, duration, company_id }
     */
    async sendInterviewerEmail(to, data) {
        const { interviewer_name, candidate_name, role_title, company_name, start_url, scheduled_at, duration, company_id } = data;
        const formattedDate = new Date(scheduled_at).toLocaleString();
        try {
            const transporter = await this.getTransporter(company_id);
            const userSet = await SettingService.getSettingByKey('smtp_user', company_id);
            const fromEmail = userSet ? userSet.setting_value : process.env.SMTP_USER;

            const mailOptions = {
                from: `"${company_name} Recruitment" <${fromEmail}>`,
                to: to,
                subject: `Interview Assignment: ${candidate_name} for ${role_title}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #444; text-align: center;">Interview Invitation (Interviewer)</h2>
                        <p>Hi ${interviewer_name},</p>
                        <p>You have been assigned as the <strong>Interviewer</strong> for the following candidate:</p>
                        
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Candidate:</strong> ${candidate_name}</p>
                            <p style="margin: 5px 0;"><strong>Position:</strong> ${role_title}</p>
                            <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formattedDate}</p>
                            <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration} minutes</p>
                        </div>
                        
                        <p>Please use the <strong>Start URL</strong> below to host the meeting as the owner/host:</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${start_url}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Start Meeting (Host)</a>
                        </div>
                        
                        <p><strong>Note:</strong> Recording and transcription are enabled for this session.</p>
                        
                        <p>Best regards,<br>${company_name} HR Team</p>
                    </div>
                `
            };
            const info = await transporter.sendMail(mailOptions);
            return info;
        } catch (error) {
            console.error("Error sending interviewer email:", error);
        }
    }
    /**
     * Send offer letter email to candidate
     * @param {string} to - Candidate email
     * @param {Object} data - { full_name, role_title, company_name, salary, joining_date, respondLink, pdfPath, company_id }
     */
    async sendOfferLetterEmail(to, data) {
        const { full_name, role_title, company_name, salary, joining_date, respondLink, pdfPath, company_id } = data;
        const formattedDate = new Date(joining_date).toLocaleDateString();
        try {
            const transporter = await this.getTransporter(company_id);
            const userSet = await SettingService.getSettingByKey('smtp_user', company_id);
            const fromEmail = userSet ? userSet.setting_value : process.env.SMTP_USER;

            const mailOptions = {
                from: `"${company_name} Recruitment" <${fromEmail}>`,
                to: to,
                subject: `Job Offer: ${role_title} Position at ${company_name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 25px; border-radius: 10px;">
                        <h2 style="color: #28a745; text-align: center;">Congratulations!</h2>
                        <p>Hi ${full_name},</p>
                        <p>We are pleased to offer you the position of <strong>${role_title}</strong> at <strong>${company_name}</strong>.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 25px 0; border-left: 5px solid #28a745;">
                            <p style="margin: 5px 0;"><strong>Position:</strong> ${role_title}</p>
                            <p style="margin: 5px 0;"><strong>Salary:</strong> ${salary}</p>
                            <p style="margin: 5px 0;"><strong>Expected Joining Date:</strong> ${formattedDate}</p>
                        </div>
                        
                        <p>Please find the official <strong>Offer Letter PDF attached</strong> to this email. You can download it, sign it, and then upload it while accepting the offer at the link below:</p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${respondLink}" style="background-color: #28a745; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">View & Respond to Offer</a>
                        </div>
                        
                        <p>If you have any questions before accepting, feel free to reply to this email.</p>
                        
                        <p>Best regards,<br>The Recruitment Team<br><strong>${company_name}</strong></p>
                        
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;" />
                        <div style="text-align: center; color: #777; font-size: 11px;">
                            <p>Powered by HRMS Management System</p>
                        </div>
                    </div>
                `,
                attachments: pdfPath ? [{
                    filename: `OfferLetter_${full_name.replace(/ /g, '_')}.pdf`,
                    path: pdfPath
                }] : []
            };
            const info = await transporter.sendMail(mailOptions);
            return info;
        } catch (error) {
            console.error("Error sending offer letter email:", error);
        }
    }
    /**
     * Send login credentials to new employee
     * @param {string} to - Employee email
     * @param {Object} data - { full_name, username, password, company_name, login_url, company_id }
     */
    async sendEmployeeCredentialsEmail(to, data) {
        const { full_name, username, password, company_name, login_url, company_id } = data;
        try {
            const transporter = await this.getTransporter(company_id);
            const userSet = await SettingService.getSettingByKey('smtp_user', company_id);
            const fromEmail = userSet ? userSet.setting_value : process.env.SMTP_USER;

            const mailOptions = {
                from: `"${company_name} HR" <${fromEmail}>`,
                to: to,
                subject: `Welcome to ${company_name} - Your Employee Credentials`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 25px; border-radius: 10px;">
                        <h2 style="color: #007bff; text-align: center;">Welcome to the Team!</h2>
                        <p>Hi ${full_name},</p>
                        <p>We are excited to have you join <strong>${company_name}</strong>. Your employee account has been created successfully.</p>
                        
                        <p>You can now log in to the HRMS portal using the following credentials:</p>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 25px 0; border: 1px dashed #007bff;">
                            <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="${login_url}">${login_url}</a></p>
                            <p style="margin: 5px 0;"><strong>Username:</strong> ${username}</p>
                            <p style="margin: 10px 0 5px 0;"><strong>Temporary Password:</strong></p>
                            <p style="background: #fff; padding: 10px; border: 1px solid #ddd; font-family: monospace; font-size: 18px; text-align: center; color: #d9534f; font-weight: bold;">${password}</p>
                        </div>
                        
                        <p style="color: #666; font-size: 13px;"><em>Note: For security reasons, please change your password immediately after your first login.</em></p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${login_url}" style="background-color: #007bff; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">Log In Now</a>
                        </div>
                        
                        <p>Best regards,<br>The HR Team at <strong>${company_name}</strong></p>
                        
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;" />
                        <div style="text-align: center; color: #777; font-size: 11px;">
                            <p>Powered by HRMS Management System</p>
                        </div>
                    </div>
                `
            };
            const info = await transporter.sendMail(mailOptions);
            return info;
        } catch (error) {
            console.error("Error sending credentials email:", error);
        }
    }
}
module.exports = new MailService();
