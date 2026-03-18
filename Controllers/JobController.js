const JobService = require("../services/JobService");
class JobController {
    /**
     * Helper to generate WhatsApp Share URL
     */
    static generateWhatsAppUrl(job, baseUrl) {
        // Use baseUrl from request if available, otherwise fallback to env or default
        const portalUrl = baseUrl || process.env.FRONTEND_URL || "https://hrms-portal.com";
        const applyLink = `${portalUrl}/jobs/${job.id}`;
        
        // Using Unicode escapes for emojis: 
        // 🚀 = \u{1F680}, 📍 = \u{1F4CD}, 💼 = \u{1F4BC}, 💰 = \u{1F4B0}, 🏢 = \u{1F3E2}
        const message = encodeURIComponent(
            `*Hiring Alert!* \u{1F680}\n\n` +
            `*Company:* ${job.company_name || 'Our Company'}\n` +
            `We are looking for a *${job.role_title}*.\n\n` +
            `\u{1F4CD} Location: ${job.location}\n` +
            `\u{1F4BC} Experience: ${job.experience}\n` +
            `\u{1F4B0} Budget: ${job.budget}\n` +
            `\u{1F3E2} Mode: ${job.work_mode}\n\n` +
            `Click here to apply: \n${applyLink}`
        );
        return `https://wa.me/?text=${message}`;
    }
    /**
     * Create a new job
     */
    static async createJob(req, res) {
        try {
            const company_id = req.user.company_id;
            const jobData = req.body;
            // Basic Validation
            const { role, weight_config } = jobData;
            if (!role) {
                return res.status(400).json({ success: false, message: "Job role/title is required" });
            }
            // Validate weights if provided
            if (weight_config) {
                const totalWeight = (Number(weight_config.form) || 0) + 
                                  (Number(weight_config.video) || 0) + 
                                  (Number(weight_config.technical) || 0);
                
                if (totalWeight !== 100) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Total assessment weight must be 100%. Current total: ${totalWeight}%` 
                    });
                }
            }
            const result = await JobService.createJob(company_id, jobData);
            
            // Generate base URL from request headers
            const baseUrl = req.get('origin') || `${req.protocol}://${req.get('host')}`;
            // Add WhatsApp URL to response
            const responseData = {
                ...result,
                whatsapp_share_url: JobController.generateWhatsAppUrl(result, baseUrl)
            };
            return res.status(201).json({ 
                success: true, 
                message: "Job created successfully", 
                data: responseData 
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Get all jobs for the logged in company with filters and pagination
     */
    static async getJobs(req, res) {
        try {
            const company_id = req.user.company_id;
            const { search, status, work_mode, page, limit } = req.query;
            const result = await JobService.getJobsByCompany(company_id, {
                search,
                status,
                work_mode,
                page: page || 1,
                limit: limit || 10
            });
            // Generate base URL from request headers
            const baseUrl = req.get('origin') || `${req.protocol}://${req.get('host')}`;
            return res.status(200).json({ 
                success: true, 
                data: result.jobs.map(job => ({
                    ...job,
                    whatsapp_share_url: JobController.generateWhatsAppUrl(job, baseUrl)
                })),
                pagination: result.pagination 
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Get single job by ID
     */
    static async getJobById(req, res) {
        try {
            const company_id = req.user.company_id;
            const { id } = req.params;
            
            const job = await JobService.getJobById(company_id, id);
            if (!job) {
                return res.status(404).json({ success: false, message: "Job not found" });
            }
            // Generate base URL from request headers
            const baseUrl = req.get('origin') || `${req.protocol}://${req.get('host')}`;
            // Add WhatsApp share URL
            job.whatsapp_share_url = JobController.generateWhatsAppUrl(job, baseUrl);
            return res.status(200).json({ success: true, data: job });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Get only the WhatsApp share URL for a specific job
     */
    static async getWhatsAppUrl(req, res) {
        try {
            const company_id = req.user.company_id;
            const { id } = req.params;
            
            const job = await JobService.getJobById(company_id, id);
            if (!job) {
                return res.status(404).json({ success: false, message: "Job not found" });
            }
            // Generate base URL from request headers
            const baseUrl = req.get('origin') || `${req.protocol}://${req.get('host')}`;
            const whatsapp_url = JobController.generateWhatsAppUrl(job, baseUrl);
            return res.status(200).json({ 
                success: true, 
                data: { whatsapp_url } 
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Update an existing job
     */
    static async updateJob(req, res) {
        try {
            const company_id = req.user.company_id;
            const { id } = req.params;
            const jobData = req.body;

            // Check if job exists
            const existingJob = await JobService.getJobById(company_id, id);
            if (!existingJob) {
                return res.status(404).json({ success: false, message: "Job not found" });
            }

            // Validate weights if provided in weight_config
            if (jobData.weight_config) {
                const form = jobData.weight_config.form !== undefined ? Number(jobData.weight_config.form) : Number(existingJob.form_weight);
                const video = jobData.weight_config.video !== undefined ? Number(jobData.weight_config.video) : Number(existingJob.video_weight);
                const technical = jobData.weight_config.technical !== undefined ? Number(jobData.weight_config.technical) : Number(existingJob.technical_weight);
                
                const totalWeight = form + video + technical;
                
                if (totalWeight !== 100) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Total assessment weight must be 100%. Current total: ${totalWeight}%` 
                    });
                }
            }

            const result = await JobService.updateJob(company_id, id, jobData);
            const baseUrl = req.get('origin') || `${req.protocol}://${req.get('host')}`;
            const responseData = {
                ...result,
                whatsapp_share_url: JobController.generateWhatsAppUrl(result, baseUrl)
            };

            return res.status(200).json({ 
                success: true, 
                message: "Job updated successfully", 
                data: responseData 
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
module.exports = JobController;