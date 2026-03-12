const SettingService = require("../services/SettingService");

class SettingController {
    /**
     * List all settings for current context
     * (Company Admin sees their own + global, Super Admin sees all global)
     */
    static async listSettings(req, res) {
        try {
            const companyId = req.user.role === 'super_admin' ? null : req.user.company_id;
            const settings = await SettingService.getAllSettings(companyId);

            return res.status(200).json({
                success: true,
                message: "Settings retrieved successfully",
                data: settings
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add or Update a setting
     */
    static async saveSetting(req, res) {
        try {
            const { setting_key, setting_value, status } = req.body;
            const companyId = req.user.role === 'super_admin' ? null : req.user.company_id;

            if (!setting_key) {
                return res.status(400).json({ success: false, message: "setting_key is required" });
            }

            const result = await SettingService.upsertSetting({
                company_id: companyId,
                setting_key,
                setting_value,
                status: status || 'active'
            });

            return res.status(200).json({
                success: true,
                message: "Setting saved successfully",
                data: result
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete a setting
     */
    static async deleteSetting(req, res) {
        try {
            const { id } = req.params;
            const companyId = req.user.role === 'super_admin' ? null : req.user.company_id;

            const result = await SettingService.deleteSetting(id, companyId);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Setting not found or unauthorized" });
            }

            return res.status(200).json({
                success: true,
                message: "Setting deleted successfully"
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Toggle status (active/inactive)
     */
    static async toggleStatus(req, res) {
        try {
            const { id } = req.params;
            const companyId = req.user.role === 'super_admin' ? null : req.user.company_id;

            const newStatus = await SettingService.toggleStatus(id, companyId);

            if (!newStatus) {
                return res.status(404).json({ success: false, message: "Setting not found or unauthorized" });
            }

            return res.status(200).json({
                success: true,
                message: `Setting status changed to ${newStatus}`,
                data: { status: newStatus }
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Legacy support/Helper: Get active settings for frontend
     */
    static async getAllActiveSettings(req, res) {
        try {
            const companyId = req.user ? req.user.company_id : null;
            const settings = await SettingService.getActiveSettings(companyId);
            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Legacy support/Helper: Get setting by key
     */
    static async getSettingByKey(req, res) {
        try {
            const { key } = req.params;
            const companyId = req.user ? req.user.company_id : null;
            const setting = await SettingService.getSettingByKey(key, companyId);
            
            if (!setting) {
                return res.status(404).json({ success: false, message: "Setting not found" });
            }

            return res.status(200).json({
                success: true,
                data: setting
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = SettingController;