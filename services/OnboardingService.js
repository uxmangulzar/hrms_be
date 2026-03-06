const { promisePool, mySqlQury } = require("../database/db");
class OnboardingService {
    /**
     * Get all available subscriptions plans
     */
    static async getPlans() {
        return await mySqlQury("SELECT * FROM plans WHERE status = 'active'");
    }
    /**
     * Step 1: Select Plan
     */
    static async selectPlan(companyId, planId) {
        const sql = "UPDATE companies SET plan_id = ?, onboarding_step = 'wizard_setup' WHERE id = ?";
        // return await mySqlQury(sql, [planId, companyId]);
        await mySqlQury(sql, [planId, companyId]);
        
        // Fetch and return the updated company data
        return await this.getOnboardingStatus(companyId);
    }
    /**
     * Step 2: Setup Wizard Batch (Departments, Roles, Working Hours, Leave Rules, Rules/Configs)
     */
    static async setupWizard(companyId, setupData) {
        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();
            const { departments, roles, working_hours, leave_rules, company_rules } = setupData;
            // 1. Departments Setup
            if (departments?.length > 0) {
                const deptValues = departments.map(d => [companyId, d.name]);
                await connection.query("INSERT INTO departments (company_id, name) VALUES ?", [deptValues]);
            }
            // 2. Roles Setup
            if (roles?.length > 0) {
                const roleValues = roles.map(r => [companyId, r.name, JSON.stringify(r.permissions || {})]);
                await connection.query("INSERT INTO roles (company_id, name, permissions) VALUES ?", [roleValues]);
            }
            // 3. Working Hours Setup
            if (working_hours?.length > 0) {
                const whValues = working_hours.map(w => [
                    companyId, w.day_of_week, w.start_time, w.end_time, 
                    w.grace_period_minutes || 0, w.is_off_day || false
                ]);
                await connection.query("INSERT INTO working_hours (company_id, day_of_week, start_time, end_time, grace_period_minutes, is_off_day) VALUES ?", [whValues]);
            }
            // 4. Leave Rules Setup
            if (leave_rules?.length > 0) {
                const lrValues = leave_rules.map(l => [companyId, l.leave_type, l.count_per_year, l.is_paid || true]);
                await connection.query("INSERT INTO leave_rules (company_id, leave_type, count_per_year, is_paid) VALUES ?", [lrValues]);
            }
            // 5. Company Rules & Thresholds Setup (Late, Interview weights, AI, Warning)
            if (company_rules?.length > 0) {
                const crValues = company_rules.map(c => [companyId, c.rule_type, c.rule_key, JSON.stringify(c.rule_value)]);
                await connection.query("INSERT INTO company_rules (company_id, rule_type, rule_key, rule_value) VALUES ?", [crValues]);
            }
            // Mark wizard as completed
            await connection.query(
                "UPDATE companies SET onboarding_step = 'completed', onboarding_completed_at = CURRENT_TIMESTAMP WHERE id = ?", 
                [companyId]
            );
            await connection.commit();
            // return { success: true, message: "Onboarding Wizard setup successfully" };
            
            // Fetch updated status
            return await this.getOnboardingStatus(companyId);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    /**
     * Check current onboarding status
     */
    static async getOnboardingStatus(companyId) {
        const sql = "SELECT onboarding_step, is_onboarding, plan_id FROM companies WHERE id = ?";
        const result = await mySqlQury(sql, [companyId]);
        return result.length > 0 ? result[0] : null;
    }
}
module.exports = OnboardingService;
