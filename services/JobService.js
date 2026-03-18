const { mySqlQury } = require("../database/db");
class JobService {
    /**
     * Create a new job post
     */
    static async createJob(companyId, jobData) {
        const {
            role,
            budget,
            skills,
            location,
            experience,
            remote_onsite,
            assessment_format,
            stage_mode,
            weight_config,
            status = 'active'
        } = jobData;
        const sql = `
            INSERT INTO jobs (
                company_id, role_title, budget, skills, location, experience, 
                work_mode, assessment_format, stage_mode, 
                form_weight, video_weight, technical_weight, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            companyId,
            role,
            budget,
            JSON.stringify(skills || []),
            location,
            experience,
            remote_onsite,
            assessment_format,
            stage_mode,
            weight_config?.form || 0,
            weight_config?.video || 0,
            weight_config?.technical || 0,
            status
        ];
        const result = await mySqlQury(sql, values);
        
        // Fetch the newly created job with company name
        return await this.getJobById(companyId, result.insertId);
    }
    /**
     * Get all jobs for a specific company with filtering, search and pagination
     */
    static async getJobsByCompany(companyId, options = {}) {
        const { 
            search, 
            status, 
            work_mode, 
            page = 1, 
            limit = 10 
        } = options;
        let sql = "SELECT j.*, c.name as company_name, (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as application_count FROM jobs j JOIN companies c ON j.company_id = c.id WHERE j.company_id = ?";
        let countSql = "SELECT COUNT(*) as total FROM jobs j WHERE j.company_id = ?";
        const params = [companyId];
        const countParams = [companyId];
        // Search Filter
        if (search) {
            const searchPattern = `%${search}%`;
            sql += " AND (j.role_title LIKE ? OR j.location LIKE ?)";
            countSql += " AND (j.role_title LIKE ? OR j.location LIKE ?)";
            params.push(searchPattern, searchPattern);
            countParams.push(searchPattern, searchPattern);
        }
        // Status Filter
        if (status) {
            sql += " AND j.status = ?";
            countSql += " AND j.status = ?";
            params.push(status);
            countParams.push(status);
        }
        // Work Mode Filter
        if (work_mode) {
            sql += " AND j.work_mode = ?";
            countSql += " AND j.work_mode = ?";
            params.push(work_mode);
            countParams.push(work_mode);
        }
        // Sorting
        sql += " ORDER BY j.created_at DESC";
        // Pagination
        const offset = (page - 1) * limit;
        sql += " LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));
        // Execute both queries
        const [jobs, countResult] = await Promise.all([
            mySqlQury(sql, params),
            mySqlQury(countSql, countParams)
        ]);
        const total = countResult[0].total;
        
        return {
            jobs: jobs.map(job => ({
                ...job,
                skills: typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills
            })),
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Get single job details
     */
    static async getJobById(companyId, jobId) {
        let sql = "SELECT j.*, c.name as company_name FROM jobs j JOIN companies c ON j.company_id = c.id WHERE j.id = ?";
        const params = [jobId];
        if (companyId) {
            sql += " AND j.company_id = ?";
            params.push(companyId);
        }
        const result = await mySqlQury(sql, params);
        
        if (result.length === 0) return null;
        const job = result[0];
        return {
            ...job,
            skills: typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills
        };
    }
    /**
     * Update an existing job post
     */
    static async updateJob(companyId, jobId, jobData) {
        const fields = [];
        const params = [];

        // Map incoming fields to DB columns
        const mapping = {
            role: 'role_title',
            budget: 'budget',
            skills: 'skills',
            location: 'location',
            experience: 'experience',
            remote_onsite: 'work_mode',
            assessment_format: 'assessment_format',
            stage_mode: 'stage_mode',
            status: 'status'
        };

        Object.keys(mapping).forEach(key => {
            if (jobData[key] !== undefined) {
                fields.push(`${mapping[key]} = ?`);
                params.push(key === 'skills' ? JSON.stringify(jobData[key]) : jobData[key]);
            }
        });

        // Handle weights separately if they exist in weight_config
        if (jobData.weight_config) {
            const { form, video, technical } = jobData.weight_config;
            if (form !== undefined) { fields.push("form_weight = ?"); params.push(form); }
            if (video !== undefined) { fields.push("video_weight = ?"); params.push(video); }
            if (technical !== undefined) { fields.push("technical_weight = ?"); params.push(technical); }
        }

        if (fields.length === 0) return await this.getJobById(companyId, jobId);

        const sql = `UPDATE jobs SET ${fields.join(", ")} WHERE id = ? AND company_id = ?`;
        params.push(jobId, companyId);

        await mySqlQury(sql, params);
        return await this.getJobById(companyId, jobId);
    }
}
module.exports = JobService;