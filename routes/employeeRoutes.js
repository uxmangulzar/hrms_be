const express = require("express");
const router = express.Router();
const EmployeeController = require("../Controllers/EmployeeController");
const { authenticate, authorize } = require("../middleware/AuthMiddleware");

/**
 * @route GET /api/employees
 * @desc Get all employees for the company with search and filters
 * @access Private (Company Admin, Manager)
 */
router.get("/", authenticate, authorize(['company_admin', 'manager']), EmployeeController.getEmployees);

/**
 * @route GET /api/employees/:id
 * @desc Get details of a single employee
 * @access Private (Company Admin, Manager)
 */
router.get("/:id", authenticate, authorize(['company_admin', 'manager']), EmployeeController.getEmployeeById);

/**
 * @route POST /api/employees/create
 * @desc Create a new employee record manually
 * @access Private (Company Admin)
 */
router.post("/create", authenticate, authorize(['company_admin']), EmployeeController.createEmployee);

/**
 * @route PATCH /api/employees/:id
 * @desc Update employee record details
 * @access Private (Company Admin, Manager)
 */
router.patch("/:id", authenticate, authorize(['company_admin', 'manager']), EmployeeController.updateEmployee);

/**
 * @route DELETE /api/employees/:id
 * @desc Terminate/Delete an employee (updates status)
 * @access Private (Company Admin)
 */
router.delete("/:id", authenticate, authorize(['company_admin']), EmployeeController.deleteEmployee);

module.exports = router;
