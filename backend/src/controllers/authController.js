const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/appError');

class AuthController {
  async signup(req, res, next) {
    try {
      const { email, password, role } = req.body;
      const user = await authService.signup({ email, password, role });
      
      res.status(201).json({
        status: 'success',
        data: { user }
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refresh(refreshToken);

      res.status(200).json({
        status: 'success',
        data: tokens
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      // In stateless JWT architectures, the client discards the tokens.
      // We can clear cookie references if they are used, or simply confirm logout.
      res.status(200).json({
        status: 'success',
        message: 'Successfully logged out'
      });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await userRepository.findById(userId);
      
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      res.status(200).json({
        status: 'success',
        data: { user }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
