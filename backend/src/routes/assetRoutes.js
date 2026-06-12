const express = require('express');
const assetController = require('../controllers/assetController');
const validate = require('../middleware/validate');
const { createAssetSchema, allocateAssetSchema, returnAssetSchema } = require('../validators/assetValidator');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// My assets (for standard employees)
router.get('/me', assetController.getMyAssets);

// HR / Admin / Manager endpoints
router.get('/', restrictTo('admin', 'hr', 'manager'), assetController.getAssets);
router.get('/:id', restrictTo('admin', 'hr', 'manager'), assetController.getAssetById);
router.get('/:id/history', restrictTo('admin', 'hr', 'manager'), assetController.getAssetHistory);

router.post('/', restrictTo('admin', 'hr'), validate(createAssetSchema), assetController.createAsset);
router.put('/:id/allocate', restrictTo('admin', 'hr'), validate(allocateAssetSchema), assetController.allocateAsset);
router.put('/:id/return', restrictTo('admin', 'hr'), validate(returnAssetSchema), assetController.returnAsset);

module.exports = router;
