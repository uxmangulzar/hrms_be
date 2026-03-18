const ApplicationService = require("../services/ApplicationService");
const JobService = require("../services/JobService");
const ResumeService = require("../services/ResumeService");
const MailService = require("../services/MailService");
const AssessmentService = require("../services/AssessmentService");
const path = require("path");
class ApplicationController {
    /**
     * Submit Application
     * Public Route
     */
    static async submit(req, res) {
        try {
            const { 
                job_id, 
                full_name, 
                email, 
                phone, 
                location, 
                resume_metadata, 
                metadata 
            } = req.body;
            // Check if job exists and is active
            const job = await JobService.getJobById(null, job_id);
            if (!job) {
                return res.status(404).json({ success: false, message: "Job not found" });
            }
            if (!job_id || !full_name || !email) {
                return res.status(400).json({ success: false, message: "Required fields missing" });
            }
            // Check if already applied (by email or phone for this job)
            const hasApplied = await ApplicationService.checkExistingApplication(job_id, email, phone);
            if (hasApplied) {
                return res.status(400).json({ 
                    success: false, 
                    message: "You have already applied for this job with this email or phone number." 
                });
            }
            // Handle standard file upload (Multer)
            if (!req.file) {
                return res.status(400).json({ success: false, message: "Resume is required" });
            }
            // Automatically parse resume details
            const parsedData = await ResumeService.parseResume(req.file.path);
            const resume_url = `/uploads/resumes/${req.file.filename}`;
            
            const applicationData = {
                job_id,
                full_name,
                email,
                phone,
                location,
                resume_url,
                resume_metadata: {
                    ...parsedData,
                    ...(typeof resume_metadata === 'string' ? JSON.parse(resume_metadata) : (resume_metadata || {}))
                },
                metadata: typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {})
            };
            const result = await ApplicationService.submitApplication(applicationData);
            
            return res.status(201).json({ 
                success: true, 
                message: "Application submitted successfully", 
                data: result 
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Get Applications for a Job
     * Protected Route
     */
    static async getJobApplications(req, res) {
        try {
            const { job_id } = req.params;
            const company_id = req.user.company_id;
            const { search, status, location, experience, expected_salary, page, limit } = req.query;
            const response = await ApplicationService.getApplicationsByJob(job_id, company_id, { 
                search, status, location, experience, expected_salary, page, limit 
            });
            return res.status(200).json({ success: true, ...response });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Get Application Details
     * Protected Route
     */
    static async getApplicationDetails(req, res) {
        try {
            const { id } = req.params;
            const company_id = req.user.company_id;
            const application = await ApplicationService.getApplicationById(id, company_id);
            if (!application) {
                return res.status(404).json({ success: false, message: "Application not found" });
            }
            return res.status(200).json({ success: true, data: application });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Update Application Status
     * Protected Route (Admin only)
     * PATCH /api/applications/:id/status
     */
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const company_id = req.user.company_id;

            // Allowed statuses (from DB ENUM)
            const ALLOWED_STATUSES = ['applied', 'screening', 'shortlisted', 'interview_scheduled', 'rejected', 'hired'];

            if (!status) {
                return res.status(400).json({ success: false, message: "status is required" });
            }
            if (!ALLOWED_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`
                });
            }

            // Verify application belongs to this company
            const application = await ApplicationService.getApplicationById(id, company_id);
            if (!application) {
                return res.status(404).json({ success: false, message: "Application not found or unauthorized" });
            }

            await ApplicationService.updateStatus(id, status);

            return res.status(200).json({
                success: true,
                message: `Application status updated to '${status}'`,
                data: { application_id: parseInt(id), status }
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
module.exports = ApplicationController;
