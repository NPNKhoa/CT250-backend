import jwt from 'jsonwebtoken';

import logError from '../utils/logError.js';

import { User } from '../models/user.model.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'No token provided! Access denied!',
      });
    }

    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      async (error, payload) => {
        if (error && error.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'Token expired!',
          });
        } else if (error && error.name === 'JsonWebTokenError') {
          return res.status(401).json({
            error: 'Invalid Token!',
          });
        } else if (error) {
          return res.status(401).json({
            error: 'Authentication error!',
          });
        }

        req.userId = payload;

        next();
      }
    );
  } catch (error) {
    logError(error, res);
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const { userId } = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'User ID not found! Acces denined',
      });
    }

    const checkUser = await User.findById(userId);

    if (!checkUser) {
      return res.status(404).json({
        error: 'User not found!',
      });
    }

    if (checkUser.role === 'admin') {
      return res.status(403).json({
        error: 'Access denied! Admins only',
      });
    }

    next();
  } catch (error) {
    logError(error, res);
  }
};
