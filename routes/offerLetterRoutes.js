const express = require("express");
const router = express.Router();
const OfferLetterController = require("../Controllers/OfferLetterController");
const authMiddleware = require("../middleware/AuthMiddleware");
const { offerUpload } = require("../middleware/UploadMiddleware");

/**
 * ADMIN ROUTES (Protected)
 */
// 1. Send Offer Letter to candidate
router.post("/send", authMiddleware.authenticate, authMiddleware.authorize(['company_admin']), OfferLetterController.sendOffer);

// 2. Check Offer Status by Application ID
router.get("/status/:application_id", authMiddleware.authenticate, authMiddleware.authorize(['company_admin']), OfferLetterController.getOfferStatus);

/**
 * PUBLIC / CANDIDATE ROUTES (via secure token)
 */
// 3. Get Offer Details by Token (View Offer page)
router.get("/details/:token", OfferLetterController.getOfferDetails);

// 4. Respond to Offer (Accept/Reject button)
// Accept action will allow uploading signed document
router.post("/respond/:token", offerUpload.single('signed_file'), OfferLetterController.respondToOffer);

module.exports = router;
