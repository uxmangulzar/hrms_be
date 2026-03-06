const express = require("express");
const router = express.Router();
const AssessmentController = require("../Controllers/AssessmentController");
const authMiddleware = require("../middleware/AuthMiddleware"); // Fixed filename
// ADMIN ROUTES (Protected)
router.post("/schedule", authMiddleware.authenticate, AssessmentController.schedule);
router.post("/questions", authMiddleware.authenticate, AssessmentController.saveQuestions);
router.get("/questions/:job_id", authMiddleware.authenticate, AssessmentController.getQuestions);
// CANDIDATE ROUTES (Public - Secured by schedule_id/token logic in controller)
router.get("/candidate/:schedule_id", AssessmentController.getAssessmentForCandidate);
router.post("/start/:schedule_id", AssessmentController.startAssessment);
router.post("/submit/:schedule_id", AssessmentController.submitAssessment);
module.exports = router;