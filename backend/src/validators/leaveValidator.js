const Joi = require('joi');

const applyLeaveSchema = {
  body: Joi.object({
    leaveTypeId: Joi.number().integer().required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
      'date.min': 'End date must be greater than or equal to start date'
    }),
    reason: Joi.string().min(5).required().messages({
      'string.min': 'Reason must be at least 5 characters long'
    })
  })
};

const approveLeaveSchema = {
  body: Joi.object({
    action: Joi.string().valid('approve', 'reject').required().messages({
      'any.only': 'Action must be either approve or reject'
    }),
    comments: Joi.string().allow('', null).optional()
  })
};

module.exports = {
  applyLeaveSchema,
  approveLeaveSchema
};
