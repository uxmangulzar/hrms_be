const { mySqlQury, promisePool } = require("../database/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
class AuthService {
    /**
     * Register a new Company and its Admin User
     */
    static async register(data) {
        const { company_name, username, email, password, weburl, size,  } = data;
        const connection = await promisePool.getConnection();
        
        try {
            await connection.beginTransaction();
            // 1. Create Company
            const [companyResult] = await connection.query(
                "INSERT INTO companies (name, email, weburl, size) VALUES (?, ?, ?, ?)",
                [company_name, email, weburl, size]
            );
            const companyId = companyResult.insertId;
            // 2. Hash Password and Create Admin User
            const hashedPassword = await bcrypt.hash(password, 10);
            const [userResult] = await connection.query(
                "INSERT INTO users (username, email, password, company_id, role) VALUES (?, ?, ?, ?, ?)",
                [username, email, hashedPassword, companyId, 'company_admin']
            );
            await connection.commit();
            return {
                company_id: companyId,
                user_id: userResult.insertId,
                username,
                email,
                role: 'company_admin'
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    /**
     * Login user
     */
    static async login(email, password) {
        const sql = "SELECT * FROM users WHERE email = ? AND status = 'active' LIMIT 1";
        const users = await mySqlQury(sql, [email]);
        
        if (users.length === 0) {
            throw new Error("User not found or inactive");
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            throw new Error("Invalid credentials");
        }
        // Generate Token
        const token = jwt.sign(
            { id: user.id, role: user.role, company_id: user.company_id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        return {
            user: { id: user.id, username: user.username, email: user.email, role: user.role },
            token
        };
    }
    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const sql = "SELECT * FROM users WHERE email = ? LIMIT 1";
        const users = await mySqlQury(sql, [email]);
        return users.length > 0 ? users[0] : null;
    }
    /**
     * Update password
     */
    static async updatePassword(userId, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const sql = "UPDATE users SET password = ? WHERE id = ?";
        return await mySqlQury(sql, [hashedPassword, userId]);
    }
}
module.exports = AuthService;