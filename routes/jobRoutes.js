const express = require("express");
const router = express.Router();
const JobController = require("../Controllers/JobController");
const { authenticate, authorize } = require("../middleware/AuthMiddleware");
/**
 * @route POST /api/jobs/create
 * @desc Create a new job post
 * @access Private (Company Admin)
 */
router.post("/create", authenticate, authorize(['company_admin']), JobController.createJob);
/**
 * @route GET /api/jobs
 * @desc Get all jobs for the company
 * @access Private
 */
router.get("/", authenticate, JobController.getJobs);
/**
 * @route GET /api/jobs/:id
 * @desc Get details of a single job
 * @access Private
 */
router.get("/:id", authenticate, JobController.getJobById);
/**
 * @route GET /api/jobs/:id/share-whatsapp
 * @desc Get WhatsApp share URL for a specific job
 * @access Private
 */
router.get("/:id/share-whatsapp", authenticate, JobController.getWhatsAppUrl);
module.exports = router;
