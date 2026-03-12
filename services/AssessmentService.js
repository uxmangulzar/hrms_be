const { mySqlQury } = require("../database/db");
// const GeminiService = require('./GeminiService');
const ChatGPTService = require('./ChatGPTService');
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
     * Save assessment answers and evaluate with Gemini
     */
    static async saveResponse(responseData) {
        const { schedule_id, answers } = responseData;

        // 1. Fetch Schedule to get job_id
        const schedule = await this.getScheduleById(schedule_id);
        if (!schedule) {
            throw new Error("Assessment schedule not found");
        }

        // 2. Fetch Questions for this job to help Gemini evaluate
        const assessment = await this.getAssessmentByJob(schedule.job_id);
        const questions = assessment ? assessment.questions : [];

        // 3. Evaluate answers using ChatGPTService with context (questions)
        const { score, feedback } = await ChatGPTService.evaluateAnswers({ 
            questions, 
            answers, 
            company_id: schedule.company_id 
        });

        // 4. Save to Database
        const sql = "INSERT INTO assessment_responses (schedule_id, answers, score, feedback) VALUES (?, ?, ?, ?)";
        const result = await mySqlQury(sql, [schedule_id, JSON.stringify(answers), score, JSON.stringify(feedback)]);
        
        return { id: result.insertId, schedule_id, answers, score, feedback };
    }
    /**
     * Get assessment response by Application ID
     */
    static async getResponseByApplicationId(applicationId) {
        const sql = `
            SELECT r.*, s.status as schedule_status
            FROM assessment_responses r
            JOIN assessment_schedules s ON r.schedule_id = s.id
            WHERE s.application_id = ?
            ORDER BY r.created_at DESC LIMIT 1
        `;
        const result = await mySqlQury(sql, [applicationId]);
        if (result.length === 0) return null;

        const response = result[0];
        return {
            ...response,
            answers: typeof response.answers === 'string' ? JSON.parse(response.answers) : response.answers,
            feedback: typeof response.feedback === 'string' ? JSON.parse(response.feedback) : response.feedback
        };
    }
    /**
     * Admin: Manually Update Assessment Response by Response ID
     * @param {Object} data - { response_id, score, feedback }
     * feedback format: [{ question_id, correct: true/false, comment: "..." }]  <-- same as ChatGPT
     */
    static async updateManualResponse({ response_id, score, feedback }) {
        // Check if response exists
        const checkSql = "SELECT id FROM assessment_responses WHERE id = ?";
        const existing = await mySqlQury(checkSql, [response_id]);

        if (existing.length === 0) {
            throw new Error(`Assessment response not found with id: ${response_id}`);
        }

        const updateSql = `
            UPDATE assessment_responses 
            SET score = ?, feedback = ?
            WHERE id = ?
        `;
        await mySqlQury(updateSql, [
            score,
            JSON.stringify(feedback),
            response_id
        ]);

        return { response_id, score, feedback };
    }
}
module.exports = AssessmentService;