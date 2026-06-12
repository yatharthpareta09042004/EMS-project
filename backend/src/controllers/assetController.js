const assetService = require('../services/assetService');
const AppError = require('../utils/appError');

class AssetController {
  async getAssets(req, res, next) {
    try {
      const filters = req.query;
      const assets = await assetService.getAssets(filters);

      res.status(200).json({
        status: 'success',
        results: assets.length,
        data: { assets }
      });
    } catch (err) {
      next(err);
    }
  }

  async getAssetById(req, res, next) {
    try {
      const { id } = req.params;
      const asset = await assetService.getAssetById(id);

      res.status(200).json({
        status: 'success',
        data: { asset }
      });
    } catch (err) {
      next(err);
    }
  }

  async getAssetHistory(req, res, next) {
    try {
      const { id } = req.params;
      const history = await assetService.getAssetHistory(id);

      res.status(200).json({
        status: 'success',
        data: { history }
      });
    } catch (err) {
      next(err);
    }
  }

  async createAsset(req, res, next) {
    try {
      // req.user is populated by protect middleware
      const asset = await assetService.createAsset(req.body, req.user.id);

      res.status(201).json({
        status: 'success',
        message: 'Asset created successfully',
        data: { asset }
      });
    } catch (err) {
      next(err);
    }
  }

  async allocateAsset(req, res, next) {
    try {
      const { id } = req.params; // assetId
      const { employeeProfileId, conditionOnAllocation } = req.body;
      
      const allocation = await assetService.allocateAsset({
        assetId: id,
        employeeProfileId,
        conditionOnAllocation
      }, req.user.id);

      res.status(200).json({
        status: 'success',
        message: 'Asset allocated successfully',
        data: { allocation }
      });
    } catch (err) {
      next(err);
    }
  }

  async returnAsset(req, res, next) {
    try {
      const { id } = req.params; // assetId
      const { conditionOnReturn } = req.body;

      const result = await assetService.returnAsset(id, {
        conditionOnReturn
      }, req.user.id);

      res.status(200).json({
        status: 'success',
        message: 'Asset returned successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyAssets(req, res, next) {
    try {
      const assets = await assetService.getEmployeeAssets(req.user.id);
      res.status(200).json({
        status: 'success',
        data: { assets }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AssetController();
