const AssessmentService = require("../services/AssessmentService");
const ApplicationService = require("../services/ApplicationService");
const JobService = require("../services/JobService");
const MailService = require("../services/MailService");
class AssessmentController {
    /**
     * Admin: Schedule Assessment and Send Email
     */
    static async schedule(req, res) {
        try {
            const { 
                application_id, 
                scheduled_at, 
                expires_at, 
                duration_minutes, 
                interview_details 
            } = req.body;
            const company_id = req.user.company_id;
            // 1. Get Application Details to verify
            const application = await ApplicationService.getApplicationById(application_id, company_id);
            if (!application) {
                return res.status(404).json({ success: false, message: "Application not found" });
            }
            // 2. Get Assessment Questions for the Job
            const assessment = await AssessmentService.getAssessmentByJob(application.job_id);
            if (!assessment) {
                return res.status(404).json({ success: false, message: "No assessment questions found for this job. Please create questions first." });
            }
            // 3. Create Schedule
            const schedule = await AssessmentService.scheduleAssessment({
                application_id,
                job_id: application.job_id,
                company_id,
                questions_id: assessment.id,
                scheduled_at,
                expires_at,
                duration_minutes,
                interview_details
            });
            // 4. Update Application Status to 'screening'
            await ApplicationService.updateStatus(application_id, 'screening');
            // 5. Send Email
            const baseUrl = req.get('origin') || `${req.protocol}://${req.get('host')}`;
            const assessmentLink = `${baseUrl}/assessment/${schedule.id}`;
            await MailService.sendAssessmentEmail(application.email, {
                full_name: application.full_name,
                role_title: application.role_title || "Position", 
                company_name: req.user.company_name || "Company",
                assessmentLink,
                company_id: company_id
            });
            return res.status(201).json({ 
                success: true, 
                message: "Assessment scheduled and email sent successfully",
                data: schedule
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Candidate: Get Assessment Details (Verify Link and Time)
     */
    static async getAssessmentForCandidate(req, res) {
        try {
            const { schedule_id } = req.params;
            const schedule = await AssessmentService.getScheduleById(schedule_id);
            if (!schedule) {
                return res.status(404).json({ success: false, message: "Invalid assessment link" });
            }
            const now = new Date();
            const scheduledTime = new Date(schedule.scheduled_at);
            const expiryTime = new Date(schedule.expires_at);
            if (now < scheduledTime) {
                return res.status(403).json({ 
                    success: false, 
                    message: `Assessment is not yet accessible. It will be available at ${schedule.scheduled_at}` 
                });
            }
            if (now > expiryTime) {
                return res.status(403).json({ success: false, message: "Assessment link has expired." });
            }
            if (schedule.status === 'completed') {
                return res.status(403).json({ success: false, message: "Assessment has already been completed." });
            }
            // Get questions
            const assessment = await AssessmentService.getAssessmentByJob(schedule.job_id);
            return res.status(200).json({
                success: true,
                data: {
                    id: schedule.id,
                    duration_minutes: schedule.duration_minutes,
                    status: schedule.status,
                    started_at: schedule.started_at,
                    questions: assessment.questions
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Candidate: Start Assessment
     */
    static async startAssessment(req, res) {
        try {
            const { schedule_id } = req.params;
            const schedule = await AssessmentService.getScheduleById(schedule_id);
            if (!schedule || schedule.status !== 'scheduled') {
                return res.status(400).json({ success: false, message: "Cannot start this assessment" });
            }
            const now = new Date();
            await AssessmentService.updateSchedule(schedule_id, {
                started_at: now,
                status: 'started'
            });
            return res.status(200).json({ success: true, message: "Assessment started", started_at: now });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Candidate: Submit Assessment
     */
    static async submitAssessment(req, res) {
        try {
            const { schedule_id } = req.params;
            const { answers } = req.body;
            const schedule = await AssessmentService.getScheduleById(schedule_id);
            if (!schedule || schedule.status !== 'started') {
                return res.status(400).json({ success: false, message: "Invalid submission or assessment not started" });
            }
            // Mark schedule as completed
            await AssessmentService.updateSchedule(schedule_id, {
                completed_at: new Date(),
                status: 'completed'
            });
            // Save answers
            const response = await AssessmentService.saveResponse({
                schedule_id,
                answers
            });
            return res.status(200).json({ 
                success: true, 
                message: "Assessment submitted successfully",
                data: response
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Admin: Save Assessment Questions
     */
    static async saveQuestions(req, res) {
        try {
            const { job_id, questions, status } = req.body;
            const company_id = req.user.company_id;
            if (!job_id || !questions) {
                return res.status(400).json({ success: false, message: "Job ID and Questions are required" });
            }
            const result = await AssessmentService.saveAssessment({
                job_id,
                company_id,
                questions,
                status
            });
            return res.status(200).json({ success: true, message: "Assessment questions saved", data: result });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Admin: Get Assessment Questions for a Job
     */
    static async getQuestions(req, res) {
        try {
            const { job_id } = req.params;
            const assessment = await AssessmentService.getAssessmentByJob(job_id);
            if (!assessment) {
                return res.status(200).json({ success: true, data: null, message: "No assessment questions configured for this job" });
            }
            return res.status(200).json({ success: true, data: assessment });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Admin/Company: Get Assessment Response by Application ID
     */
    static async getAssessmentResponse(req, res) {
        try {
            const { application_id } = req.params;
            const company_id = req.user.company_id;

            // Optional: verify that the application belongs to this company
            const application = await ApplicationService.getApplicationById(application_id, company_id);
            if (!application) {
                return res.status(404).json({ success: false, message: "Application not found or unauthorized" });
            }

            const response = await AssessmentService.getResponseByApplicationId(application_id);
            if (!response) {
                return res.status(200).json({ success: true, data: null, message: "No assessment response found for this application." });
            }

            return res.status(200).json({ success: true, data: response });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Admin: Manually Update Assessment Response
     * Body: { response_id, score, feedback }
     * feedback: [{ question_id, correct: true/false, comment: "..." }]  <-- same format as ChatGPT
     */
    static async saveManualResponse(req, res) {
        try {
            const { response_id, score, feedback } = req.body;

            // Validate required fields
            if (!response_id || score === undefined || score === null) {
                return res.status(400).json({
                    success: false,
                    message: "response_id and score are required"
                });
            }
            if (!Array.isArray(feedback) || feedback.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "feedback array is required. Format: [{ question_id, correct: true/false, comment: '...' }]"
                });
            }

            const result = await AssessmentService.updateManualResponse({
                response_id,
                score,
                feedback
            });

            return res.status(200).json({
                success: true,
                message: "Assessment response updated successfully",
                data: result
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
module.exports = AssessmentController;
