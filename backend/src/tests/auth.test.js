const request = require('supertest');
const app = require('../../server');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock database query pool client
jest.mock('../config/db', () => ({
  query: jest.fn(),
  testConnection: jest.fn().mockResolvedValue({ connected: true }),
  pool: { on: jest.fn() },
  getClient: jest.fn()
}));

// Mock cron jobs initialization
jest.mock('../jobs/cronJobs', () => ({
  initCronJobs: jest.fn()
}));

// Mock bcryptjs for fast and predictable comparisons
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hash')
}));

describe('Authentication API Endpoint Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should authenticate user with valid credentials and return JWT tokens', async () => {
      const mockUser = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        email: 'admin@company.com',
        password_hash: '$2a$10$/04VXb3RA.bhI2hDNYYk4.blwaDQpu.D9qLEmGKadmO6TYNMPvawq', // 'password123'
        role: 'admin',
        status: 'active'
      };

      // Mock user lookup returned from repository query
      db.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@company.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe('admin@company.com');
    });

    it('should reject login requests with missing credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@company.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });

    it('should reject invalid password credentials', async () => {
      const mockUser = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        email: 'admin@company.com',
        password_hash: '$2a$10$/04VXb3RA.bhI2hDNYYk4.blwaDQpu.D9qLEmGKadmO6TYNMPvawq',
        role: 'admin',
        status: 'active'
      };

      db.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@company.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should restrict access when no token is supplied in header', async () => {
      const res = await request(app)
        .get('/api/v1/auth/profile');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });
  });
});
