const Joi = require('joi');

const createEmployeeSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'hr', 'manager', 'employee').required(),
    firstName: Joi.string().max(100).required(),
    lastName: Joi.string().max(100).required(),
    phone: Joi.string().max(20).allow('', null),
    address: Joi.string().allow('', null),
    salary: Joi.number().min(0).default(0.00),
    designation: Joi.string().max(100).required(),
    joinedDate: Joi.date().raw().allow('', null),
    departmentId: Joi.number().integer().allow(null),
    skills: Joi.array().items(
      Joi.object({
        id: Joi.number().integer().optional(),
        name: Joi.string().optional(),
        proficiencyLevel: Joi.string().valid('beginner', 'intermediate', 'expert').required()
      })
    ).optional()
  })
};

const updateEmployeeSchema = {
  body: Joi.object({
    firstName: Joi.string().max(100).optional(),
    lastName: Joi.string().max(100).optional(),
    phone: Joi.string().max(20).allow('', null).optional(),
    address: Joi.string().allow('', null).optional(),
    salary: Joi.number().min(0).optional(),
    designation: Joi.string().max(100).optional(),
    joinedDate: Joi.date().raw().optional(),
    departmentId: Joi.number().integer().allow(null).optional(),
    skills: Joi.array().items(
      Joi.object({
        id: Joi.number().integer().optional(),
        name: Joi.string().optional(),
        proficiencyLevel: Joi.string().valid('beginner', 'intermediate', 'expert').required()
      })
    ).optional()
  })
};

const getEmployeesQuerySchema = {
  query: Joi.object({
    search: Joi.string().allow('').optional(),
    departmentId: Joi.number().integer().optional(),
    skill: Joi.string().allow('').optional(),
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
    sortBy: Joi.string().valid('full_name', 'joined_date', 'salary', 'designation', 'department_name').default('full_name'),
    sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('ASC')
  })
};

const createDepartmentSchema = {
  body: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().allow('', null)
  })
};

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  getEmployeesQuerySchema,
  createDepartmentSchema
};
