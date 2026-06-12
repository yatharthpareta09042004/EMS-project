const employeeService = require('../services/employeeService');
const AppError = require('../utils/appError');

class EmployeeController {
  async getEmployees(req, res, next) {
    try {
      const filters = req.query;
      const result = await employeeService.getEmployees(filters);

      res.status(200).json({
        status: 'success',
        results: result.employees.length,
        total: result.total,
        data: { employees: result.employees }
      });
    } catch (err) {
      next(err);
    }
  }

  async getEmployeeById(req, res, next) {
    try {
      const { id } = req.params;
      const employee = await employeeService.getEmployeeById(id);

      res.status(200).json({
        status: 'success',
        data: { employee }
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyProfile(req, res, next) {
    try {
      // req.user is populated by protect middleware
      const userId = req.user.id;
      const employee = await employeeService.getEmployeeByUserId(userId);

      res.status(200).json({
        status: 'success',
        data: { employee }
      });
    } catch (err) {
      next(err);
    }
  }

  async createEmployee(req, res, next) {
    try {
      const result = await employeeService.createEmployee(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Employee created successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await employeeService.updateEmployee(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Employee updated successfully',
        data: { employee: updated }
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params;
      await employeeService.deleteEmployee(id);

      res.status(200).json({
        status: 'success',
        message: 'Employee deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Department handlers ---
  async getDepartments(req, res, next) {
    try {
      const departments = await employeeService.getDepartments();
      res.status(200).json({
        status: 'success',
        data: { departments }
      });
    } catch (err) {
      next(err);
    }
  }

  async createDepartment(req, res, next) {
    try {
      const dept = await employeeService.createDepartment(req.body);
      res.status(201).json({
        status: 'success',
        data: { department: dept }
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Skills handlers ---
  async getSkills(req, res, next) {
    try {
      const skills = await employeeService.getSkills();
      res.status(200).json({
        status: 'success',
        data: { skills }
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Document upload handlers ---
  async uploadDocument(req, res, next) {
    try {
      const { id } = req.params;
      const { documentType } = req.body;
      const file = req.file;

      if (!file) {
        return next(new AppError('Please upload a file', 400));
      }

      if (!documentType) {
        return next(new AppError('Please specify documentType (profile_photo, resume, certificates, aadhar_card)', 400));
      }

      const doc = await employeeService.addEmployeeDocument(id, file, documentType);

      res.status(201).json({
        status: 'success',
        message: 'Document uploaded successfully',
        data: { document: doc }
      });
    } catch (err) {
      next(err);
    }
  }

  async getDocuments(req, res, next) {
    try {
      const { id } = req.params;
      const documents = await employeeService.getEmployeeDocuments(id);

      res.status(200).json({
        status: 'success',
        data: { documents }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EmployeeController();
