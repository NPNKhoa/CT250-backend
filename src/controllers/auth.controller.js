import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import QueryString from 'qs';

import { User, UserRole } from '../models/user.model.js';
import logError from '../utils/logError.js';
import {
  validateEmail,
  validatePhone,
  validRoles,
} from '../utils/validation.js';
import generateToken from '../utils/generateToken.js';
import compileTemplate from '../utils/compileTemplate.js';
import { sendEmail } from '../services/email.service.js';

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

export const loginWithSocial = async (req, res) => {
  try {
    const { fullname, email, avatarImagePath, role = 'customer' } = req.body;

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role!',
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const { accessToken, refreshToken } = generateToken({
        userId: existingUser._id,
      });

      existingUser.refreshToken = refreshToken;

      await existingUser.save();
      return res.status(201).json({
        data: {
          userId: existingUser._id,
          accessToken,
          refreshToken,
        },
        error: false,
        message: 'Login successfully!',
      });
    }

    const roleId = (await UserRole.findOne({ role }))._id;

    if (!roleId) {
      return res.status(404).json({
        error: 'Wrong role!',
      });
    }

    const newUser = await User.create({
      fullname,
      email,
      avatarImagePath: avatarImagePath,
      isSocialLogin: true,
      role: roleId,
    });

    if (!newUser) {
      return res.status(500).json({
        error: 'Failed to create user!',
      });
    }

    const { accessToken, refreshToken } = generateToken({
      userId: newUser._id,
    });

    newUser.refreshToken = refreshToken;

    await newUser.save();

    res.status(201).json({
      data: {
        userId: newUser._id,
        accessToken,
        refreshToken,
      },
      error: false,
      message: 'User created successfully!',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Email already exists!',
      });
    }
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
      role = 'customer',
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

    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      phone,
      avatarImagePath: imageFilePath,
      role: roleId,
    });

    if (!newUser) {
      return res.status(500).json({
        error: 'Failed to create user!',
      });
    }

    const { accessToken, refreshToken } = generateToken({
      userId: newUser._id,
    });

    newUser.refreshToken = refreshToken;

    const emailVerificationToken = jwt.sign(
      { userId: newUser._id },
      process.env.EMAIL_TOKEN_SECRET,
      { expiresIn: '24h' }
    );

    const verificationLink = `${process.env.FRONTEND_URL}/email-verification?token=${emailVerificationToken}`;

    const templateData = {
      shopName: 'KTB Sport',
      verificationLink,
    };

    const emailHtml = await compileTemplate(
      'verifyEmailTemplate',
      templateData
    );

    const { data, error } = await sendEmail({
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: `Xác thực đăng ký tài khoản`,
      text: '',
      html: emailHtml,
    });

    if (error) {
      return res.status(500).json({
        error: `email service error: ${error}`,
      });
    }

    await newUser.save();

    res.status(201).json({
      data: {
        userId: newUser._id,
        accessToken,
        refreshToken,
        email: data,
      },
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

    const { accessToken, refreshToken } = generateToken({
      userId: existingUser._id,
    });

    existingUser.refreshToken = refreshToken;

    await existingUser.save();

    res.status(200).json({
      data: {
        userId: existingUser._id,
        accessToken,
        refreshToken,
      },
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (error, payload) => {
        if (error) {
          if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired!' });
          } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid Token!' });
          } else {
            return res.status(401).json({ error: 'Authentication error!' });
          }
        }

        const existingUser = await User.findById(payload.userId);
        if (!existingUser)
          return res.status(404).json({ error: 'User not found!' });

        const token = generateToken({ userId: existingUser._id });

        existingUser.refreshToken = token.refreshToken;
        await existingUser.save();

        return res.status(200).json({
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          error: false,
        });
      }
    );
  } catch (error) {
    logError(error, res);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export const logout = async (req, res) => {
  try {
    const { userId } = req.userId;

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found!',
      });
    }

    existingUser.refreshToken = null;

    await existingUser.save();

    res.sendStatus(204);
  } catch (error) {
    logError(error, res);
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const { userId } = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET);

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({
        error: 'Invalid on verifying email',
      });
    }

    existingUser.emailVerificationToken = null;

    await existingUser.save();

    return res.status(200).json({
      error: false,
      message: 'Verify email successfully!',
    });
  } catch (error) {
    console.log(error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Invalid on verifying email',
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid on verifying email',
      });
    }

    return res.status(500).json({
      error: 'Invalid on verifying email',
    });
  }
};

export const loginAdminPage = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields!' });
    }

    // Tìm kiếm người dùng theo email
    const existingUser = await User.findOne({ email }).populate('role');

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found!' });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials!' });
    }

    // Kiểm tra vai trò người dùng
    const allowedRoles = ['Quản trị viên', 'Nhân viên'];
    if (!allowedRoles.includes(existingUser.role.role)) {
      return res.status(403).json({
        error: 'Access denied! Only admin and staff can login.',
      });
    }

    // Tạo token truy cập
    const { accessToken, refreshToken } = generateToken({
      userId: existingUser._id,
    });

    // Cập nhật refresh token trong database
    existingUser.refreshToken = refreshToken;
    await existingUser.save();

    res.status(200).json({
      data: {
        userId: existingUser._id,
        accessToken,
        refreshToken,
      },
      error: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
