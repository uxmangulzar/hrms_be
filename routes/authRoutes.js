const express = require("express");
const router = express.Router();
const AuthController = require("../Controllers/AuthController");
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.post("/logout", AuthController.logout);
module.exports = router;