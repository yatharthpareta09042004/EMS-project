const express = require('express');
const employeeController = require('../controllers/employeeController');
const validate = require('../middleware/validate');
const { 
  createEmployeeSchema, 
  updateEmployeeSchema, 
  getEmployeesQuerySchema,
  createDepartmentSchema
} = require('../validators/employeeValidator');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/multer');

const router = express.Router();

// All routes are protected by default
router.use(protect);

// Self endpoints
router.get('/me', employeeController.getMyProfile);

// Core Employee CRUD
router.get('/', restrictTo('admin', 'hr', 'manager'), validate(getEmployeesQuerySchema), employeeController.getEmployees);
router.get('/:id', restrictTo('admin', 'hr', 'manager', 'employee'), employeeController.getEmployeeById);
router.post('/', restrictTo('admin', 'hr'), validate(createEmployeeSchema), employeeController.createEmployee);
router.put('/:id', restrictTo('admin', 'hr', 'manager'), validate(updateEmployeeSchema), employeeController.updateEmployee);
router.delete('/:id', restrictTo('admin'), employeeController.deleteEmployee);

// Department endpoints
router.get('/departments/list', employeeController.getDepartments);
router.post('/departments/create', restrictTo('admin', 'hr'), validate(createDepartmentSchema), employeeController.createDepartment);

// Skills endpoints
router.get('/skills/list', employeeController.getSkills);

// Upload endpoints
router.post('/:id/documents', upload.single('file'), employeeController.uploadDocument);
router.get('/:id/documents', employeeController.getDocuments);

module.exports = router;
