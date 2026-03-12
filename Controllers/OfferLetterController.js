const OfferLetterService = require("../services/OfferLetterService");
const ApplicationService = require("../services/ApplicationService");
const MailService = require("../services/MailService");

class OfferLetterController {
    /**
     * Admin: Create and Send Offer Letter
     */
    static async sendOffer(req, res) {
        try {
            const { 
                application_id, 
                role, 
                salary, 
                joining_date, 
                additional_notes 
            } = req.body;
            const company_id = req.user.company_id;
            const company_name = req.user.company_name || "The Company";

            // 1. Verify existence of the application
            const application = await ApplicationService.getApplicationById(application_id, company_id);
            if (!application) {
                return res.status(404).json({ success: false, message: "Application not found" });
            }

            // 2. Create unique offer record in DB and generate PDF
            const offer = await OfferLetterService.createOfferLetter({
                application_id,
                company_id,
                role: role || application.role_title,
                salary,
                joining_date,
                additional_notes,
                full_name: application.full_name,
                company_name
            });

            // 3. Generate direct response link for candidate
            const baseUrl = req.get('origin') || `${req.protocol}://${req.get('host')}`;
            const respondLink = `${baseUrl}/offer/${offer.response_token}`;

            // 4. Send email with congratulations and PDF attachment
            await MailService.sendOfferLetterEmail(application.email, {
                full_name: application.full_name,
                role_title: offer.role,
                company_name,
                salary: offer.salary,
                joining_date: offer.joining_date,
                respondLink,
                pdfPath: offer.pdf_abs_path,
                company_id: company_id
            });

            return res.status(201).json({ 
                success: true, 
                message: "Offer letter generated and sent via email.",
                data: offer
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Candidate: View Offer Details (Public Link via Token)
     */
    static async getOfferDetails(req, res) {
        try {
            const { token } = req.params;
            const offer = await OfferLetterService.getOfferByToken(token);

            if (!offer) {
                return res.status(404).json({ success: false, message: "Invalid or non-existent offer link." });
            }

            // Expiry check
            const now = new Date();
            const expiry = new Date(offer.token_expires_at);
            if (now > expiry) {
                return res.status(403).json({ success: false, message: "This offer link has expired." });
            }

            if (offer.status !== 'sent') {
                return res.status(403).json({ success: false, message: `Offer has already been ${offer.status}.` });
            }

            return res.status(200).json({
                success: true,
                data: {
                    id: offer.id,
                    application_id: offer.application_id,
                    role: offer.role,
                    salary: offer.salary,
                    joining_date: offer.joining_date,
                    additional_notes: offer.additional_notes,
                    status: offer.status,
                    candidate_name: offer.full_name,
                    company_name: offer.company_name
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Candidate: Accept or Reject Offer
     */
    static async respondToOffer(req, res) {
        try {
            const { token } = req.params;
            const { action } = req.body; // 'accepted' or 'rejected'
            let signed_document_url = null;

            if (!['accepted', 'rejected'].includes(action)) {
                return res.status(400).json({ success: false, message: "Action must be 'accepted' or 'rejected'." });
            }

            // Handle file upload if accepted
            if (action === 'accepted') {
                if (!req.file) {
                    return res.status(400).json({ success: false, message: "Please upload the signed offer letter to proceed with acceptance." });
                }
                signed_document_url = `/uploads/offer_letters/${req.file.filename}`;
            }

            const success = await OfferLetterService.respondToOffer(token, action, signed_document_url);
            if (!success) {
                return res.status(400).json({ success: false, message: "Unable to respond to this offer. It may have expired or already responded to." });
            }

            // Retrieve offer details to update the application status
            const offer = await OfferLetterService.getOfferByToken(token);
            if (offer) {
                const appStatus = action === 'accepted' ? 'hired' : 'rejected';
                await ApplicationService.updateStatus(offer.application_id, appStatus);
            }

            return res.status(200).json({ 
                success: true, 
                message: `Offer successfully ${action}.`
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Admin: Get Offer Status for an Application
     */
    static async getOfferStatus(req, res) {
        try {
            const { application_id } = req.params;
            const company_id = req.user.company_id;

            const offer = await OfferLetterService.getOfferByApplicationId(application_id, company_id);
            if (!offer) {
                return res.status(404).json({ success: false, message: "No offer found for this application." });
            }

            return res.status(200).json({ success: true, data: offer });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = OfferLetterController;
