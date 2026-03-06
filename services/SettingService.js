const { mySqlQury } = require("../database/db");
class SettingService {
    /**
     * Get all active settings from the settings table
     * @returns {Promise<Array>} List of active settings
     */
    static async getActiveSettings() {
        try {
            const sql = "SELECT * FROM settings WHERE status = 'active'";
            const settings = await mySqlQury(sql);
            return settings;
        } catch (error) {
            console.error("Error in SettingService.getActiveSettings:", error.message);
            throw error;
        }
    }
    /**
     * Get a specific setting by key
     * @param {string} key 
     * @returns {Promise<Object|null>}
     */
    static async getSettingByKey(key) {
        try {
            const sql = "SELECT * FROM settings WHERE setting_key = ? AND status = 'active' LIMIT 1";
            const settings = await mySqlQury(sql, [key]);
            return settings.length > 0 ? settings[0] : null;
        } catch (error) {
            console.error(`Error in SettingService.getSettingByKey for key ${key}:`, error.message);
            throw error;
        }
    }
}
module.exports = SettingService;