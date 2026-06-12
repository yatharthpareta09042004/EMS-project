const db = require('../config/db');

class AssetRepository {
  async findAll({ search, assetType, status }) {
    let queryText = 'SELECT * FROM v_asset_details WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      queryText += ` AND (asset_name ILIKE $${paramIndex} OR serial_number ILIKE $${paramIndex} OR allocated_to_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (assetType) {
      queryText += ` AND asset_type = $${paramIndex}`;
      params.push(assetType);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND asset_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    queryText += ' ORDER BY asset_id DESC';
    const result = await db.query(queryText, params);
    return result.rows;
  }

  async findById(id) {
    const queryText = 'SELECT * FROM v_asset_details WHERE asset_id = $1';
    const result = await db.query(queryText, [id]);
    return result.rows[0];
  }

  async findBySerialNumber(serialNumber) {
    const queryText = 'SELECT * FROM assets WHERE serial_number = $1';
    const result = await db.query(queryText, [serialNumber]);
    return result.rows[0];
  }

  async create({ name, assetType, serialNumber, status = 'available' }) {
    const queryText = `
      INSERT INTO assets (name, asset_type, serial_number, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(queryText, [name, assetType, serialNumber, status]);
    return result.rows[0];
  }

  async updateStatus(id, status) {
    const queryText = 'UPDATE assets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
    const result = await db.query(queryText, [status, id]);
    return result.rows[0];
  }

  async createAllocation({ assetId, employeeProfileId, conditionOnAllocation }) {
    const queryText = `
      INSERT INTO asset_allocations (asset_id, employee_profile_id, allocated_at, condition_on_allocation)
      VALUES ($1, $2, NOW(), $3)
      RETURNING *
    `;
    const result = await db.query(queryText, [assetId, employeeProfileId, conditionOnAllocation]);
    return result.rows[0];
  }

  async findActiveAllocation(assetId) {
    const queryText = `
      SELECT * FROM asset_allocations 
      WHERE asset_id = $1 AND returned_at IS NULL
    `;
    const result = await db.query(queryText, [assetId]);
    return result.rows[0];
  }

  async updateAllocationReturn(id, { returnedAt = new Date(), conditionOnReturn }) {
    const queryText = `
      UPDATE asset_allocations 
      SET returned_at = $1, condition_on_return = $2
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(queryText, [returnedAt, conditionOnReturn, id]);
    return result.rows[0];
  }

  async createHistory({ assetId, actionType, description, performedBy }) {
    const queryText = `
      INSERT INTO asset_history (asset_id, action_type, description, performed_by, timestamp)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const result = await db.query(queryText, [assetId, actionType, description, performedBy]);
    return result.rows[0];
  }

  async findHistoryByAssetId(assetId) {
    const queryText = `
      SELECT ah.*, u.email as performed_by_email, u.role as performed_by_role
      FROM asset_history ah
      LEFT JOIN users u ON ah.performed_by = u.id
      WHERE ah.asset_id = $1
      ORDER BY ah.timestamp DESC
    `;
    const result = await db.query(queryText, [assetId]);
    return result.rows;
  }

  async findAllocatedAssetsByProfileId(profileId) {
    const queryText = `
      SELECT a.*, aa.allocated_at, aa.condition_on_allocation, aa.id as allocation_id
      FROM asset_allocations aa
      JOIN assets a ON aa.asset_id = a.id
      WHERE aa.employee_profile_id = $1 AND aa.returned_at IS NULL
    `;
    const result = await db.query(queryText, [profileId]);
    return result.rows;
  }
}

module.exports = new AssetRepository();
