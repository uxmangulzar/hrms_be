const SettingService = require("../services/SettingService");
class SettingController {
    /**
     * Get all active settings
     */
    static async getAllActiveSettings(req, res) {
        try {
            const settings = await SettingService.getActiveSettings();
            return res.status(200).json({
                success: true,
                message: "Active settings retrieved successfully",
                data: settings
            });
        } catch (error) {
            console.error("Error in SettingController.getAllActiveSettings:", error.message);
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve settings",
                error: error.message
            });
        }
    }
    /**
     * Get setting by key
     */
    static async getSettingByKey(req, res) {
        try {
            const { key } = req.params;
            if (!key) {
                return res.status(400).json({
                    success: false,
                    message: "Setting key is required"
                });
            }
            const setting = await SettingService.getSettingByKey(key);
            
            if (!setting) {
                return res.status(404).json({
                    success: true, // Returning success true but data null is also a pattern, or you can use false
                    message: `Setting with key '${key}' not found or inactive`,
                    data: null
                });
            }
            return res.status(200).json({
                success: true,
                message: "Setting retrieved successfully",
                data: setting
            });
        } catch (error) {
            console.error(`Error in SettingController.getSettingByKey:`, error.message);
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve setting",
                error: error.message
            });
        }
    }
}
module.exports = SettingController;