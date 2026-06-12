const Joi = require('joi');

const createAssetSchema = {
  body: Joi.object({
    name: Joi.string().max(100).required(),
    assetType: Joi.string().valid('Laptop', 'Monitor', 'Mouse', 'ID Card', 'Access Card').required(),
    serialNumber: Joi.string().max(100).required()
  })
};

const allocateAssetSchema = {
  body: Joi.object({
    employeeProfileId: Joi.string().uuid().required(),
    conditionOnAllocation: Joi.string().required()
  })
};

const returnAssetSchema = {
  body: Joi.object({
    conditionOnReturn: Joi.string().required()
  })
};

module.exports = {
  createAssetSchema,
  allocateAssetSchema,
  returnAssetSchema
};
