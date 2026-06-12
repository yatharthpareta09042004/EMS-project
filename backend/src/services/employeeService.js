const employeeRepository = require('../repositories/employeeRepository');
const userRepository = require('../repositories/userRepository');
const db = require('../config/db');
const AppError = require('../utils/appError');
const bcrypt = require('bcryptjs');

class EmployeeService {
  async getEmployees(filters) {
    return await employeeRepository.findAll(filters);
  }

  async getEmployeeById(id) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }
    return employee;
  }

  async getEmployeeByUserId(userId) {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) {
      throw new AppError('Employee profile not found for this user', 404);
    }
    return employee;
  }

  /**
   * Enterprise-Grade Transaction: Creates a User Account, Employee Profile, and sets up Leave Balances.
   */
  async createEmployee(data) {
    const { email, password, role, firstName, lastName, phone, address, salary, designation, joinedDate, skills } = data;
    
    // Check if user account already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email is already registered', 400);
    }

    // Get connection client for transaction
    const { client, query, release } = await db.getClient();

    try {
      await query('BEGIN');

      // 1. Create User
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const userRes = await query(
        `INSERT INTO users (email, password_hash, role, status) 
         VALUES ($1, $2, $3, 'active') RETURNING id`,
        [email, passwordHash, role]
      );
      const userId = userRes.rows[0].id;

      // 2. Create Employee Profile
      const profileRes = await query(
        `INSERT INTO employee_profiles (user_id, department_id, first_name, last_name, phone, address, salary, designation, joined_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          userId,
          data.departmentId || null,
          firstName,
          lastName,
          phone || null,
          address || null,
          salary || 0.00,
          designation,
          joinedDate || new Date()
        ]
      );
      const profileId = profileRes.rows[0].id;

      // 3. Initialize Leave Balances for the current year (2026)
      const leaveTypesRes = await query('SELECT id, default_days FROM leave_types');
      const currentYear = new Date().getFullYear();
      
      for (const lt of leaveTypesRes.rows) {
        await query(
          `INSERT INTO leave_balance (employee_profile_id, leave_type_id, total_days, used_days, pending_days, year)
           VALUES ($1, $2, $3, 0, 0, $4)`,
          [profileId, lt.id, lt.default_days, currentYear]
        );
      }

      // 4. Link Skills
      if (skills && Array.isArray(skills)) {
        for (const skillData of skills) {
          let skillId = skillData.id;
          
          // If skill id is missing but name exists, resolve or create it
          if (!skillId && skillData.name) {
            const cleanName = skillData.name.trim();
            const existingSkillRes = await query('SELECT id FROM skills WHERE name = $1', [cleanName]);
            if (existingSkillRes.rows.length > 0) {
              skillId = existingSkillRes.rows[0].id;
            } else {
              const newSkillRes = await query('INSERT INTO skills (name) VALUES ($1) RETURNING id', [cleanName]);
              skillId = newSkillRes.rows[0].id;
            }
          }

          if (skillId) {
            await query(
              `INSERT INTO employee_skills (employee_profile_id, skill_id, proficiency_level)
               VALUES ($1, $2, $3)`,
              [profileId, skillId, skillData.proficiencyLevel || 'intermediate']
            );
          }
        }
      }

      await query('COMMIT');
      return { profileId, userId };
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    } finally {
      release();
    }
  }

  async updateEmployee(id, data) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }

    // Update main fields
    const updated = await employeeRepository.update(id, data);

    // If skills are provided, overwrite
    if (data.skills && Array.isArray(data.skills)) {
      await employeeRepository.removeSkillsFromProfile(id);
      for (const skillData of data.skills) {
        let skillId = skillData.id;
        if (!skillId && skillData.name) {
          const cleanName = skillData.name.trim();
          let skill = await employeeRepository.findSkillByName(cleanName);
          if (!skill) {
            skill = await employeeRepository.createSkill(cleanName);
          }
          skillId = skill.id;
        }

        if (skillId) {
          await employeeRepository.addSkillToProfile(id, skillId, skillData.proficiencyLevel || 'intermediate');
        }
      }
    }

    return updated;
  }

  async deleteEmployee(id) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }

    // Delete the underlying User. Cascading foreign keys will delete the profile, leaves, skills, etc.
    const queryText = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await db.query(queryText, [employee.user_id]);
    return result.rows[0];
  }

  // --- Departments service ---
  async getDepartments() {
    return await employeeRepository.findAllDepartments();
  }

  async createDepartment(data) {
    if (!data.name) {
      throw new AppError('Department name is required', 400);
    }
    return await employeeRepository.createDepartment(data);
  }

  // --- Skills service ---
  async getSkills() {
    return await employeeRepository.findAllSkills();
  }

  // --- Image document service ---
  async addEmployeeDocument(profileId, file, documentType) {
    const employee = await employeeRepository.findById(profileId);
    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }

    const doc = await employeeRepository.addImage(profileId, {
      documentType,
      fileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype
    });

    return doc;
  }

  async getEmployeeDocuments(profileId) {
    const employee = await employeeRepository.findById(profileId);
    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }
    return await employeeRepository.findImagesByProfileId(profileId);
  }
}

module.exports = new EmployeeService();
