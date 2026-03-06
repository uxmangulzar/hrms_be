const AuthService = require("../services/AuthService");
const MailService = require("../services/MailService");
class AuthController {
    /**
     * Company Registration (Signup)
     */
    static async register(req, res) {
        try {
            const { company_name, username, email, password, weburl, size } = req.body;
            
            // Validation
            if (!company_name || !username || !email || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Company name, username, email and password are required" 
                });
            }
            // Check if user already exists
            const existingUser = await AuthService.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Email already registered" });
            }
            const result = await AuthService.register({ company_name, username, email, password });
            
            res.status(201).json({
                success: true,
                message: "Company and Admin user registered successfully",
                data: result
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * User Login
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ success: false, message: "Email and password are required" });
            }
            const data = await AuthService.login(email, password);
            
            res.status(200).json({
                success: true,
                message: "Login successful",
                data: data
            });
        } catch (error) {
            res.status(401).json({ success: false, message: error.message });
        }
    }
    /**
     * Forgot Password (Placeholder for email logic)
     */
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const user = await AuthService.findByEmail(email);
            
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            // In a real app, you would generate a token and save it to the DB
            const resetLink = `http://localhost:3000/reset-password?userId=${user.id}`; // Example link
            // Send email using MailService
            await MailService.sendForgotPasswordEmail(email, resetLink);
            res.status(200).json({
                success: true,
                message: "Password reset instructions sent to email successfully"
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Reset Password
     */
    static async resetPassword(req, res) {
        try {
            const { userId, newPassword } = req.body; // In real app, verify reset token
            await AuthService.updatePassword(userId, newPassword);
            
            res.status(200).json({
                success: true,
                message: "Password reset successful"
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Sign Out
     */
    static async logout(req, res) {
        // Since JWT is stateless, logout is usually handled by the client by deleting the token.
        // We just return a success message.
        res.status(200).json({
            success: true,
            message: "Signed out successfully"
        });
    }
}
module.exports = AuthController;
