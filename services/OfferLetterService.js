const { mySqlQury } = require("../database/db");
const crypto = require("crypto");
const html_to_pdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');

class OfferLetterService {
    /**
     * Generate PDF Offer Letter
     */
    static async generateOfferPDF(data) {
        const { full_name, role, salary, joining_date, company_name } = data;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 50px; line-height: 1.6; color: #333; }
                    .header { text-align: center; margin-bottom: 50px; }
                    .company-name { font-size: 24px; font-weight: bold; color: #28a745; }
                    .title { font-size: 28px; font-weight: bold; border-bottom: 2px solid #28a745; padding-bottom: 10px; margin-bottom: 30px; }
                    .content { margin-bottom: 30px; }
                    .details-box { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0; }
                    .footer { margin-top: 50px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; text-align: center; }
                    .signature-area { margin-top: 60px; display: flex; justify-content: space-between; }
                    .signature-line { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">${company_name}</div>
                    <p>Employment Offer Letter</p>
                </div>

                <div class="title">OFFER LETTER</div>

                <div class="content">
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                    <p>To,<br><strong>${full_name}</strong></p>

                    <p>Dear ${full_name},</p>
                    <p>Following our recent discussions, we are pleased to offer you the position of <strong>${role}</strong> at <strong>${company_name}</strong>. We are excited about the potential you bring to our team.</p>

                    <div class="details-box">
                        <p><strong>Position:</strong> ${role}</p>
                        <p><strong>Proposed Salary:</strong> ${salary}</p>
                        <p><strong>Joining Date:</strong> ${new Date(joining_date).toLocaleDateString()}</p>
                    </div>

                    <p>By signing this letter, you confirm your acceptance of this offer under the terms discussed. Please sign and return a copy of this letter by uploading it through the candidate portal.</p>

                    <p>Welcome to the team!</p>
                </div>

                <div class="signature-area">
                    <div>
                        <div class="signature-line">Authorized Signatory</div>
                        <p>${company_name}</p>
                    </div>
                    <div>
                        <div class="signature-line">Candidate Signature</div>
                        <p>${full_name}</p>
                    </div>
                </div>

                <div class="footer">
                    This is a computer-generated offer letter from ${company_name} HR Management System.
                </div>
            </body>
            </html>
        `;

        const filename = `OfferLetter_${full_name.replace(/ /g, '_')}_${Date.now()}.pdf`;
        const filepath = path.join(__dirname, '../uploads/offer_letters', filename);
        
        const options = { format: 'A4' };
        const file = { content: htmlContent };

        return new Promise((resolve, reject) => {
            html_to_pdf.generatePdf(file, options).then(pdfBuffer => {
                fs.writeFileSync(filepath, pdfBuffer);
                resolve({
                    filename,
                    filepath,
                    relative_url: `/uploads/offer_letters/${filename}`
                });
            }).catch(err => reject(err));
        });
    }

    /**
     * Create and record a new offer letter
     */
    static async createOfferLetter(data) {
        const {
            application_id, company_id, role, salary, joining_date, additional_notes, full_name, company_name
        } = data;

        // 1. Generate PDF first
        const pdfResult = await this.generateOfferPDF({ full_name, role, salary, joining_date, company_name });

        // 2. Generate token
        const response_token = crypto.randomBytes(32).toString('hex');
        const token_expires_at = new Date();
        token_expires_at.setDate(token_expires_at.getDate() + 7);

        const sql = `
            INSERT INTO offer_letters (
                application_id, company_id, role, salary, joining_date, 
                additional_notes, response_token, token_expires_at, offer_letter_url, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent')
        `;

        const result = await mySqlQury(sql, [
            application_id, company_id, role, salary, joining_date,
            additional_notes, response_token, token_expires_at, pdfResult.relative_url
        ]);

        return {
            id: result.insertId,
            response_token,
            token_expires_at,
            offer_letter_url: pdfResult.relative_url,
            pdf_abs_path: pdfResult.filepath,
            status: 'sent',
            ...data
        };
    }

    /**
     * Get offer details by token (Public check)
     */
    static async getOfferByToken(token) {
        const sql = `
            SELECT ol.*, a.full_name, a.email, j.company_id 
            FROM offer_letters ol
            JOIN applications a ON ol.application_id = a.id
            JOIN jobs j ON a.job_id = j.id
            WHERE ol.response_token = ?
        `;
        const result = await mySqlQury(sql, [token]);
        return result.length > 0 ? result[0] : null;
    }

    /**
     * Get offer details by Application ID
     */
    static async getOfferByApplicationId(applicationId, companyId) {
        const sql = "SELECT * FROM offer_letters WHERE application_id = ? AND company_id = ?";
        const result = await mySqlQury(sql, [applicationId, companyId]);
        return result.length > 0 ? result[0] : null;
    }

    /**
     * Respond to an offer (Candidate side)
     */
    static async respondToOffer(token, action, signed_document_url = null) {
        const now = new Date();
        const sql = `
            UPDATE offer_letters 
            SET status = ?, responded_at = ?, signed_document_url = ?
            WHERE response_token = ? AND token_expires_at > ? AND status = 'sent'
        `;
        const result = await mySqlQury(sql, [action, now, signed_document_url, token, now]);
        return result.affectedRows > 0;
    }
}

module.exports = OfferLetterService;
