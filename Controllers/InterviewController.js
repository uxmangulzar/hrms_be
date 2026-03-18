const ApplicationService = require("../services/ApplicationService");
const ZoomService = require("../services/ZoomService");
const MailService = require("../services/MailService");
const InterviewService = require("../services/InterviewService");

class InterviewController {
    /**
     * Schedule Zoom Meeting and Notify Candidate
     * Protected Route (Admin Only)
     */
    static async scheduleInterview(req, res) {
        try {
            const { 
                application_id, 
                start_time, 
                duration, 
                topic, 
                timezone,
                interviewer_name,
                interviewer_email 
            } = req.body;

            const company_id = req.user.company_id;
            const company_name = req.user.company_name || 'Our Company';

            if (!application_id || !start_time || !duration || !interviewer_email || !interviewer_name) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Missing required fields: application_id, start_time, duration, interviewer_name, interviewer_email" 
                });
            }

            // 1. Fetch Application & Candidate Details
            const application = await ApplicationService.getApplicationById(application_id, company_id);
            if (!application) {
                return res.status(404).json({ success: false, message: "Application not found or unauthorized" });
            }

            // 2. Create Zoom Meeting with Recording/Transcript enabled (handled by service)
            const zoomMeeting = await ZoomService.createMeeting({
                topic: topic || `Interview: ${application.full_name} - ${application.role_title}`,
                start_time: new Date(start_time).toISOString(),
                duration: duration,
                timezone: timezone || 'UTC',
                company_id: company_id
            });

            // 3. Save Interview details to DB
            await InterviewService.saveInterview({
                application_id,
                company_id,
                zoom_meeting_id: zoomMeeting.id.toString(),
                topic: zoomMeeting.topic,
                start_time: new Date(zoomMeeting.start_time),
                duration: duration,
                join_url: zoomMeeting.join_url,
                start_url: zoomMeeting.start_url
            });

            // 4. Update Application Status
            await ApplicationService.updateStatus(application_id, 'shortlisted');

            // 4. Send Email to Candidate
            await MailService.sendInterviewEmail(application.email, {
                full_name: application.full_name,
                role_title: application.role_title,
                company_name: company_name,
                meeting_link: zoomMeeting.join_url, // Candidate joins via join_url
                scheduled_at: start_time,
                duration: duration,
                company_id: company_id
            });

            // 5. Send Email to Interviewer (Meeting Owner/Host)
            await MailService.sendInterviewerEmail(interviewer_email, {
                interviewer_name,
                candidate_name: application.full_name,
                role_title: application.role_title,
                company_name: company_name,
                start_url: zoomMeeting.start_url, // Interviewer joins via start_url to be host
                scheduled_at: start_time,
                duration: duration,
                company_id: company_id
            });

            return res.status(200).json({
                success: true,
                message: "Interview scheduled. Emails sent to Candidate and Interviewer.",
                data: {
                    meeting_id: zoomMeeting.id,
                    join_url: zoomMeeting.join_url,
                    start_url: zoomMeeting.start_url,
                    scheduled_at: zoomMeeting.start_time
                }
            });

        } catch (error) {
            console.error("Interview Schedule Error:", error.message);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Generate Signature for Zoom Web SDK
     * Protected Route
     */
    static async getMeetingSignature(req, res) {
        try {
            const { meeting_number, role } = req.body; // role: 0 for participant, 1 for host
            const company_id = req.user.company_id;

            if (!meeting_number) {
                return res.status(400).json({ success: false, message: "Meeting number is required" });
            }

            const { signature, sdkKey } = await ZoomService.generateSDKSignature(meeting_number, role || 0, company_id);

            return res.status(200).json({
                success: true,
                signature: signature,
                sdk_key: sdkKey
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = InterviewController;
