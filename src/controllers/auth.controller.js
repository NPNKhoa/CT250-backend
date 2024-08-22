import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import { User, UserRole } from '../models/user.model.js';
import logError from '../utils/logError.js';
import {
  validateEmail,
  validatePhone,
  validGenders,
  validRoles,
} from '../utils/validation.js';

export const addRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role!',
      });
    }

    const existingRole = await UserRole.findOne({ role });

    if (existingRole) {
      return res.status(409).json({
        error: 'This role already exist!',
      });
    }

    const newRole = await UserRole.create({ role });

    res.status(201).json({
      data: newRole,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getAllRoles = async (req, res) => {
  try {
    const roles = await UserRole.find();

    if (!roles || roles.length === 0) {
      return res.status(404).json({
        error: 'Roles not found!',
      });
    }

    res.status(200).json({
      data: roles,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const signUp = async (req, res) => {
  try {
    const {
      fullname,
      email,
      password,
      confirmPassword,
      phone,
      gender,
      dateOfBirth,
      role = 'customer',
      address,
    } = req.body;

    if (!fullname || !email || !password || !phone) {
      return res.status(400).json({
        error: 'Missing required fields!!!',
      });
    }

    const imageFilePath = req?.file?.path || '';

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email! format!',
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({
        error: 'Invalid phone number format!',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters!',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match!',
      });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role!',
      });
    }

    if (!validGenders.includes(gender)) {
      return res.status(400).json({
        error: 'Invalid gender!',
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already exist!',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const roleId = (await UserRole.findOne({ role }))._id;

    if (!roleId) {
      return res.status(404).json({
        error: 'Wrong role!',
      });
    }

    const newUser = await User.create({
      fullname,
      email,
      password: hashedPassword,
      phone,
      gender,
      dateOfBirth,
      avatarImagePath: imageFilePath,
      role: roleId,
      address,
    });

    if (!newUser) {
      return res.status(500).json({
        error: 'Failed to create user!',
      });
    }

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET);

    res.status(201).json({
      data: {
        fullname,
        email,
        phone,
        gender,
        dateOfBirth,
        avatarImagePath: imageFilePath,
        role,
        address,
      },
      token,
      error: false,
      message: 'User created successfully!',
    });
  } catch (error) {
    logError(error, res);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields!',
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format!',
      });
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found!',
      });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials!',
      });
    }

    const token = jwt.sign(
      { userId: existingUser._id },
      process.env.JWT_SECRET
    );

    const responseUser = {
      _id: existingUser._id,
      fullname: existingUser.fullname,
      email: existingUser.email,
      phone: existingUser.phone,
      gender: existingUser.gender,
      dateOfBirth: existingUser.dateOfBirth,
      avatarImagePath: existingUser.avatarImagePath,
      address: existingUser.address,
    };

    res.status(200).json({
      data: responseUser,
      token,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const logout = async (req, res) => {
  try {
  } catch (error) {
    logError(error, res);
  }
};
