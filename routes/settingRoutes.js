const express = require("express");
const router = express.Router();
const SettingController = require("../Controllers/SettingController");
const { authenticate, authorize } = require("../middleware/AuthMiddleware");

// Admin Routes (Company Admin or Super Admin)
router.get("/list", authenticate, SettingController.listSettings);
router.post("/save", authenticate, SettingController.saveSetting);
router.delete("/:id", authenticate, SettingController.deleteSetting);
router.patch("/:id/toggle", authenticate, SettingController.toggleStatus);

// Helper Routes (For general app use)
router.get("/active", authenticate, SettingController.getAllActiveSettings);
router.get("/key/:key", authenticate, SettingController.getSettingByKey);

module.exports = router;