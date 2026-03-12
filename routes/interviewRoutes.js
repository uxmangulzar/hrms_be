const express = require("express");
const router = express.Router();
const InterviewController = require("../Controllers/InterviewController");
const { authenticate, authorize } = require("../middleware/AuthMiddleware");

/**
 * @route POST /api/interviews/schedule
 * @desc Schedule a Zoom meeting for a candidate
 * @access Private (Company Admin)
 */
router.post("/schedule", authenticate, authorize(['company_admin']), InterviewController.scheduleInterview);

/**
 * @route POST /api/interviews/signature
 * @desc Generate Zoom SDK signature for Web Embedding
 * @access Private
 */
router.post("/signature", authenticate, InterviewController.getMeetingSignature);

module.exports = router;
