const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/appError');

class AuthService {
  generateTokens(user) {
    const payload = { id: user.id, email: user.email, role: user.role };
    
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'super_secret_enterprise_jwt_signing_key_2026',
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'super_secret_enterprise_jwt_refresh_signing_key_2026',
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    return { accessToken, refreshToken };
  }

  async signup({ email, password, role }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('A user with this email already exists', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await userRepository.create({
      email,
      passwordHash,
      role,
      status: 'active'
    });

    return newUser;
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status !== 'active') {
      throw new AppError('This account is suspended', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = this.generateTokens(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      ...tokens
    };
  }

  async refresh(refreshToken) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'super_secret_enterprise_jwt_refresh_signing_key_2026'
      );

      const user = await userRepository.findById(decoded.id);
      if (!user) {
        throw new AppError('User no longer exists', 401);
      }

      if (user.status !== 'active') {
        throw new AppError('User account is inactive', 403);
      }

      const tokens = this.generateTokens(user);
      return tokens;
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }
}

module.exports = new AuthService();
