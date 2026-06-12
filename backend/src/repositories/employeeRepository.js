const db = require('../config/db');

class EmployeeRepository {
  /**
   * Search, filter, page, and sort employees.
   * Utilizes window functions (COUNT(*) OVER()) to retrieve total counts in a single query.
   */
  async findAll({ search, departmentId, skill, limit = 10, offset = 0, sortBy = 'full_name', sortOrder = 'ASC' }) {
    let queryText = `
      SELECT *, COUNT(*) OVER() as total_count 
      FROM v_employee_details
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Search filter (name, email, designation)
    if (search) {
      queryText += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR designation ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Department filter
    if (departmentId) {
      queryText += ` AND department_id = $${paramIndex}`;
      params.push(parseInt(departmentId));
      paramIndex++;
    }

    // Skills filter (using JSON containment or exists checks)
    if (skill) {
      queryText += ` AND EXISTS (
        SELECT 1 FROM json_array_elements(skills) s 
        WHERE s->>'skill_name' ILIKE $${paramIndex}
      )`;
      params.push(skill);
      paramIndex++;
    }

    // Sorting sanity check (prevent SQL injection by whitelisting fields)
    const allowedSortFields = ['full_name', 'joined_date', 'salary', 'designation', 'department_name'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'full_name';
    const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
    
    queryText += ` ORDER BY ${finalSortBy} ${finalSortOrder}`;

    // Pagination
    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(queryText, params);
    
    const employees = result.rows;
    const total = employees.length > 0 ? parseInt(employees[0].total_count) : 0;

    // Remove total_count property from records to keep rows clean
    employees.forEach(emp => delete emp.total_count);

    return { employees, total };
  }

  async findById(id) {
    const queryText = 'SELECT * FROM v_employee_details WHERE employee_profile_id = $1';
    const result = await db.query(queryText, [id]);
    return result.rows[0];
  }

  async findByUserId(userId) {
    const queryText = 'SELECT * FROM v_employee_details WHERE user_id = $1';
    const result = await db.query(queryText, [userId]);
    return result.rows[0];
  }

  /**
   * Create employee profile (assumes user record was created first)
   */
  async create({ userId, departmentId, firstName, lastName, phone, address, salary, designation, joinedDate }) {
    const queryText = `
      INSERT INTO employee_profiles (user_id, department_id, first_name, last_name, phone, address, salary, designation, joined_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await db.query(queryText, [
      userId,
      departmentId || null,
      firstName,
      lastName,
      phone || null,
      address || null,
      salary || 0.00,
      designation,
      joinedDate || new Date()
    ]);
    return result.rows[0];
  }

  async update(id, { departmentId, firstName, lastName, phone, address, salary, designation, joinedDate }) {
    const queryText = `
      UPDATE employee_profiles 
      SET department_id = $1, first_name = $2, last_name = $3, phone = $4, address = $5, salary = $6, designation = $7, joined_date = $8, updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `;
    const result = await db.query(queryText, [
      departmentId || null,
      firstName,
      lastName,
      phone || null,
      address || null,
      salary,
      designation,
      joinedDate,
      id
    ]);
    return result.rows[0];
  }

  async delete(id) {
    const queryText = 'DELETE FROM employee_profiles WHERE id = $1 RETURNING id';
    const result = await db.query(queryText, [id]);
    return result.rows[0];
  }

  // --- Department management repo methods ---
  async findAllDepartments() {
    const result = await db.query('SELECT * FROM departments ORDER BY name ASC');
    return result.rows;
  }

  async createDepartment({ name, description }) {
    const queryText = 'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *';
    const result = await db.query(queryText, [name, description]);
    return result.rows[0];
  }

  // --- Skills registry methods ---
  async findAllSkills() {
    const result = await db.query('SELECT * FROM skills ORDER BY name ASC');
    return result.rows;
  }

  async addSkillToProfile(profileId, skillId, proficiencyLevel) {
    const queryText = `
      INSERT INTO employee_skills (employee_profile_id, skill_id, proficiency_level)
      VALUES ($1, $2, $3)
      ON CONFLICT (employee_profile_id, skill_id) 
      DO UPDATE SET proficiency_level = EXCLUDED.proficiency_level
      RETURNING *
    `;
    const result = await db.query(queryText, [profileId, skillId, proficiencyLevel]);
    return result.rows[0];
  }

  async removeSkillsFromProfile(profileId) {
    await db.query('DELETE FROM employee_skills WHERE employee_profile_id = $1', [profileId]);
  }

  async findSkillByName(name) {
    const result = await db.query('SELECT * FROM skills WHERE name = $1', [name]);
    return result.rows[0];
  }

  async createSkill(name) {
    const result = await db.query('INSERT INTO skills (name) VALUES ($1) RETURNING *', [name]);
    return result.rows[0];
  }

  // --- Document/Image uploads repo methods ---
  async addImage(profileId, { documentType, fileName, filePath, fileSize, mimeType }) {
    const queryText = `
      INSERT INTO employee_images (employee_profile_id, document_type, file_name, file_path, file_size, mime_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await db.query(queryText, [profileId, documentType, fileName, filePath, fileSize, mimeType]);
    return result.rows[0];
  }

  async findImagesByProfileId(profileId) {
    const result = await db.query('SELECT * FROM employee_images WHERE employee_profile_id = $1 ORDER BY uploaded_at DESC', [profileId]);
    return result.rows;
  }
}

module.exports = new EmployeeRepository();
