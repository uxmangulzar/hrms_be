
const fs = require('fs');
const { PDFParse } = require('pdf-parse'); // pdf-parse v2 usage
const mammoth = require('mammoth');
const path = require('path');
class ResumeService {
    /**
     * Parse Resume (PDF or DOCX)
     */
    static async parseResume(filePath) {
        console.log(`[ResumeService] Parsing file: ${filePath}`);
        let parser = null;
        try {
            if (!fs.existsSync(filePath)) {
                console.error("[ResumeService] File not found:", filePath);
                return {};
            }
            const ext = path.extname(filePath).toLowerCase();
            let parsedResult = {};
            if (ext === '.pdf') {
                const dataBuffer = fs.readFileSync(filePath);
                // v2 API: use PDFParse class
                parser = new PDFParse({ data: dataBuffer });
                const data = await parser.getText();
                const infoResult = await parser.getInfo();
                
                parsedResult = {
                    file_type: 'pdf',
                    pages: infoResult.total || 0,
                    text: data.text ? data.text.substring(0, 10000) : ""
                };
            } else if (ext === '.docx' || ext === '.doc') {
                const data = await mammoth.extractRawText({ path: filePath });
                parsedResult = {
                    file_type: 'docx',
                    text: data.value ? data.value.substring(0, 10000) : ""
                };
            } else {
                console.log("[ResumeService] Unsupported file extension:", ext);
            }
            // Basic Entity Extraction (Email, Phone) from extracted text
            if (parsedResult.text) {
                const emailMatch = parsedResult.text.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
                const phoneMatch = parsedResult.text.match(/(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
                
                parsedResult.extracted_email = emailMatch ? emailMatch[0] : null;
                parsedResult.extracted_phone = phoneMatch ? phoneMatch[0] : null;
            }
            console.log("[ResumeService] Parsing complete. Text length:", parsedResult.text?.length || 0);
            return parsedResult;
        } catch (error) {
            console.error("[ResumeService] Parsing Error:", error.message);
            return {};
        } finally {
            if (parser && typeof parser.destroy === 'function') {
                await parser.destroy();
            }
        }
    }
}
module.exports = ResumeService;