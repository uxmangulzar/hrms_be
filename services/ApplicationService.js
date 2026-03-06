const { mySqlQury } = require("../database/db");
class ApplicationService {
    /**
     * Submit a new job application
     */
    static async submitApplication(applicationData) {
        const {
            job_id,
            full_name,
            email,
            phone,
            location,
            resume_url,
            resume_metadata = {},
            metadata = {}
        } = applicationData;
        const sql = `
            INSERT INTO applications (
                job_id, full_name, email, phone, location, 
                resume_url, resume_metadata, metadata, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            job_id,
            full_name,
            email,
            phone,
            location,
            resume_url,
            JSON.stringify(resume_metadata),
            JSON.stringify(metadata),
            'applied'
        ];
        const result = await mySqlQury(sql, values);
        
        return {
            id: result.insertId,
            ...applicationData,
            status: 'applied'
        };
    }
    /**
     * Get applications for a specific job (Admin/Company side)
     */
    static async getApplicationsByJob(jobId, companyId, options = {}) {
        const { search, page = 1, limit = 10 } = options;
        const offset = (page - 1) * limit;
        // Base query for counting total matches
        let countSql = `
            SELECT COUNT(*) as total 
            FROM applications a 
            JOIN jobs j ON a.job_id = j.id
            WHERE a.job_id = ? AND j.company_id = ?
        `;
        let sql = `
            SELECT a.id, a.job_id, a.full_name, a.email, a.phone, a.metadata, a.location, a.resume_url, a.status, a.applied_at AS applied_at 
            FROM applications a 
            JOIN jobs j ON a.job_id = j.id
            WHERE a.job_id = ? AND j.company_id = ?
        `;
        const params = [jobId, companyId];
        const countParams = [jobId, companyId];
        // Search Filter
        if (search) {
            const searchPattern = `%${search}%`;
            const searchFilter = " AND (a.full_name LIKE ? OR a.email LIKE ? OR a.phone LIKE ?)";
            sql += searchFilter;
            countSql += searchFilter;
            params.push(searchPattern, searchPattern, searchPattern);
            countParams.push(searchPattern, searchPattern, searchPattern);
        }
        // Sorting, Pagination
        sql += " ORDER BY a.applied_at DESC LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));
        // Execute both queries
        const [applications, countResult] = await Promise.all([
            mySqlQury(sql, params),
            mySqlQury(countSql, countParams)
        ]);
        const total = countResult[0].total;
        return {
            applications: applications.map(app => ({
                ...app,
                metadata: typeof app.metadata === 'string' ? JSON.parse(app.metadata) : app.metadata
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
     * Get application details by ID
     */
    static async getApplicationById(id, companyId) {
        const sql = `
            SELECT a.*, j.role_title FROM applications a 
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = ? AND j.company_id = ?
        `;
        
        const result = await mySqlQury(sql, [id, companyId]);
        if (result.length === 0) return null;
        const app = result[0];
        return {
            ...app,
            resume_metadata: typeof app.resume_metadata === 'string' ? JSON.parse(app.resume_metadata) : app.resume_metadata,
            metadata: typeof app.metadata === 'string' ? JSON.parse(app.metadata) : app.metadata
        };
    }
    /**
     * Check if application already exists for this email and job
     */
    static async checkExistingApplication(job_id, email) {
        const sql = "SELECT id FROM applications WHERE job_id = ? AND email = ?";
        const result = await mySqlQury(sql, [job_id, email]);
        return result.length > 0;
    }
    /**
     * Update application status
     */
    static async updateStatus(id, status) {
        const sql = "UPDATE applications SET status = ? WHERE id = ?";
        return await mySqlQury(sql, [status, id]);
    }
}
module.exports = ApplicationService;
