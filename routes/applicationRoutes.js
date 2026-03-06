const express = require("express");
const router = express.Router();
const ApplicationController = require("../Controllers/ApplicationController");
const { authenticate, authorize } = require("../middleware/AuthMiddleware");
const { upload } = require("../middleware/UploadMiddleware");
/**
 * @route POST /api/applications/submit
 * @desc Public route to submit a job application
 * @access Public
 */
router.post("/submit", upload.single("resume"), ApplicationController.submit);
/**
 * @route GET /api/applications/job/:job_id
 * @desc Get all applications for a specific job
 * @access Private (Company Admin)
 */
router.get("/job/:job_id", authenticate, authorize(['company_admin']), ApplicationController.getJobApplications);
/**
 * @route GET /api/applications/:id
 * @desc Get specific application details
 * @access Private
 */
router.get("/:id", authenticate, ApplicationController.getApplicationDetails);
module.exports = router;