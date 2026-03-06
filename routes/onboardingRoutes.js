const express = require("express");
const router = express.Router();
const OnboardingController = require("../Controllers/OnboardingController");
const { authenticate, authorize } = require("../middleware/AuthMiddleware");
// Route to get available plans
router.get("/plans", authenticate, OnboardingController.getPlans);
// Route to get current onboarding status
router.get("/status", authenticate, OnboardingController.getStatus);
// Step 1: Select Plan
router.post("/select-plan", authenticate, authorize(['company_admin']), OnboardingController.selectPlan);
// Step 2: Setup Wizard (Complete Setup)
router.post("/setup-wizard", authenticate, authorize(['company_admin']), OnboardingController.setupWizard);
module.exports = router;