const { mySqlQury } = require("../database/db");

class EmployeeService {
    /**
     * Create a new employee
     * @param {Object} employeeData 
     * @returns {Object} created employee
     */
    static async createEmployee(companyId, employeeData) {
        const {
            user_id,
            employee_code,
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
            status = 'active'
        } = employeeData;

        const sql = `
            INSERT INTO employees (
                user_id, company_id, employee_code, first_name, last_name, 
                phone, designation, department, salary, joining_date, 
                dob, gender, address, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            user_id || null,
            companyId,
            employee_code,
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
            status
        ];

        const result = await mySqlQury(sql, values);
        return { id: result.insertId, ...employeeData };
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
