const { mySqlQury } = require("../database/db");

class SettingService {
    /**
     * Get all settings (Admin use)
     * @param {number|null} companyId - Optional company ID to filter
     */
    static async getAllSettings(companyId = null) {
        try {
            const sql = companyId 
                ? "SELECT * FROM settings WHERE company_id = ? OR company_id IS NULL ORDER BY company_id DESC, setting_key ASC" 
                : "SELECT * FROM settings WHERE company_id IS NULL ORDER BY setting_key ASC";
            
            const params = companyId ? [companyId] : [];
            return await mySqlQury(sql, params);
        } catch (error) {
            console.error("Error in SettingService.getAllSettings:", error.message);
            throw error;
        }
    }

    /**
     * Get all active settings
     * @param {number|null} companyId 
     */
    static async getActiveSettings(companyId = null) {
        try {
            // If companyId is provided, get company settings and fallback to global if not exists
            // This is complex for a single query, so we usually fetch and merge or use a priority query
            const sql = companyId 
                ? "SELECT * FROM settings WHERE status = 'active' AND (company_id = ? OR company_id IS NULL)" 
                : "SELECT * FROM settings WHERE status = 'active' AND company_id IS NULL";
            
            const params = companyId ? [companyId] : [];
            const settings = await mySqlQury(sql, params);
            
            if (companyId) {
                // Merge logic: company settings override global settings
                const merged = {};
                settings.forEach(s => {
                    if (!merged[s.setting_key] || s.company_id !== null) {
                        merged[s.setting_key] = s;
                    }
                });
                return Object.values(merged);
            }
            
            return settings;
        } catch (error) {
            console.error("Error in SettingService.getActiveSettings:", error.message);
            throw error;
        }
    }

    /**
     * Get a specific setting by key
     * @param {string} key 
     * @param {number|null} companyId
     */
    static async getSettingByKey(key, companyId = null) {
        try {
            // Find company specific first, then fallback to global
            const sql = companyId 
                ? "SELECT * FROM settings WHERE setting_key = ? AND status = 'active' AND (company_id = ? OR company_id IS NULL) ORDER BY company_id DESC LIMIT 1"
                : "SELECT * FROM settings WHERE setting_key = ? AND status = 'active' AND company_id IS NULL LIMIT 1";
            
            const params = companyId ? [key, companyId] : [key];
            const settings = await mySqlQury(sql, params);
            return settings.length > 0 ? settings[0] : null;
        } catch (error) {
            console.error(`Error in SettingService.getSettingByKey for key ${key}:`, error.message);
            throw error;
        }
    }

    /**
     * Create or Update a setting
     */
    static async upsertSetting(data) {
        const { company_id, setting_key, setting_value, status = 'active' } = data;
        try {
            // Check if exists
            const checkSql = "SELECT id FROM settings WHERE setting_key = ? AND (company_id = ? OR (company_id IS NULL AND ? IS NULL))";
            const existing = await mySqlQury(checkSql, [setting_key, company_id, company_id]);

            if (existing.length > 0) {
                // Update
                const updateSql = "UPDATE settings SET setting_value = ?, status = ? WHERE id = ?";
                return await mySqlQury(updateSql, [setting_value, status, existing[0].id]);
            } else {
                // Insert
                const insertSql = "INSERT INTO settings (company_id, setting_key, setting_value, status) VALUES (?, ?, ?, ?)";
                return await mySqlQury(insertSql, [company_id, setting_key, setting_value, status]);
            }
        } catch (error) {
            console.error("Error in SettingService.upsertSetting:", error.message);
            throw error;
        }
    }

    /**
     * Delete a setting
     */
    static async deleteSetting(id, companyId = null) {
        try {
            const sql = companyId 
                ? "DELETE FROM settings WHERE id = ? AND company_id = ?" 
                : "DELETE FROM settings WHERE id = ? AND company_id IS NULL";
            const params = companyId ? [id, companyId] : [id];
            return await mySqlQury(sql, params);
        } catch (error) {
            console.error("Error in SettingService.deleteSetting:", error.message);
            throw error;
        }
    }

    /**
     * Toggle setting status
     */
    static async toggleStatus(id, companyId = null) {
        try {
            const checkSql = companyId 
                ? "SELECT status FROM settings WHERE id = ? AND company_id = ?" 
                : "SELECT status FROM settings WHERE id = ? AND company_id IS NULL";
            const params = companyId ? [id, companyId] : [id];
            
            const result = await mySqlQury(checkSql, params);
            if (result.length === 0) return null;

            const newStatus = result[0].status === 'active' ? 'inactive' : 'active';
            const updateSql = "UPDATE settings SET status = ? WHERE id = ?";
            await mySqlQury(updateSql, [newStatus, id]);
            return newStatus;
        } catch (error) {
            console.error("Error in SettingService.toggleStatus:", error.message);
            throw error;
        }
    }
}

module.exports = SettingService;