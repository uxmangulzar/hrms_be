const express = require("express");
const router = express.Router();
const SettingController = require("../Controllers/SettingController");
// Route to get all active settings
router.get("/active", SettingController.getAllActiveSettings);
// Route to get a setting by its key
router.get("/key/:key", SettingController.getSettingByKey);
module.exports = router;