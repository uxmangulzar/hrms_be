const OnboardingService = require("../services/OnboardingService");
class OnboardingController {
    /**
     * Get available plans
     */
    static async getPlans(req, res) {
        try {
            const plans = await OnboardingService.getPlans();
            return res.status(200).json({ success: true, data: plans });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Step 1: Select Plan
     */
    static async selectPlan(req, res) {
        try {
            const { plan_id } = req.body;
            const company_id = req.user.company_id;
            if (!plan_id) {
                return res.status(400).json({ success: false, message: "Plan ID is required" });
            }
            // await OnboardingService.selectPlan(company_id, plan_id);
            // return res.status(200).json({ success: true, message: "Plan selected successfully" });
            const result = await OnboardingService.selectPlan(company_id, plan_id);
            return res.status(200).json({ success: true, message: "Plan selected successfully", data: result });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Step 2: Setup Wizard (Complete Setup)
     */
    static async setupWizard(req, res) {
        try {
            const company_id = req.user.company_id;
            const setupData = req.body; // Expects departments, roles, working_hours, leave_rules, company_rules
            if (!setupData || Object.keys(setupData).length === 0) {
                return res.status(400).json({ success: false, message: "Setup data is required" });
            }
            const result = await OnboardingService.setupWizard(company_id, setupData);
            return res.status(200).json({ success: true, message: "Onboarding Wizard setup successfully", data: result });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Get current status of onboarding
     */
    static async getStatus(req, res) {
        try {
            const company_id = req.user.company_id;
            const status = await OnboardingService.getOnboardingStatus(company_id);
            return res.status(200).json({ success: true, data: status });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
module.exports = OnboardingController;
