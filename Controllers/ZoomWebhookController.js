const crypto = require('crypto');
const InterviewService = require('../services/InterviewService');

class ZoomWebhookController {
    /**
     * Handle Zoom Webhooks
     */
    static async handleWebhook(req, res) {
        console.log("--- Zoom Webhook Received ---");
        console.log("Event:", req.body.event);
        console.log("Full Body:", JSON.stringify(req.body, null, 2));
        
        try {
            const event = req.body.event;
            const payload = req.body.payload;

            // 1. Handle URL Validation (Zoom challenge)
            if (event === 'endpoint.url_validation') {
                const plainToken = payload.plainToken;
                const secretToken = process.env.ZOOM_SECRET_TOEKN; // Get from .env

                const hash = crypto
                    .createHmac('sha256', secretToken)
                    .update(plainToken)
                    .digest('hex');

                return res.status(200).json({
                    plainToken: plainToken,
                    encryptedToken: hash
                });
            }

            // 2. Handle Recording Completed
            if (event === 'recording.completed') {
                const meetingId = payload.object.id.toString();
                const recordingFiles = payload.object.recording_files || [];
                
                // Find video and transcript URLs
                const videoFile = recordingFiles.find(f => f.file_type === 'MP4');
                const transcriptFile = recordingFiles.find(f => f.recording_type === 'audio_transcript' || f.file_extension === 'VTT');

                const updateData = {
                    status: 'completed'
                };

                if (videoFile) {
                    updateData.recording_url = videoFile.download_url;
                }
                
                if (transcriptFile) {
                    updateData.transcript_url = transcriptFile.download_url;
                }

                // Update DB
                await InterviewService.updateInterviewByMeetingId(meetingId, updateData);

                console.log(`Zoom Webhook: Recording saved for meeting ${meetingId}`);
            }

            // Always respond with 200 for other events
            return res.status(200).json({ success: true });

        } catch (error) {
            console.error("Zoom Webhook Error:", error.message);
            // Still return 200 to Zoom to avoid retries if the error is on our side
            return res.status(200).json({ success: false, message: error.message });
        }
    }
}

module.exports = ZoomWebhookController;
