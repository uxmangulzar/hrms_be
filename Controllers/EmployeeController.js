const EmployeeService = require("../services/EmployeeService");

class EmployeeController {
    /**
     * Create Employee (Manual Admin mode)
     */
    static async createEmployee(req, res) {
        try {
            const company_id = req.user.company_id;
            const employeeData = req.body;

            // Basic Validation
            const { first_name, last_name, employee_code, designation, department } = employeeData;
            if (!first_name || !last_name || !employee_code) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Required fields missing (first_name, last_name, employee_code)" 
                });
            }

            const result = await EmployeeService.createEmployee(company_id, employeeData);
            
            return res.status(201).json({ 
                success: true, 
                message: "Employee created successfully", 
                data: result 
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get All Employees for a Company
     */
    static async getEmployees(req, res) {
        try {
            const company_id = req.user.company_id;
            const { search, status, department, designation, page, limit } = req.query;

            const response = await EmployeeService.getEmployees(company_id, {
                search,
                status,
                department,
                designation,
                page: page || 1,
                limit: limit || 10
            });

            return res.status(200).json({ 
                success: true, 
                ...response 
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get Single Employee Details
     */
    static async getEmployeeById(req, res) {
        try {
            const company_id = req.user.company_id;
            const { id } = req.params;

            const employee = await EmployeeService.getEmployeeById(company_id, id);
            if (!employee) {
                return res.status(404).json({ success: false, message: "Employee not found or unauthorized" });
            }

            return res.status(200).json({ success: true, data: employee });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update Employee details
     */
    static async updateEmployee(req, res) {
        try {
            const company_id = req.user.company_id;
            const { id } = req.params;
            const updateData = req.body;

            // Verify if exists
            const employee = await EmployeeService.getEmployeeById(company_id, id);
            if (!employee) {
                return res.status(404).json({ success: false, message: "Employee not found or unauthorized" });
            }

            const result = await EmployeeService.updateEmployee(company_id, id, updateData);

            return res.status(200).json({ 
                success: true, 
                message: "Employee records updated successfully", 
                data: result 
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete/Terminate Employee
     */
    static async deleteEmployee(req, res) {
        try {
            const company_id = req.user.company_id;
            const { id } = req.params;

            // Verify if exists
            const employee = await EmployeeService.getEmployeeById(company_id, id);
            if (!employee) {
                return res.status(404).json({ success: false, message: "Employee not found or unauthorized" });
            }

            await EmployeeService.deleteEmployee(company_id, id);

            return res.status(200).json({ 
                success: true, 
                message: "Employee status updated to 'terminated'" 
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = EmployeeController;
