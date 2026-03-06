const { mySqlQury } = require("../database/db");
class AssessmentService {
    /**
     * Get assessment questions for a job
     */
    static async getAssessmentByJob(jobId) {
        const sql = "SELECT * FROM assessment_questions WHERE job_id = ? AND status = 'active'";
        const result = await mySqlQury(sql, [jobId]);
        
        if (result.length === 0) return null;
        
        const assessment = result[0];
        return {
            ...assessment,
            questions: typeof assessment.questions === 'string' ? JSON.parse(assessment.questions) : assessment.questions
        };
    }
    /**
     * Create or Update assessment questions
     */
    static async saveAssessment(assessmentData) {
        const { job_id, company_id, questions, status = 'active' } = assessmentData;
        
        const sql = "INSERT INTO assessment_questions (job_id, company_id, questions, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE questions = ?, status = ?";
        const result = await mySqlQury(sql, [job_id, company_id, JSON.stringify(questions), status, JSON.stringify(questions), status]);
        return { id: result.insertId || null, job_id, company_id, questions, status };
    }
    /**
     * Schedule an assessment for a candidate
     */
    static async scheduleAssessment(scheduleData) {
        const {
            application_id, job_id, company_id, questions_id,
            scheduled_at, expires_at, duration_minutes, interview_details
        } = scheduleData;
        const sql = `
            INSERT INTO assessment_schedules (
                application_id, job_id, company_id, questions_id, 
                scheduled_at, expires_at, duration_minutes, interview_details, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
        `;
        const result = await mySqlQury(sql, [
            application_id, job_id, company_id, questions_id,
            scheduled_at, expires_at, duration_minutes, interview_details
        ]);
        return { id: result.insertId, ...scheduleData, status: 'scheduled' };
    }
    /**
     * Get schedule by ID
     */
    static async getScheduleById(id) {
        const sql = "SELECT * FROM assessment_schedules WHERE id = ?";
        const result = await mySqlQury(sql, [id]);
        return result.length > 0 ? result[0] : null;
    }
    /**
     * Update schedule (start/complete/status)
     */
    static async updateSchedule(id, updateData) {
        const fields = [];
        const params = [];
        Object.keys(updateData).forEach(key => {
            fields.push(`${key} = ?`);
            params.push(updateData[key]);
        });
        if (fields.length === 0) return;
        const sql = `UPDATE assessment_schedules SET ${fields.join(", ")} WHERE id = ?`;
        params.push(id);
        return await mySqlQury(sql, params);
    }
    /**
     * Save assessment answers
     */
    static async saveResponse(responseData) {
        const { schedule_id, answers, score = 0 } = responseData;
        const sql = "INSERT INTO assessment_responses (schedule_id, answers, score) VALUES (?, ?, ?)";
        const result = await mySqlQury(sql, [schedule_id, JSON.stringify(answers), score]);
        return { id: result.insertId, ...responseData };
    }
}
module.exports = AssessmentService;