const { mySqlQury } = require("../database/db");

class InterviewService {
    /**
     * Save scheduled interview details
     */
    static async saveInterview(data) {
        const {
            application_id,
            company_id,
            zoom_meeting_id,
            topic,
            start_time,
            duration,
            join_url,
            start_url
        } = data;

        try {
            const sql = `
                INSERT INTO interviews (
                    application_id, company_id, zoom_meeting_id, 
                    topic, start_time, duration, join_url, start_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const result = await mySqlQury(sql, [
                application_id, company_id, zoom_meeting_id, 
                topic, start_time, duration, join_url, start_url
            ]);
            return result.insertId;
        } catch (error) {
            console.error("Error in InterviewService.saveInterview:", error.message);
            throw error;
        }
    }

    /**
     * Update interview details (e.g., recording URL, status)
     */
    static async updateInterviewByMeetingId(meetingId, updateData) {
        try {
            const fields = [];
            const params = [];
            
            Object.keys(updateData).forEach(key => {
                fields.push(`${key} = ?`);
                params.push(updateData[key]);
            });

            if (fields.length === 0) return;

            const sql = `UPDATE interviews SET ${fields.join(", ")} WHERE zoom_meeting_id = ?`;
            params.push(meetingId);

            return await mySqlQury(sql, params);
        } catch (error) {
            console.error("Error in InterviewService.updateInterviewByMeetingId:", error.message);
            throw error;
        }
    }

    /**
     * Get interview details by Zoom Meeting ID
     */
    static async getInterviewByMeetingId(meetingId) {
        try {
            const sql = "SELECT * FROM interviews WHERE zoom_meeting_id = ? LIMIT 1";
            const result = await mySqlQury(sql, [meetingId]);
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error("Error in InterviewService.getInterviewByMeetingId:", error.message);
            throw error;
        }
    }
}

module.exports = InterviewService;
