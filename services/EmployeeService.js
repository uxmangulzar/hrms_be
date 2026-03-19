const { mySqlQury, promisePool } = require("../database/db");
const bcrypt = require("bcryptjs");
const MailService = require("./MailService");

class EmployeeService {
    /**
     * Create a new employee
     * @param {Object} employeeData 
     * @returns {Object} created employee
     */
    static async createEmployee(companyId, employeeData) {
        const {
            first_name,
            last_name,
            phone,
            designation,
            department,
            salary,
            joining_date,
            dob,
            gender,
            address,
            status = 'active',
            email, // Email provided in payload
            username // Username provided in payload
        } = employeeData;

        // 1. Generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8);

        const connection = await promisePool.getConnection();
        let userId = null;

        try {
            await connection.beginTransaction();

            // 2. Hash Password for User Table
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            // 3. Create User record (role: employee)
            const [userResult] = await connection.query(
                "INSERT INTO users (username, email, password, company_id, role, status) VALUES (?, ?, ?, ?, ?, ?)",
                [username || email, email, hashedPassword, companyId, 'employee', 'active']
            );
            userId = userResult.insertId;

            // 4. Create Employee record with user_id
            const employeeCode = employeeData.employee_code || `EMP-${Date.now().toString().slice(-6)}`;
            
            const [empResult] = await connection.query(`
                INSERT INTO employees (
                    user_id, company_id, employee_code, first_name, last_name, 
                    phone, designation, department, salary, joining_date, 
                    dob, gender, address, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId, companyId, employeeCode, first_name, last_name, 
                phone, designation, department, salary, joining_date, 
                dob, gender, address, status
            ]);

            await connection.commit();

            // 5. Fetch Company Name for Email
            const [companies] = await connection.query("SELECT name FROM companies WHERE id = ?", [companyId]);
            const companyName = companies.length > 0 ? companies[0].name : "Our Company";

            // 6. Send Email with Credentials (Background task)
            MailService.sendEmployeeCredentialsEmail(email, {
                full_name: `${first_name} ${last_name}`,
                username: username || email,
                password: tempPassword,
                company_name: companyName,
                login_url: process.env.FRONTEND_LOGIN_URL || "https://hrms-portal.com/login",
                company_id: companyId
            }).catch(err => console.error("[EmployeeService] Mail Error:", err));

            return { 
                id: empResult.insertId, 
                user_id: userId,
                ...employeeData, 
                employee_code: employeeCode,
                temp_password: tempPassword // Return it for immediate feedback too
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get all employees for a company with filtering and search
     */
    static async getEmployees(companyId, options = {}) {
        const { 
            search, 
            status, 
            department, 
            designation, 
            page = 1, 
            limit = 10 
        } = options;

        let sql = "SELECT * FROM employees WHERE company_id = ?";
        let countSql = "SELECT COUNT(*) as total FROM employees WHERE company_id = ?";
        const params = [companyId];
        const countParams = [companyId];

        // Search Filter
        if (search) {
            const searchPattern = `%${search}%`;
            const searchFilter = " AND (first_name LIKE ? OR last_name LIKE ? OR employee_code LIKE ? OR phone LIKE ?)";
            sql += searchFilter;
            countSql += searchFilter;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
            countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        // Status Filter
        if (status) {
            sql += " AND status = ?";
            countSql += " AND status = ?";
            params.push(status);
            countParams.push(status);
        }

        // Department Filter
        if (department) {
            sql += " AND department = ?";
            countSql += " AND department = ?";
            params.push(department);
            countParams.push(department);
        }

        // Designation Filter
        if (designation) {
            sql += " AND designation = ?";
            countSql += " AND designation = ?";
            params.push(designation);
            countParams.push(designation);
        }

        // Sorting
        sql += " ORDER BY created_at DESC";

        // Pagination
        const offset = (page - 1) * limit;
        sql += " LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));

        // Execute queries
        const [employees, countResult] = await Promise.all([
            mySqlQury(sql, params),
            mySqlQury(countSql, countParams)
        ]);

        const total = countResult[0].total;

        return {
            employees,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get single employee details
     */
    static async getEmployeeById(companyId, employeeId) {
        const sql = "SELECT * FROM employees WHERE id = ? AND company_id = ?";
        const result = await mySqlQury(sql, [employeeId, companyId]);
        return result.length > 0 ? result[0] : null;
    }

    /**
     * Update employee details
     */
    static async updateEmployee(companyId, employeeId, updateData) {
        const fields = [];
        const params = [];

        // Permitted fields
        const mapping = [
            'first_name', 'last_name', 'phone', 'designation', 
            'department', 'salary', 'joining_date', 'dob', 
            'gender', 'address', 'status', 'employee_code'
        ];

        mapping.forEach(key => {
            if (updateData[key] !== undefined) {
                fields.push(`${key} = ?`);
                params.push(updateData[key]);
            }
        });

        if (fields.length === 0) return await this.getEmployeeById(companyId, employeeId);

        const sql = `UPDATE employees SET ${fields.join(", ")} WHERE id = ? AND company_id = ?`;
        params.push(employeeId, companyId);

        await mySqlQury(sql, params);
        return await this.getEmployeeById(companyId, employeeId);
    }

    /**
     * Delete/Terminate Employee (Actually updates status)
     */
    static async deleteEmployee(companyId, employeeId) {
        // We usually don't delete employees for history reasons, we change status
        const sql = "UPDATE employees SET status = 'terminated' WHERE id = ? AND company_id = ?";
        return await mySqlQury(sql, [employeeId, companyId]);
    }
}

module.exports = EmployeeService;
