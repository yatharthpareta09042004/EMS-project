const assetRepository = require('../repositories/assetRepository');
const employeeRepository = require('../repositories/employeeRepository');
const db = require('../config/db');
const AppError = require('../utils/appError');

class AssetService {
  async getAssets(filters) {
    return await assetRepository.findAll(filters);
  }

  async getAssetById(id) {
    const asset = await assetRepository.findById(id);
    if (!asset) {
      throw new AppError('Asset not found', 404);
    }
    return asset;
  }

  async getAssetHistory(assetId) {
    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      throw new AppError('Asset not found', 404);
    }
    return await assetRepository.findHistoryByAssetId(assetId);
  }

  async createAsset(data, performedByUserId) {
    const existing = await assetRepository.findBySerialNumber(data.serialNumber);
    if (existing) {
      throw new AppError(`Asset with serial number ${data.serialNumber} already registered`, 400);
    }

    const { client, query, release } = await db.getClient();
    try {
      await query('BEGIN');

      const asset = await assetRepository.create(data);

      await assetRepository.createHistory({
        assetId: asset.id,
        actionType: 'create',
        description: `Asset added to registry. Type: ${data.assetType}, Serial: ${data.serialNumber}`,
        performedBy: performedByUserId
      });

      await query('COMMIT');
      return asset;
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    } finally {
      release();
    }
  }

  async allocateAsset({ assetId, employeeProfileId, conditionOnAllocation }, performedByUserId) {
    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      throw new AppError('Asset not found', 404);
    }

    if (asset.asset_status !== 'available') {
      throw new AppError(`Asset is not available for allocation. Current status: ${asset.asset_status}`, 400);
    }

    const employee = await employeeRepository.findById(employeeProfileId);
    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }

    const { client, query, release } = await db.getClient();
    try {
      await query('BEGIN');

      // 1. Update Asset Status to allocated
      await assetRepository.updateStatus(assetId, 'allocated');

      // 2. Create allocation ledger
      const allocation = await assetRepository.createAllocation({
        assetId,
        employeeProfileId,
        conditionOnAllocation
      });

      // 3. Log History
      await assetRepository.createHistory({
        assetId,
        actionType: 'allocate',
        description: `Allocated to ${employee.full_name}. Condition: ${conditionOnAllocation}`,
        performedBy: performedByUserId
      });

      // 4. Send notification to employee
      const message = `Asset Assigned: "${asset.asset_name}" (Serial: ${asset.serial_number}) has been allocated to you.`;
      await query(
        `INSERT INTO notifications (user_id, message, type, reference_id)
         VALUES ($1, $2, 'asset_assigned', $3)`,
        [employee.user_id, message, employeeProfileId]
      );

      await query('COMMIT');
      return allocation;
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    } finally {
      release();
    }
  }

  async returnAsset(assetId, { conditionOnReturn }, performedByUserId) {
    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      throw new AppError('Asset not found', 404);
    }

    if (asset.asset_status !== 'allocated') {
      throw new AppError('Asset is not currently allocated', 400);
    }

    const activeAlloc = await assetRepository.findActiveAllocation(assetId);
    if (!activeAlloc) {
      throw new AppError('No active allocation record found for this asset', 400);
    }

    const employee = await employeeRepository.findById(activeAlloc.employee_profile_id);

    const { client, query, release } = await db.getClient();
    try {
      await query('BEGIN');

      // 1. Close allocation ledger
      await assetRepository.updateAllocationReturn(activeAlloc.id, {
        conditionOnReturn
      });

      // 2. Return Asset to available status
      await assetRepository.updateStatus(assetId, 'available');

      // 3. Log History
      await assetRepository.createHistory({
        assetId,
        actionType: 'return',
        description: `Returned by ${employee ? employee.full_name : 'Unknown'}. Condition: ${conditionOnReturn}`,
        performedBy: performedByUserId
      });

      // 4. Send notification to employee
      if (employee) {
        const message = `Asset Returned: "${asset.asset_name}" (Serial: ${asset.serial_number}) has been successfully returned.`;
        await query(
          `INSERT INTO notifications (user_id, message, type, reference_id)
           VALUES ($1, $2, 'asset_returned', $3)`,
          [employee.user_id, message, employee.employee_profile_id]
        );
      }

      await query('COMMIT');
      return { status: 'available', assetId };
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    } finally {
      release();
    }
  }

  async getEmployeeAssets(userId) {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }
    return await assetRepository.findAllocatedAssetsByProfileId(employee.employee_profile_id);
  }
}

module.exports = new AssetService();
